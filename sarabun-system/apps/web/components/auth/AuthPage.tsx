import React, { useState } from "react";
import { UserMember, loadAllMembers, registerMember } from "../../src/authTypes";
import { PRACHIN_BURI_DIVISIONS } from "../../src/sampleData";

interface AuthPageProps {
  onLogin: (user: UserMember) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Register form state
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regPosition, setRegPosition] = useState("เจ้าหน้าที่งานสารบรรณ");
  const [regDivision, setRegDivision] = useState(PRACHIN_BURI_DIVISIONS[0]?.name || "สำนักปลัดองค์การบริหารส่วนจังหวัด");
  const [regSection, setRegSection] = useState("ฝ่ายอำนวยการ");
  const [regPhone, setRegPhone] = useState("โทร. ๐-๓๗๒๑-๑๕๗๙");
  const [regDocPrefix, setRegDocPrefix] = useState("ปจ ๕๑๐๐๑/");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const trimmedUser = loginUsername.trim().toLowerCase();
    const members = loadAllMembers();
    const found = members.find(
      (m) =>
        m.username.toLowerCase() === trimmedUser ||
        (m.username.toLowerCase() === "nayok" &&
          (trimmedUser === "นายก" ||
            trimmedUser === "nayok" ||
            trimmedUser === "ฮนมะ" ||
            trimmedUser === "ฮนมะ ยูจิโจ" ||
            trimmedUser === "ฮนมะ ยูจิโร่")) ||
        (m.username.toLowerCase() === "edu" &&
          (trimmedUser === "edu" ||
            trimmedUser === "เอดาจิมา" ||
            trimmedUser === "เอดาจิม่า" ||
            trimmedUser === "เอดาจิม่า เฮฮาจิ" ||
            trimmedUser === "กองการศึกษา")) ||
        (m.username.toLowerCase() === "yotta" &&
          (trimmedUser === "yotta" ||
            trimmedUser === "ดีเคด" ||
            trimmedUser === "ดีเคท" ||
            trimmedUser === "มาสไรเดอ" ||
            trimmedUser === "มาสไรเดอ ดีเคท" ||
            trimmedUser === "มาสค์ไรเดอร์ ดีเคด" ||
            trimmedUser === "กองยุทธศาสตร์"))
    );

    if (!found) {
      setLoginError("ไม่พบบัญชีผู้ใช้งานนี้ในระบบ กรุณาตรวจสอบหรือกดสมัครสมาชิก");
      return;
    }

    if (found.password && found.password !== loginPassword) {
      setLoginError("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
      return;
    }

    onLogin(found);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (!regUsername.trim()) {
      setRegError("กรุณาระบุชื่อผู้ใช้งาน (Username)");
      return;
    }
    if (!regPassword) {
      setRegError("กรุณาระบุรหัสผ่าน");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    if (!regFullName.trim()) {
      setRegError("กรุณาระบุชื่อ-นามสกุลจริง");
      return;
    }

    const res = registerMember({
      username: regUsername.trim().toLowerCase(),
      password: regPassword,
      fullName: regFullName.trim(),
      position: regPosition.trim(),
      division: regDivision,
      section: regSection.trim(),
      phone: regPhone.trim(),
      docPrefix: regDocPrefix.trim(),
      useShortOrgName: true,
    });

    if (!res.success || !res.user) {
      setRegError(res.message || "การลงทะเบียนไม่สำเร็จ");
      return;
    }

    setRegSuccess("ลงทะเบียนสำเร็จ! กำลังเข้าสู่ระบบ...");
    setTimeout(() => {
      onLogin(res.user!);
    }, 600);
  };

  const handleFillDemo = (u: string, p: string) => {
    setLoginUsername(u);
    setLoginPassword(p);
    setLoginError("");
  };

  return (
    <div className="login-page-container">
      <div className="login-card" style={{ maxWidth: activeTab === "register" ? "540px" : "460px", transition: "max-width 0.3s ease" }}>
        
        {/* Header ตราครุฑ / สัญลักษณ์ */}
        <div className="login-header">
          <div className="login-crest">
            <img src="/book-logo.svg" alt="ระบบสารบรรณ" width="56" height="56" />
          </div>
          <h1 className="login-title">ระบบงานสารบรรณอิเล็กทรอนิกส์</h1>
          <p className="login-sub">องค์การบริหารส่วนจังหวัดปราจีนบุรี (อบจ.ปราจีนบุรี)</p>
          <div className="login-badge-law">
            ระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖
          </div>
        </div>

        {/* แท็บสลับ เข้าสู่ระบบ / สมัครสมาชิก */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#f1f5f9",
            borderRadius: "10px",
            padding: "4px",
            marginBottom: "22px",
            border: "1px solid #e2e8f0",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            style={{
              flex: 1,
              padding: "10px 14px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: activeTab === "login" ? "#ffffff" : "transparent",
              color: activeTab === "login" ? "#065f46" : "#64748b",
              fontWeight: activeTab === "login" ? 700 : 500,
              fontSize: "14.5px",
              cursor: "pointer",
              boxShadow: activeTab === "login" ? "0 2px 5px rgba(0, 0, 0, 0.08)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            🔑 เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("register")}
            style={{
              flex: 1,
              padding: "10px 14px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: activeTab === "register" ? "#ffffff" : "transparent",
              color: activeTab === "register" ? "#065f46" : "#64748b",
              fontWeight: activeTab === "register" ? 700 : 500,
              fontSize: "14.5px",
              cursor: "pointer",
              boxShadow: activeTab === "register" ? "0 2px 5px rgba(0, 0, 0, 0.08)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            📝 สมัครสมาชิกใหม่
          </button>
        </div>

        {/* ─── TAB 1: เข้าสู่ระบบ (Login) ─────────────────────────── */}
        {activeTab === "login" && (
          <form onSubmit={handleLogin} className="login-form">
            {loginError && <div className="login-alert-error">{loginError}</div>}

            <div className="login-field">
              <label htmlFor="login-username">ชื่อผู้ใช้งาน (Username):</label>
              <input
                id="login-username"
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="กรอกชื่อผู้ใช้งาน เช่น nayok, admin, chang"
                required
                autoFocus
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-password">รหัสผ่าน (Password):</label>
              <input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                required
              />
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              style={{
                backgroundColor: "#065f46",
                backgroundImage: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
              }}
            >
              🔓 เข้าสู่ระบบ (Sign In)
            </button>

            {/* บัญชีตัวอย่าง */}
            <div className="login-demo-box" style={{ marginTop: "20px" }}>
              <div className="login-demo-title">
                <span>🔑 บัญชีตัวอย่างสำหรับทดสอบ (รหัสผ่าน: <strong>123</strong>)</span>
              </div>
              <div className="login-demo-chips">
                {[
                  { u: "nayok", label: "เอดาจิม่า เฮฮาจิ (นายก อบจ.)" },
                  { u: "admin", label: "สำนักปลัด (admin)" },
                  { u: "chang", label: "กองช่าง (chang)" },
                  { u: "pasadu", label: "กองพัสดุฯ (pasadu)" },
                  { u: "klang", label: "กองคลัง (klang)" },
                ].map((acc) => (
                  <button
                    key={acc.u}
                    type="button"
                    className="login-demo-chip"
                    onClick={() => handleFillDemo(acc.u, "123")}
                    title={`คลิกเพื่อกรอก ${acc.u}`}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* ─── TAB 2: สมัครสมาชิก (Register) ───────────────────────── */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} className="login-form">
            {regError && <div className="login-alert-error">{regError}</div>}
            {regSuccess && (
              <div
                style={{
                  backgroundColor: "#ecfdf5",
                  color: "#065f46",
                  border: "1px solid #a7f3d0",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  marginBottom: "16px",
                  textAlign: "center",
                  fontWeight: 600,
                }}
              >
                ✓ {regSuccess}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="login-field">
                <label>ชื่อผู้ใช้งาน (Username): *</label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="เช่น somchai, nitikorn"
                  required
                  autoFocus
                />
              </div>

              <div className="login-field">
                <label>ชื่อ-นามสกุล (พร้อมคำนำหน้า): *</label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="เช่น นายสมชาย ใจดี"
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="login-field">
                <label>รหัสผ่าน: *</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="รหัสผ่าน"
                  required
                />
              </div>

              <div className="login-field">
                <label>ยืนยันรหัสผ่าน: *</label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="login-field">
                <label>ตำแหน่งราชการ: *</label>
                <input
                  type="text"
                  value={regPosition}
                  onChange={(e) => setRegPosition(e.target.value)}
                  placeholder="เช่น นิติกรปฏิบัติการ"
                  required
                />
              </div>

              <div className="login-field">
                <label>สังกัดกอง / สำนัก: *</label>
                <select
                  value={regDivision}
                  onChange={(e) => {
                    const sel = e.target.value;
                    setRegDivision(sel);
                    const match = PRACHIN_BURI_DIVISIONS.find((d) => d.name === sel);
                    if (match) {
                      setRegPhone(match.phone);
                      setRegDocPrefix(match.docPrefix);
                      if (match.sections && match.sections.length > 0) {
                        setRegSection(match.sections[0]);
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
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="login-field">
                <label>ฝ่าย / งาน:</label>
                <input
                  type="text"
                  value={regSection}
                  onChange={(e) => setRegSection(e.target.value)}
                  placeholder="เช่น ฝ่ายอำนวยการ"
                />
              </div>

              <div className="login-field">
                <label>รหัสหนังสือประจำกอง:</label>
                <input
                  type="text"
                  value={regDocPrefix}
                  onChange={(e) => setRegDocPrefix(e.target.value)}
                  placeholder="เช่น ปจ ๕๑๐๐๑/"
                />
              </div>
            </div>

            <div className="login-field">
              <label>เบอร์โทรศัพท์ติดต่อ:</label>
              <input
                type="text"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="เช่น โทร. ๐-๓๗๒๑-๑๕๗๙"
              />
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              style={{
                backgroundColor: "#065f46",
                backgroundImage: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                marginTop: "10px",
              }}
            >
              📝 สมัครสมาชิกและเข้าสู่ระบบ
            </button>
          </form>
        )}

        <div className="login-footer-credits">
          ระบบจัดทำและพิมพ์หนังสือราชการมาตรฐาน A4 • พัฒนาโดย Saksith Sinarun
        </div>
      </div>
    </div>
  );
};
