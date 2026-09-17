import { PrintFields, DocumentTypeCode } from "../../components/print/PrintPage";

// รองรับทั้งการเรียกผ่าน Vite proxy (/api) และ direct (http://localhost:3001)
const API_BASE_URL = "/api";
const DIRECT_API_URL = "http://localhost:3001";

export interface ApiDocument {
  id: string;
  docType: DocumentTypeCode;
  documentNo?: string;
  subject?: string;
  toPerson?: string;
  reference?: string;
  status: string;
  departmentId?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  fields: PrintFields;
}

export interface CreateDocumentPayload {
  subject: string;
  docType: DocumentTypeCode;
  documentNo?: string;
  toPerson?: string;
  reference?: string;
  status?: string;
  createdById?: string;
  departmentId?: string;
  fields: PrintFields;
}

export interface UpdateDocumentPayload {
  subject?: string;
  docType?: DocumentTypeCode;
  documentNo?: string;
  toPerson?: string;
  reference?: string;
  status?: string;
  fields?: PrintFields;
}

/**
 * ดึง base URL ที่ใช้งานได้ (ลองผ่าน proxy ก่อน ถ้าไม่ได้ลอง direct)
 */
async function fetchWithFallback(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  const signal = options.signal || controller.signal;

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    // ถ้า proxy ล้มเหลว ลอง direct url
    return fetch(`${DIRECT_API_URL}${endpoint}`, options);
  }
}

/**
 * ตรวจสอบความพร้อมของ Backend API
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetchWithFallback("/documents?page=1", {
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * ดึงรายการเอกสารทั้งหมดจาก API
 */
export async function apiGetDocuments(params?: {
  q?: string;
  status?: string;
  department?: string;
}): Promise<ApiDocument[]> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.status) query.set("status", params.status);
  if (params?.department) query.set("department", params.department);
  query.set("page", "1");

  const res = await fetchWithFallback(`/documents?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch documents: ${res.statusText}`);
  }
  return res.json();
}

/**
 * ดึงข้อมูลเอกสารตาม ID
 */
export async function apiGetDocument(id: string): Promise<ApiDocument> {
  const res = await fetchWithFallback(`/documents/${id}`);
  if (!res.ok) {
    throw new Error(`Document not found: ${res.statusText}`);
  }
  return res.json();
}

/**
 * บันทึกสร้างเอกสารใหม่บน Database ผ่าน API
 */
export async function apiCreateDocument(payload: CreateDocumentPayload): Promise<ApiDocument> {
  const res = await fetchWithFallback("/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to create document: ${res.statusText}`);
  }
  return res.json();
}

/**
 * อัปเดตข้อมูลเอกสารบน Database ผ่าน API
 */
export async function apiUpdateDocument(
  id: string,
  payload: UpdateDocumentPayload
): Promise<ApiDocument> {
  const res = await fetchWithFallback(`/documents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to update document: ${res.statusText}`);
  }
  return res.json();
}

/**
 * ลบเอกสารออกจาก Database ผ่าน API
 */
export async function apiDeleteDocument(id: string): Promise<boolean> {
  const res = await fetchWithFallback(`/documents/${id}`, {
    method: "DELETE",
  });
  return res.ok;
}
