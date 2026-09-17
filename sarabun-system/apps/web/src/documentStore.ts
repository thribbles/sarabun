/**
 * documentStore.ts
 * จัดการรายการเอกสารราชการ ทั้งแบบซิงค์กับ Backend API (NestJS + SQLite)
 * และ LocalStorage Cache รองรับการทำงานแบบ Dual-Mode (Online/Offline Resilience)
 */
import { PrintFields } from "../components/print/PrintPage";
import { DocumentTypeCode } from "../components/print/PrintPage";
import {
  apiGetDocuments,
  apiCreateDocument,
  apiUpdateDocument,
  apiDeleteDocument,
  checkApiHealth,
  ApiDocument,
} from "./api/documentsApi";

const STORE_KEY = "sarabun_documents";

export interface SavedDocument {
  id: string;
  docType: DocumentTypeCode;
  documentNo?: string;
  subject?: string;
  fields: PrintFields;
  status?: string;     // DRAFT / REVIEW / APPROVED / PRINTED / CANCELLED
  createdAt: string;   // ISO string
  updatedAt: string;   // ISO string
  createdBy?: string;  // username หรือชื่อผู้สร้าง
  isSynced?: boolean;  // ซิงค์กับฐานข้อมูลแล้วหรือไม่
}

/** โหลดรายการเอกสารทั้งหมดจาก localStorage (Synchronous cache) */
export function loadDocuments(): SavedDocument[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedDocument[];
  } catch {
    return [];
  }
}

/** บันทึกรายการเอกสารทั้งหมดลง localStorage */
export function saveDocuments(docs: SavedDocument[]): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(docs));
  } catch (err) {
    console.warn("Unable to save to localStorage:", err);
  }
}

/** แปลง ApiDocument จาก Backend มาเป็น SavedDocument */
function mapApiDocToSavedDoc(apiDoc: ApiDocument): SavedDocument {
  return {
    id: apiDoc.id,
    docType: apiDoc.docType,
    documentNo: apiDoc.documentNo || apiDoc.fields?.documentNo,
    subject: apiDoc.subject || apiDoc.fields?.subject,
    fields: apiDoc.fields || ({} as PrintFields),
    status: apiDoc.status || "DRAFT",
    createdAt: apiDoc.createdAt,
    updatedAt: apiDoc.updatedAt,
    createdBy: apiDoc.createdById,
    isSynced: true,
  };
}

/**
 * ซิงค์ข้อมูลกับ Backend API (ถ้าออนไลน์) แล้วอัปเดตแคชในเครื่อง
 */
export async function syncDocumentsFromApi(): Promise<{
  docs: SavedDocument[];
  isOnline: boolean;
}> {
  try {
    const isOnline = await checkApiHealth();
    if (!isOnline) {
      return { docs: loadDocuments(), isOnline: false };
    }

    const remoteDocs = await apiGetDocuments();
    const mapped = remoteDocs.map(mapApiDocToSavedDoc);

    // เมิร์จกับเอกสารในเครื่องที่ยังไม่ได้ซิงค์
    const localDocs = loadDocuments();
    const unsyncedLocals = localDocs.filter((l) => !l.isSynced);

    // รวมและเก็บ
    const combined = [...unsyncedLocals, ...mapped.filter(m => !unsyncedLocals.some(u => u.id === m.id))];
    saveDocuments(combined);
    return { docs: combined, isOnline: true };
  } catch (err) {
    console.warn("Failed to sync from API, using offline cache:", err);
    return { docs: loadDocuments(), isOnline: false };
  }
}

/** สร้างเอกสารใหม่ (Synchronous + บันทึกลง LocalStorage) */
export function createDocument(
  docType: DocumentTypeCode,
  fields: PrintFields,
  createdBy?: string,
  status: string = "DRAFT"
): SavedDocument {
  const now = new Date().toISOString();
  const doc: SavedDocument = {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    docType,
    documentNo: fields.documentNo,
    subject: fields.subject,
    fields,
    status,
    createdAt: now,
    updatedAt: now,
    createdBy,
    isSynced: false,
  };
  const docs = loadDocuments();
  docs.unshift(doc);
  saveDocuments(docs);

  // Trigger background sync to API
  createDocumentAsync(docType, fields, createdBy, status).catch(console.warn);

  return doc;
}

/** สร้างเอกสารใหม่ผ่าน Backend API แบบ Async */
export async function createDocumentAsync(
  docType: DocumentTypeCode,
  fields: PrintFields,
  createdBy?: string,
  status: string = "DRAFT"
): Promise<SavedDocument> {
  const now = new Date().toISOString();
  try {
    const res = await apiCreateDocument({
      docType,
      subject: fields.subject || "ไม่มีชื่อเรื่อง",
      documentNo: fields.documentNo,
      toPerson: fields.to,
      reference: fields.reference,
      status,
      createdById: createdBy,
      fields,
    });
    const saved = mapApiDocToSavedDoc(res);

    const docs = loadDocuments();
    // แทนที่หรือเพิ่มใหม่
    const existingIdx = docs.findIndex((d) => d.id === saved.id);
    if (existingIdx !== -1) {
      docs[existingIdx] = saved;
    } else {
      docs.unshift(saved);
    }
    saveDocuments(docs);
    return saved;
  } catch (err) {
    console.warn("API create failed, saved locally:", err);
    // fallback เป็น local
    const fallback: SavedDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      docType,
      documentNo: fields.documentNo,
      subject: fields.subject,
      fields,
      status,
      createdAt: now,
      updatedAt: now,
      createdBy,
      isSynced: false,
    };
    const docs = loadDocuments();
    docs.unshift(fallback);
    saveDocuments(docs);
    return fallback;
  }
}

/** อัปเดตเอกสารที่มีอยู่แล้ว (Synchronous) */
export function updateDocument(
  id: string,
  docType: DocumentTypeCode,
  fields: PrintFields,
  status?: string
): boolean {
  const docs = loadDocuments();
  const idx = docs.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  docs[idx] = {
    ...docs[idx],
    docType,
    documentNo: fields.documentNo,
    subject: fields.subject,
    fields,
    status: status || docs[idx].status || "DRAFT",
    updatedAt: new Date().toISOString(),
    isSynced: false,
  };
  saveDocuments(docs);

  // Background update to API
  updateDocumentAsync(id, docType, fields, status).catch(console.warn);
  return true;
}

/** อัปเดตเอกสารผ่าน API แบบ Async */
export async function updateDocumentAsync(
  id: string,
  docType: DocumentTypeCode,
  fields: PrintFields,
  status?: string
): Promise<boolean> {
  try {
    const updatedApi = await apiUpdateDocument(id, {
      docType,
      subject: fields.subject,
      documentNo: fields.documentNo,
      toPerson: fields.to,
      reference: fields.reference,
      status,
      fields,
    });
    const saved = mapApiDocToSavedDoc(updatedApi);
    const docs = loadDocuments();
    const idx = docs.findIndex((d) => d.id === id);
    if (idx !== -1) {
      docs[idx] = saved;
      saveDocuments(docs);
    }
    return true;
  } catch (err) {
    console.warn("API update failed, updated in local cache:", err);
    return false;
  }
}

/** ลบเอกสาร */
export function deleteDocument(id: string): boolean {
  const docs = loadDocuments();
  const filtered = docs.filter((d) => d.id !== id);
  if (filtered.length === docs.length) return false;
  saveDocuments(filtered);

  // Trigger background delete
  deleteDocumentAsync(id).catch(console.warn);
  return true;
}

/** ลบเอกสารผ่าน API แบบ Async */
export async function deleteDocumentAsync(id: string): Promise<boolean> {
  try {
    await apiDeleteDocument(id);
    return true;
  } catch (err) {
    console.warn("API delete failed, deleted from local cache only:", err);
    return false;
  }
}

/** หาเอกสารจาก id */
export function getDocument(id: string): SavedDocument | undefined {
  return loadDocuments().find((d) => d.id === id);
}

/** ฟังก์ชันช่วย: แสดงประเภทหนังสือเป็นข้อความไทย */
export function docTypeLabel(docType: DocumentTypeCode): string {
  return docType === "memo" ? "หนังสือภายใน" : "หนังสือภายนอก";
}

/** ฟังก์ชันช่วย: แปลงสถานะเอกสารเป็นป้ายและสี */
export function docStatusMeta(status?: string): { label: string; color: string; bg: string } {
  switch (status) {
    case "REVIEW":
      return { label: "รอตรวจสอบ", color: "#b45309", bg: "#fef3c7" };
    case "APPROVED":
      return { label: "อนุมัติแล้ว", color: "#15803d", bg: "#dcfce7" };
    case "PRINTED":
      return { label: "พิมพ์แล้ว", color: "#1d4ed8", bg: "#dbeafe" };
    case "CANCELLED":
      return { label: "ยกเลิก", color: "#b91c1c", bg: "#fee2e2" };
    case "DRAFT":
    default:
      return { label: "ร่างเอกสาร", color: "#475569", bg: "#f1f5f9" };
  }
}

/** ฟังก์ชันช่วย: แปลง ISO date string เป็นวันที่ไทยแบบย่อ */
export function formatThaiDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
