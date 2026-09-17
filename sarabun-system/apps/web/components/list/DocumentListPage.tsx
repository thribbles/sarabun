import React, { useState, useCallback, useEffect } from "react";
import {
  SavedDocument,
  loadDocuments,
  deleteDocument,
  docTypeLabel,
  docStatusMeta,
  formatThaiDate,
  syncDocumentsFromApi,
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
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const reload = useCallback(() => setDocs(loadDocuments()), []);

  // ทำการซิงค์ข้อมูลกับ Backend API (NestJS + SQLite)
  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await syncDocumentsFromApi();
      setDocs(res.docs);
      setIsOnline(res.isOnline);
    } catch {
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    handleSync();
  }, [handleSync]);

  const handleDelete = (id: string) => {
    deleteDocument(id);
    setDeleteConfirm(null);
    reload();
  };

  const filtered = docs.filter((d) => {
    const matchType = filterType === "all" || d.docType === filterType;
    const matchStatus = filterStatus === "all" || (d.status || "DRAFT") === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (d.fields?.subject || "").toLowerCase().includes(q) ||
      (d.fields?.documentNo || "").toLowerCase().includes(q) ||
      (d.fields?.to || "").toLowerCase().includes(q) ||
      (d.fields?.department || "").toLowerCase().includes(q) ||
      (d.createdBy || "").toLowerCase().includes(q);
    return matchType && matchStatus && matchSearch;
  });

  return (
    <div className="doclist-page">
      {/* ─── Page Header ─── */}
      <div className="doclist-header">
        <div className="doclist-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h1 className="doclist-title" style={{ margin: 0 }}>📂 รายการหนังสือราชการ</h1>
            {/* Status Connection Indicator */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "20px",
                backgroundColor: isOnline ? "#ecfdf5" : "#fefce8",
                color: isOnline ? "#047857" : "#b45309",
                border: isOnline ? "1px solid #a7f3d0" : "1px solid #fde68a",
              }}
              title={
                isOnline
                  ? "เชื่อมต่อฐานข้อมูล SQLite Backend เรียบร้อยแล้ว (พอร์ต 3001)"
                  : "ระบบกำลังทำงานในโหมด Offline LocalStorage บันทึกในเบราว์เซอร์"
              }
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: isOnline ? "#10b981" : "#f59e0b",
                  display: "inline-block",
                }}
              />
              {isOnline ? "ฐานข้อมูล SQLite ออนไลน์" : "โหมดออฟไลน์ (เบราว์เซอร์)"}
            </span>

            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              style={{
                background: "transparent",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                padding: "2px 8px",
                fontSize: "12px",
                cursor: isSyncing ? "not-allowed" : "pointer",
                color: "#475569",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
              title="กดเพื่อรีเฟรชและซิงค์ข้อมูลกับฐานข้อมูลล่าสุด"
            >
              <span style={{ display: "inline-block", animation: isSyncing ? "spin 1s linear infinite" : "none" }}>
                🔄
              </span>
              {isSyncing ? "กำลังซิงค์..." : "ซิงค์ข้อมูล"}
            </button>
          </div>
          <span className="doclist-count">
            {filtered.length} รายการ{filtered.length !== docs.length ? ` (จากทั้งหมด ${docs.length})` : ""}
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
          {/* สถานะเอกสาร */}
          <div className="doclist-filter-tabs">
            {[
              { id: "all", label: "ทุกสถานะ" },
              { id: "DRAFT", label: "ร่าง" },
              { id: "REVIEW", label: "รอตรวจ" },
              { id: "APPROVED", label: "อนุมัติ" },
              { id: "PRINTED", label: "พิมพ์แล้ว" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                className={`doclist-filter-tab ${filterStatus === st.id ? "active" : ""}`}
                onClick={() => setFilterStatus(st.id)}
                style={{ fontSize: "12px", padding: "4px 8px" }}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* ประเภทเอกสาร */}
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
              : "ลองเปลี่ยนคำค้นหาหรือตัวกรองประเภท/สถานะ"}
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
                <th style={{ width: "45px", textAlign: "center" }}>ลำดับ</th>
                <th style={{ width: "105px", textAlign: "center" }}>ประเภท</th>
                <th style={{ width: "95px", textAlign: "center" }}>สถานะ</th>
                <th style={{ width: "135px" }}>เลขที่หนังสือ</th>
                <th>เรื่อง / รายละเอียด</th>
                <th style={{ width: "120px" }}>วันที่หนังสือ</th>
                <th style={{ width: "140px" }}>ผู้จัดทำ / ปรับปรุง</th>
                <th style={{ width: "215px", textAlign: "center" }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, idx) => {
                const statusMeta = docStatusMeta(doc.status);
                return (
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
                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            backgroundColor: statusMeta.bg,
                            color: statusMeta.color,
                            display: "inline-block",
                          }}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                      <td>
                        <span className="doclist-cell-docno">{doc.fields?.documentNo || "—"}</span>
                      </td>
                      <td>
                        <div className="doclist-cell-subject-wrap">
                          <button
                            type="button"
                            className="doclist-cell-subject-btn"
                            onClick={() => onViewDoc(doc)}
                            title="คลิกเพื่อดูตัวอย่างและพิมพ์"
                          >
                            {doc.fields?.subject || <span className="doccard-no-subject">(ไม่มีเรื่อง)</span>}
                          </button>
                          <div className="doclist-cell-submeta">
                            {doc.docType === "memo" ? (
                              <span>🏢 {doc.fields?.department || "—"}</span>
                            ) : (
                              <span>🏛️ {doc.fields?.agencyTop || "—"}</span>
                            )}
                            {doc.fields?.to && <span className="doclist-cell-to">· 👤 {doc.fields.to}</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="doclist-cell-date">{doc.fields?.date || "—"}</span>
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
                        <td colSpan={8}>
                          <div className="doccard-delete-confirm">
                            <span>⚠️ ยืนยันการลบหนังสือเรื่อง "{doc.fields?.subject || docTypeLabel(doc.docType)}"?</span>
                            <button
                              type="button"
                              className="doccard-btn doccard-btn-confirm-yes"
                              onClick={() => handleDelete(doc.id)}
                            >
                              ยืนยันลบ
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Grid View (Card Format) ─── */}
      {filtered.length > 0 && viewMode === "grid" && (
        <div className="doclist-grid">
          {filtered.map((doc) => {
            const statusMeta = docStatusMeta(doc.status);
            return (
              <div key={doc.id} className="doccard">
                <div className="doccard-header">
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span className={`doccard-type-badge ${doc.docType === "memo" ? "badge-memo" : "badge-external"}`}>
                      {doc.docType === "memo" ? "📄 บันทึกข้อความ" : "🏛️ หนังสือภายนอก"}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "12px",
                        backgroundColor: statusMeta.bg,
                        color: statusMeta.color,
                      }}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                  <span className="doccard-date">{formatThaiDate(doc.updatedAt)}</span>
                </div>

                <div className="doccard-body">
                  <div className="doccard-docno">เลขที่: {doc.fields?.documentNo || "—"}</div>
                  <h3 className="doccard-subject" title={doc.fields?.subject || "ไม่มีเรื่อง"}>
                    {doc.fields?.subject || <span className="doccard-no-subject">(ไม่มีเรื่อง)</span>}
                  </h3>
                  <div className="doccard-meta-line">
                    <span className="doccard-meta-label">เรียน:</span>
                    <span className="doccard-meta-val">{doc.fields?.to || "—"}</span>
                  </div>
                  <div className="doccard-meta-line">
                    <span className="doccard-meta-label">สังกัด:</span>
                    <span className="doccard-meta-val">
                      {doc.docType === "memo"
                        ? doc.fields?.department || "—"
                        : doc.fields?.agencyTop || "—"}
                    </span>
                  </div>
                  {doc.createdBy && (
                    <div className="doccard-meta-line">
                      <span className="doccard-meta-label">ผู้จัดทำ:</span>
                      <span className="doccard-meta-val">{doc.createdBy}</span>
                    </div>
                  )}
                </div>

                {deleteConfirm === doc.id ? (
                  <div className="doccard-delete-confirm">
                    <span>ลบเอกสารนี้?</span>
                    <button
                      type="button"
                      className="doccard-btn doccard-btn-confirm-yes"
                      onClick={() => handleDelete(doc.id)}
                    >
                      ยืนยัน
                    </button>
                    <button
                      type="button"
                      className="doccard-btn doccard-btn-confirm-no"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <div className="doccard-actions">
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
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
