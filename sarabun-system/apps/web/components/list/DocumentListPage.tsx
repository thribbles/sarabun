import React, { useState, useCallback } from "react";
import {
  SavedDocument,
  loadDocuments,
  deleteDocument,
  docTypeLabel,
  formatThaiDate,
} from "../../src/documentStore";
import { DocumentTypeCode } from "../print/PrintPage";

interface DocumentListPageProps {
  currentUser?: { fullName: string; username: string } | null;
  onCreateNew: (docType: DocumentTypeCode) => void;
  onEditDoc: (doc: SavedDocument) => void;
  onViewDoc: (doc: SavedDocument) => void;
}

export const DocumentListPage: React.FC<DocumentListPageProps> = ({
  currentUser,
  onCreateNew,
  onEditDoc,
  onViewDoc,
}) => {
  const [docs, setDocs] = useState<SavedDocument[]>(() => loadDocuments());
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | DocumentTypeCode>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const reload = useCallback(() => setDocs(loadDocuments()), []);

  const handleDelete = (id: string) => {
    deleteDocument(id);
    setDeleteConfirm(null);
    reload();
  };

  const filtered = docs.filter((d) => {
    const matchType = filterType === "all" || d.docType === filterType;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (d.fields.subject || "").toLowerCase().includes(q) ||
      (d.fields.documentNo || "").toLowerCase().includes(q) ||
      (d.fields.to || "").toLowerCase().includes(q) ||
      (d.fields.department || "").toLowerCase().includes(q) ||
      (d.createdBy || "").toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  return (
    <div className="doclist-page">
      {/* ─── Page Header ─── */}
      <div className="doclist-header">
        <div className="doclist-header-left">
          <h1 className="doclist-title">📂 รายการหนังสือราชการ</h1>
          <span className="doclist-count">
            {filtered.length} รายการ{filtered.length !== docs.length ? ` (จาก ${docs.length})` : ""}
          </span>
        </div>
        <div className="doclist-header-actions">
          <button
            type="button"
            className="btn-new-doc btn-new-memo"
            onClick={() => onCreateNew("memo")}
          >
            + หนังสือภายใน
          </button>
          <button
            type="button"
            className="btn-new-doc btn-new-external"
            onClick={() => onCreateNew("external")}
          >
            + หนังสือภายนอก
          </button>
        </div>
      </div>

      {/* ─── Toolbar: search + filter + view mode ─── */}
      <div className="doclist-toolbar">
        <div className="doclist-search-wrap">
          <span className="doclist-search-icon">🔍</span>
          <input
            className="doclist-search"
            type="text"
            placeholder="ค้นหา เรื่อง, เลขที่, เรียน, ส่วนราชการ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="doclist-search-clear" onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        <div className="doclist-toolbar-right">
          <div className="doclist-filter-tabs">
            {(["all", "memo", "external"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`doclist-filter-tab ${filterType === t ? "active" : ""}`}
                onClick={() => setFilterType(t)}
              >
                {t === "all" ? "ทั้งหมด" : t === "memo" ? "ภายใน" : "ภายนอก"}
              </button>
            ))}
          </div>

          <div className="doclist-view-toggle">
            <button
              type="button"
              className={`doclist-view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="แสดงเป็นตารางรายการ (List View)"
            >
              ☰ รายการ
            </button>
            <button
              type="button"
              className={`doclist-view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="แสดงเป็นการ์ด (Card View)"
            >
              ⊞ การ์ด
            </button>
          </div>
        </div>
      </div>

      {/* ─── Empty state ─── */}
      {filtered.length === 0 && (
        <div className="doclist-empty">
          <div className="doclist-empty-icon">📄</div>
          <div className="doclist-empty-title">
            {docs.length === 0 ? "ยังไม่มีหนังสือราชการ" : "ไม่พบรายการที่ค้นหา"}
          </div>
          <div className="doclist-empty-sub">
            {docs.length === 0
              ? "กดปุ่ม \"+ หนังสือภายใน\" หรือ \"+ หนังสือภายนอก\" เพื่อเริ่มร่างหนังสือ"
              : "ลองเปลี่ยนคำค้นหาหรือตัวกรองประเภท"}
          </div>
          {docs.length === 0 && (
            <div className="doclist-empty-actions">
              <button type="button" className="btn-new-doc btn-new-memo" onClick={() => onCreateNew("memo")}>
                + หนังสือภายใน
              </button>
              <button type="button" className="btn-new-doc btn-new-external" onClick={() => onCreateNew("external")}>
                + หนังสือภายนอก
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── List View (Table Format) ─── */}
      {filtered.length > 0 && viewMode === "list" && (
        <div className="doclist-table-wrap">
          <table className="doclist-table">
            <thead>
              <tr>
                <th style={{ width: "50px", textAlign: "center" }}>ลำดับ</th>
                <th style={{ width: "115px", textAlign: "center" }}>ประเภท</th>
                <th style={{ width: "140px" }}>เลขที่หนังสือ</th>
                <th>เรื่อง / รายละเอียด</th>
                <th style={{ width: "125px" }}>วันที่หนังสือ</th>
                <th style={{ width: "145px" }}>ผู้จัดทำ / ปรับปรุง</th>
                <th style={{ width: "215px", textAlign: "center" }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, idx) => (
                <React.Fragment key={doc.id}>
                  <tr className="doclist-row">
                    <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "12.5px" }}>
                      {idx + 1}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`doccard-type-badge ${doc.docType === "memo" ? "badge-memo" : "badge-external"}`}>
                        {doc.docType === "memo" ? "📄 ภายใน" : "🏛️ ภายนอก"}
                      </span>
                    </td>
                    <td>
                      <span className="doclist-cell-docno">{doc.fields.documentNo || "—"}</span>
                    </td>
                    <td>
                      <div className="doclist-cell-subject-wrap">
                        <button
                          type="button"
                          className="doclist-cell-subject-btn"
                          onClick={() => onViewDoc(doc)}
                          title="คลิกเพื่อดูตัวอย่างและพิมพ์"
                        >
                          {doc.fields.subject || <span className="doccard-no-subject">(ไม่มีเรื่อง)</span>}
                        </button>
                        <div className="doclist-cell-submeta">
                          {doc.docType === "memo" ? (
                            <span>🏢 {doc.fields.department || "—"}</span>
                          ) : (
                            <span>🏛️ {doc.fields.agencyTop || "—"}</span>
                          )}
                          {doc.fields.to && <span className="doclist-cell-to">· 👤 {doc.fields.to}</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="doclist-cell-date">{doc.fields.date || "—"}</span>
                    </td>
                    <td>
                      <div className="doclist-cell-author-wrap">
                        <span className="doclist-cell-author">{doc.createdBy || "เจ้าหน้าที่"}</span>
                        <span className="doclist-cell-updated">{formatThaiDate(doc.updatedAt)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="doclist-row-actions">
                        <button
                          type="button"
                          className="doccard-btn doccard-btn-view"
                          onClick={() => onViewDoc(doc)}
                          title="ดูพรีวิวและพิมพ์"
                        >
                          🖨️ ดู/พิมพ์
                        </button>
                        <button
                          type="button"
                          className="doccard-btn doccard-btn-edit"
                          onClick={() => onEditDoc(doc)}
                          title="แก้ไขเนื้อหา"
                        >
                          ✏️ แก้ไข
                        </button>
                        <button
                          type="button"
                          className="doccard-btn doccard-btn-delete"
                          onClick={() => setDeleteConfirm(doc.id)}
                          title="ลบเอกสาร"
                        >
                          🗑️ ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                  {deleteConfirm === doc.id && (
                    <tr className="doclist-delete-confirm-row">
                      <td colSpan={7}>
                        <div className="doccard-delete-confirm">
                          <span>⚠️ ยืนยันการลบหนังสือเรื่อง "{doc.fields.subject || docTypeLabel(doc.docType)}"?</span>
                          <button
                            type="button"
                            className="doccard-btn doccard-btn-confirm-yes"
                            onClick={() => handleDelete(doc.id)}
                          >
                            ลบเอกสาร
                          </button>
                          <button
                            type="button"
                            className="doccard-btn doccard-btn-confirm-no"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Grid View (Card Format) ─── */}
      {filtered.length > 0 && viewMode === "grid" && (
        <div className="doclist-grid">
          {filtered.map((doc) => (
            <div key={doc.id} className="doclist-card">
              {/* Type Badge */}
              <div className="doccard-top">
                <span className={`doccard-type-badge ${doc.docType === "memo" ? "badge-memo" : "badge-external"}`}>
                  {doc.docType === "memo" ? "📄 ภายใน" : "🏛️ ภายนอก"}
                </span>
                <span className="doccard-docno">{doc.fields.documentNo || "—"}</span>
                <span className="doccard-date-chip">{doc.fields.date || "—"}</span>
              </div>

              {/* Subject */}
              <div className="doccard-subject" title={doc.fields.subject || ""}>
                {doc.fields.subject || <span className="doccard-no-subject">(ไม่มีเรื่อง)</span>}
              </div>

              {/* Meta row */}
              <div className="doccard-meta">
                {doc.docType === "memo" ? (
                  <span className="doccard-meta-item" title={doc.fields.department}>
                    🏢 {doc.fields.department || "—"}
                  </span>
                ) : (
                  <span className="doccard-meta-item" title={doc.fields.agencyTop}>
                    🏛️ {doc.fields.agencyTop || "—"}
                  </span>
                )}
                {doc.fields.to && (
                  <span className="doccard-meta-item doccard-to" title={doc.fields.to}>
                    👤 {doc.fields.to}
                  </span>
                )}
              </div>

              {/* Timestamps */}
              <div className="doccard-timestamps">
                <span>สร้าง: {formatThaiDate(doc.createdAt)}</span>
                {doc.createdBy && <span className="doccard-creator"> · {doc.createdBy}</span>}
                {doc.updatedAt !== doc.createdAt && (
                  <span> · แก้ไข: {formatThaiDate(doc.updatedAt)}</span>
                )}
              </div>

              {/* Action buttons */}
              <div className="doccard-actions">
                <button
                  type="button"
                  className="doccard-btn doccard-btn-view"
                  onClick={() => onViewDoc(doc)}
                  title="ดูพรีวิวและพิมพ์"
                >
                  🖨️ ดู / พิมพ์
                </button>
                <button
                  type="button"
                  className="doccard-btn doccard-btn-edit"
                  onClick={() => onEditDoc(doc)}
                  title="แก้ไขเนื้อหา"
                >
                  ✏️ แก้ไข
                </button>
                <button
                  type="button"
                  className="doccard-btn doccard-btn-delete"
                  onClick={() => setDeleteConfirm(doc.id)}
                  title="ลบเอกสาร"
                >
                  🗑️ ลบ
                </button>
              </div>

              {/* Inline delete confirm */}
              {deleteConfirm === doc.id && (
                <div className="doccard-delete-confirm">
                  <span>ยืนยันลบ "{doc.fields.subject || docTypeLabel(doc.docType)}"?</span>
                  <button
                    type="button"
                    className="doccard-btn doccard-btn-confirm-yes"
                    onClick={() => handleDelete(doc.id)}
                  >
                    ลบเลย
                  </button>
                  <button
                    type="button"
                    className="doccard-btn doccard-btn-confirm-no"
                    onClick={() => setDeleteConfirm(null)}
                  >
                    ยกเลิก
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
