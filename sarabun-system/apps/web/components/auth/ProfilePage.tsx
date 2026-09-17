import React, { useState } from "react";
import { UserMember, updateMemberProfile } from "../../src/authTypes";
import { PRACHIN_BURI_DIVISIONS } from "../../src/sampleData";

interface ProfilePageProps {
  currentUser: UserMember;
  onUpdate: (updated: UserMember) => void;
  onBack: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, onUpdate, onBack }) => {
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [position, setPosition] = useState(currentUser.position);
  const [division, setDivision] = useState(currentUser.division);
  const [section, setSection] = useState(currentUser.section || "");
  const [phone, setPhone] = useState(currentUser.phone);
  const [docPrefix, setDocPrefix] = useState(currentUser.docPrefix);
  const [newPassword, setNewPassword] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<UserMember> = {
      fullName: fullName.trim(),
      position: position.trim(),
      division,
      section: section.trim(),
      phone: phone.trim(),
      docPrefix: docPrefix.trim(),
    };
    if (newPassword.trim()) {
      updates.password = newPassword.trim();
    }

    const updated = updateMemberProfile(currentUser.id, updates);
    if (updated) {
      onUpdate(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="profile-page-container" style={{ padding: "32px 24px", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            ⚙️ การตั้งค่าและแก้ไขข้อมูลโปรไฟล์
          </h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
            ข้อมูลส่วนบุคคล สังกัดกอง/ฝ่าย และรหัสหนังสือราชการประจำตำแหน่ง
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            backgroundColor: "#ffffff",
            color: "#475569",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          ← กลับหน้าหลัก
        </button>
      </div>

      {saveSuccess && (
        <div
          style={{
            backgroundColor: "#ecfdf5",
            color: "#065f46",
            border: "1px solid #a7f3d0",
            padding: "12px 16px",
            borderRadius: "8px",
            fontSize: "14.5px",
            fontWeight: 600,
            marginBottom: "20px",
          }}
        >
          ✓ บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว ข้อมูลจะถูกนำไปใช้ในหนังสือราชการโดยอัตโนมัติ
        </div>
      )}

      {/* Form Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          padding: "28px 32px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* User info banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "16px",
              backgroundColor: "#f8fafc",
              borderRadius: "10px",
              marginBottom: "24px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                backgroundColor: "#065f46",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: 700,
              }}
            >
              {currentUser.fullName ? currentUser.fullName.charAt(0) : "👤"}
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                {currentUser.fullName}
              </div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                ชื่อผู้ใช้งานในระบบ: <strong>{currentUser.username}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                ชื่อ-นามสกุล (พร้อมคำนำหน้า):
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                ตำแหน่งราชการ:
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                สังกัดสำนัก / กอง (อบจ.ปราจีนบุรี):
              </label>
              <select
                value={division}
                onChange={(e) => {
                  const sel = e.target.value;
                  setDivision(sel);
                  const match = PRACHIN_BURI_DIVISIONS.find((d) => d.name === sel);
                  if (match) {
                    setPhone(match.phone);
                    setDocPrefix(match.docPrefix);
                    if (match.sections && match.sections.length > 0) {
                      setSection(match.sections[0]);
                    }
                  }
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  backgroundColor: "#ffffff",
                  boxSizing: "border-box",
                }}
              >
                {PRACHIN_BURI_DIVISIONS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                ฝ่าย / งาน:
              </label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                รหัสหนังสือประจำกอง (Doc Prefix):
              </label>
              <input
                type="text"
                value={docPrefix}
                onChange={(e) => setDocPrefix(e.target.value)}
                placeholder="เช่น ปจ ๕๑๐๐๑/"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                เบอร์โทรศัพท์ติดต่อ:
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "24px", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
              เปลี่ยนรหัสผ่านใหม่ (เว้นว่างไว้หากไม่ต้องการเปลี่ยน):
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="ระบุรหัสผ่านใหม่"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button
              type="button"
              onClick={onBack}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#475569",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#065f46",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 2px 5px rgba(6, 95, 70, 0.3)",
              }}
            >
              💾 บันทึกการเปลี่ยนแปลง
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
