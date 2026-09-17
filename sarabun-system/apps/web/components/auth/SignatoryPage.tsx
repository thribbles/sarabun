import React, { useState, useEffect } from "react";
import {
  Signatory,
  loadSignatories,
  addSignatory,
  updateSignatory,
  deleteSignatory,
  resetToDefaultSignatories,
  getSignatoriesForUser,
} from "../../src/signatoryStore";
import { UserMember } from "../../src/authTypes";
import { PRACHIN_BURI_DIVISIONS } from "../../src/sampleData";

interface SignatoryPageProps {
  currentUser: UserMember;
  onBack: () => void;
}

const emptyForm = (defaultDiv: string = "ทั้งหมด"): Omit<Signatory, "id"> => ({
  name: "",
  position: "",
  note: "",
  division: defaultDiv,
});

export const SignatoryPage: React.FC<SignatoryPageProps> = ({ currentUser, onBack }) => {
  const [list, setList] = useState<Signatory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Signatory, "id">>(emptyForm());
  const [saveMsg, setSaveMsg] = useState<string>("");

  const isNayok =
    currentUser.username?.toLowerCase() === "nayok" ||
    currentUser.position?.includes("นายก") ||
    currentUser.division === "องค์การบริหารส่วนจังหวัดปราจีนบุรี";

  const [selectedDivFilter, setSelectedDivFilter] = useState<string>("ทั้งหมด");

  const refresh = () => {
    if (isNayok) {
      const all = loadSignatories();
      if (selectedDivFilter === "ทั้งหมด") {
        setList(all);
      } else {
        setList(all.filter((s) => s.division === selectedDivFilter || s.division === "ทั้งหมด"));
      }
    } else {
      setList(getSignatoriesForUser(currentUser));
    }
  };

  useEffect(() => {
    refresh();
  }, [currentUser?.id, currentUser?.division, selectedDivFilter]);

  const handleOpenAdd = () => {
    const defaultDiv = isNayok ? "ทั้งหมด" : currentUser.division;
    setForm(emptyForm(defaultDiv));
    setEditingId(null);
    setShowForm(true);
    setSaveMsg("");
  };

  const handleOpenEdit = (s: Signatory) => {
    setForm({
      name: s.name,
      position: s.position,
      note: s.note || "",
      division: s.division || "ทั้งหมด",
    });
    setEditingId(s.id);
    setShowForm(true);
    setSaveMsg("");
  };

  const handleUseMyInfo = () => {
    setForm({
      name: `(${currentUser.fullName})`,
      position: currentUser.position,
      note: `ฉันเอง (${currentUser.division})`,
      division: isNayok ? "ทั้งหมด" : currentUser.division,
    });
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.position.trim()) {
      setSaveMsg("⚠️ กรุณากรอกชื่อและตำแหน่งให้ครบ");
      return;
    }
    if (editingId) {
      updateSignatory(editingId, form);
    } else {
      addSignatory(form);
    }
    refresh();
    setShowForm(false);
    setSaveMsg("");
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("ต้องการลบผู้ลงนามนี้ออกจากรายการ?")) return;
    deleteSignatory(id);
    refresh();
  };

  const handleResetDefaults = () => {
    if (!window.confirm("ต้องการคืนค่ารายชื่อผู้ลงนามมาตรฐาน อบจ.ปราจีนบุรี หรือไม่?")) return;
    resetToDefaultSignatories();
    refresh();
  };

  const isPreset = (id: string) => id.startsWith("preset-");

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: "6px 14px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            background: "#ffffff",
            cursor: "pointer",
            fontSize: "13px",
            color: "#374151",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          ← กลับ
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#065f46" }}>
            ✍️ จัดการผู้ลงนาม
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6b7280" }}>
            เพิ่ม / แก้ไข รายชื่อผู้ลงนามที่ใช้บ่อย — สามารถเลือกในขณะร่างเอกสารได้
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={handleResetDefaults}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
            title="คืนค่ารายชื่อผู้ลงนามมาตรฐาน อบจ.ปราจีนบุรี"
          >
            🔄 คืนค่าเริ่มต้น
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(5,150,105,0.25)",
            }}
          >
            + เพิ่มผู้ลงนาม
          </button>
        </div>
      </div>

      {/* Banner สำหรับ นายก อบจ. หรือ เจ้าหน้าที่แต่ละกอง */}
      {isNayok ? (
        <div style={{ marginBottom: "20px", padding: "12px 16px", backgroundColor: "#ecfdf5", border: "1.5px solid #a7f3d0", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <span style={{ fontSize: "14px", color: "#065f46", fontWeight: 700 }}>
              👑 สิทธิ์นายก อบจ.: สามารถเห็นและลงนามให้ทุกกองได้ทั้งหมด
            </span>
            <div style={{ fontSize: "12px", color: "#047857", marginTop: "2px" }}>
              ผู้บริหารส่วนกลางสามารถกำกับดูแลและเลือกผู้ลงนามได้ทุกสำนัก/กอง
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "#065f46", fontWeight: 600 }}>กรองตามกอง:</span>
            <select
              value={selectedDivFilter}
              onChange={(e) => setSelectedDivFilter(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #6ee7b7", fontSize: "13px", backgroundColor: "#ffffff", color: "#065f46", fontWeight: 500 }}
            >
              <option value="ทั้งหมด">🌐 แสดงทุกกอง</option>
              {PRACHIN_BURI_DIVISIONS.map((d) => (
                <option key={d.name} value={d.name}>📁 {d.name}</option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: "20px", padding: "12px 16px", backgroundColor: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: "10px" }}>
          <span style={{ fontSize: "13.5px", color: "#1e40af", fontWeight: 700 }}>
            🏢 สังกัด: {currentUser.division}
          </span>
          <div style={{ fontSize: "12px", color: "#1d4ed8", marginTop: "2px" }}>
            * ตามระเบียบ: ผู้ลงนามจะลงนามได้เฉพาะในกองของตนเอง และผู้บริหารส่วนกลาง (นายก อบจ. / ปลัด อบจ.)
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1.5px solid #a7f3d0",
            borderRadius: "14px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: "#065f46" }}>
            {editingId ? "✏️ แก้ไขผู้ลงนาม" : "➕ เพิ่มผู้ลงนามใหม่"}
          </h3>

          <div style={{ marginBottom: "12px" }}>
            <button
              type="button"
              onClick={handleUseMyInfo}
              style={{
                padding: "5px 12px",
                borderRadius: "6px",
                border: "1px solid #6ee7b7",
                background: "#d1fae5",
                color: "#065f46",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              🔄 ใช้ข้อมูลของฉัน ({currentUser.fullName})
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>
                ชื่อ-สกุล (รูปแบบ: (นายสมชาย สบายดี)) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="เช่น (นายสมชาย สบายดี)"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #d1d5db",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>
                ตำแหน่ง <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="เช่น นายกองค์การบริหารส่วนจังหวัดปราจีนบุรี"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #d1d5db",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>
                สังกัดกอง (สิทธิ์การลงนาม) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                value={form.division || "ทั้งหมด"}
                onChange={(e) => setForm({ ...form, division: e.target.value })}
                disabled={!isNayok}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #d1d5db",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  backgroundColor: !isNayok ? "#f1f5f9" : "#ffffff",
                  color: "#1e293b",
                }}
              >
                <option value="ทั้งหมด">🌐 ทั้งหมด (ส่วนกลาง เช่น นายก อบจ. / ปลัด อบจ.)</option>
                {PRACHIN_BURI_DIVISIONS.map((d) => (
                  <option key={d.name} value={d.name}>
                    📁 {d.name}
                  </option>
                ))}
              </select>
              {!isNayok && (
                <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                  * ผู้ลงนามจะผูกสิทธิ์ลงนามเฉพาะในสังกัด ({currentUser.division})
                </span>
              )}
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>
                หมายเหตุ (เช่น สังกัด / บทบาท)
              </label>
              <input
                type="text"
                value={form.note || ""}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="เช่น นายก อบจ.ปราจีนบุรี หรือ รักษาราชการแทน"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #d1d5db",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {saveMsg && (
            <div style={{ color: "#b91c1c", fontSize: "13px", marginBottom: "12px" }}>{saveMsg}</div>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                border: "none",
                background: "#059669",
                color: "#fff",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              ✓ บันทึก
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                background: "#ffffff",
                color: "#374151",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {list.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px", color: "#9ca3af", fontSize: "14px" }}>
            ยังไม่มีผู้ลงนามที่บันทึกไว้ — คลิก &quot;เพิ่มผู้ลงนาม&quot; เพื่อเริ่มต้น
          </div>
        )}
        {list.map((s) => (
          <div
            key={s.id}
            style={{
              background: "#ffffff",
              border: isPreset(s.id) ? "1.5px solid #a7f3d0" : "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: isPreset(s.id)
                  ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                  : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {s.name.replace(/[()]/g, "").trim().charAt(0) || "✍"}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#111827" }}>{s.name}</div>
              <div style={{ fontSize: "13px", color: "#475569", marginTop: "2px" }}>{s.position}</div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "1px 8px",
                    borderRadius: "6px",
                    background: (!s.division || s.division === "ทั้งหมด") ? "#e0f2fe" : "#fef3c7",
                    color: (!s.division || s.division === "ทั้งหมด") ? "#0369a1" : "#92400e",
                    border: (!s.division || s.division === "ทั้งหมด") ? "1px solid #bae6fd" : "1px solid #fde68a",
                  }}
                >
                  🏛️ {s.division || "ทั้งหมด"}
                </span>
                {s.note && (
                  <span style={{ fontSize: "12px", color: "#9ca3af" }}>📎 {s.note}</span>
                )}
              </div>
            </div>

            {/* Badges & Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isPreset(s.id) && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "10px",
                    background: "#d1fae5",
                    color: "#065f46",
                    border: "1px solid #6ee7b7",
                  }}
                >
                  มาตรฐาน
                </span>
              )}
              <button
                type="button"
                onClick={() => handleOpenEdit(s)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                  fontSize: "13px",
                  cursor: "pointer",
                  color: "#374151",
                  fontWeight: 600,
                }}
              >
                ✏️ แก้ไข
              </button>
              <button
                type="button"
                onClick={() => handleDelete(s.id)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: "1px solid #fca5a5",
                  background: "#fff5f5",
                  fontSize: "13px",
                  cursor: "pointer",
                  color: "#b91c1c",
                  fontWeight: 600,
                }}
              >
                ลบ
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div
        style={{
          marginTop: "32px",
          padding: "14px 18px",
          background: "#fffbeb",
          borderRadius: "10px",
          border: "1px solid #fde68a",
          fontSize: "13px",
          color: "#92400e",
          lineHeight: 1.6,
        }}
      >
        💡 <strong>วิธีใช้:</strong> รายชื่อที่เพิ่มไว้จะปรากฏในช่อง &quot;เลือกผู้ลงนาม&quot; ระหว่างร่างเอกสาร
        ช่วยให้เลือกชื่อผู้ลงนามได้รวดเร็ว โดยไม่ต้องพิมพ์ใหม่ทุกครั้ง
      </div>
    </div>
  );
};
