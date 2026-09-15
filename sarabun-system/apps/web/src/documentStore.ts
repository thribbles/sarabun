/**
 * documentStore.ts
 * จัดการรายการเอกสารราชการทั้งหมดใน localStorage
 * รองรับ CRUD: สร้าง / อ่าน / อัปเดต / ลบ
 */
import { PrintFields } from "../components/print/PrintPage";
import { DocumentTypeCode } from "../components/print/PrintPage";

const STORE_KEY = "sarabun_documents";

export interface SavedDocument {
  id: string;
  docType: DocumentTypeCode;
  fields: PrintFields;
  createdAt: string;   // ISO string
  updatedAt: string;   // ISO string
  createdBy?: string;  // username ผู้สร้าง (ถ้ามี)
}

/** โหลดรายการเอกสารทั้งหมดจาก localStorage */
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
function saveDocuments(docs: SavedDocument[]): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(docs));
}

/** สร้างเอกสารใหม่ — คืนค่า id ที่สร้างขึ้น */
export function createDocument(
  docType: DocumentTypeCode,
  fields: PrintFields,
  createdBy?: string
): SavedDocument {
  const now = new Date().toISOString();
  const doc: SavedDocument = {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    docType,
    fields,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };
  const docs = loadDocuments();
  docs.unshift(doc); // วางใหม่ไว้หัวรายการ
  saveDocuments(docs);
  return doc;
}

/** อัปเดตเอกสารที่มีอยู่แล้ว */
export function updateDocument(
  id: string,
  docType: DocumentTypeCode,
  fields: PrintFields
): boolean {
  const docs = loadDocuments();
  const idx = docs.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  docs[idx] = {
    ...docs[idx],
    docType,
    fields,
    updatedAt: new Date().toISOString(),
  };
  saveDocuments(docs);
  return true;
}

/** ลบเอกสาร */
export function deleteDocument(id: string): boolean {
  const docs = loadDocuments();
  const filtered = docs.filter((d) => d.id !== id);
  if (filtered.length === docs.length) return false;
  saveDocuments(filtered);
  return true;
}

/** หาเอกสารจาก id */
export function getDocument(id: string): SavedDocument | undefined {
  return loadDocuments().find((d) => d.id === id);
}

/** ฟังก์ชันช่วย: แสดงประเภทหนังสือเป็นข้อความไทย */
export function docTypeLabel(docType: DocumentTypeCode): string {
  return docType === "memo" ? "หนังสือภายใน" : "หนังสือภายนอก";
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
