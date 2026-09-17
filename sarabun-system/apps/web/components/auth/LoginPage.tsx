import React, { useState } from "react";
import { UserMember, loadAllMembers } from "../../src/authTypes";

interface LoginPageProps {
  onLogin: (user: UserMember) => void;
  isLogtoConfigured: boolean;
  onOpenLogtoSettings: () => void;
  onLogtoSignIn: () => void;
  logtoLoading?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  isLogtoConfigured,
  onOpenLogtoSettings,
  onLogtoSignIn,
  logtoLoading = false,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedUser = username.trim().toLowerCase();
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
      setError("ไม่พบบัญชีผู้ใช้งานนี้ในระบบ กรุณาตรวจสอบชื่อผู้ใช้");
      return;
    }

    if (found.password && found.password !== password) {
      setError("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
      return;
    }

    onLogin(found);
  };

  const handleFillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError("");
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        {/* Header ตราครุฑ / โลโก้ */}
        <div className="login-header">
          <div className="login-crest">
            <img src="/book-logo.svg" alt="ระบบสารบรรณ" width="56" height="56" />
          </div>
          <h1 className="login-title">ระบบงานสารบรรณอิเล็กทรอนิกส์</h1>
          <p className="login-sub">องค์การบริหารส่วนจังหวัดปราจีนบุรี (อบจ.ปราจีนบุรี)</p>
          <div className="login-badge-law">
            ตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖
          </div>
        </div>

        {/* ส่วนล็อกอินด้วย Logto SSO */}
        <div className="login-logto-section" style={{ marginBottom: "20px" }}>
          <button
            type="button"
            className="login-logto-btn"
            onClick={isLogtoConfigured ? onLogtoSignIn : onOpenLogtoSettings}
            disabled={logtoLoading}
            style={{
              width: "100%",
              padding: "13px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              backgroundColor: isLogtoConfigured ? "#4f46e5" : "#6366f1",
              backgroundImage: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 700,
              cursor: logtoLoading ? "wait" : "pointer",
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.35)",
              transition: "all 0.2s ease",
            }}
          >
            <span style={{ fontSize: "18px" }}>🔐</span>
            <span>
              {logtoLoading
                ? "กำลังนำทางสู่ Logto..."
                : isLogtoConfigured
                ? "เข้าสู่ระบบด้วย Logto (SSO)"
                : "ตั้งค่าเชื่อมต่อ Logto เพื่อเข้าสู่ระบบ"}
            </span>
          </button>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "8px",
              padding: "0 4px",
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            <span>
              {isLogtoConfigured ? (
                <span style={{ color: "#16a34a", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  ● พร้อมเชื่อมต่อ Logto
                </span>
              ) : (
                <span style={{ color: "#d97706" }}>ยังไม่ได้ระบุ Logto Endpoint</span>
              )}
            </span>
            <button
              type="button"
              onClick={onOpenLogtoSettings}
              style={{
                background: "none",
                border: "none",
                color: "#4f46e5",
                fontSize: "12px",
                cursor: "pointer",
                padding: "2px 6px",
                textDecoration: "underline",
                fontWeight: 600,
              }}
            >
              ⚙️ ตั้งค่า Logto
            </button>
          </div>
        </div>

        {/* เส้นคั่นตัวเลือก */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            margin: "18px 0 20px",
            color: "#94a3b8",
            fontSize: "13px",
          }}
        >
          <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }} />
          <span style={{ padding: "0 12px", fontWeight: 500 }}>หรือเข้าสู่ระบบด้วยรหัสผ่าน</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }} />
        </div>

        {/* Form Login ปกติ */}
        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="login-alert-error">{error}</div>}

          <div className="login-field">
            <label htmlFor="login-username">ชื่อผู้ใช้งาน (Username):</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="กรอกชื่อผู้ใช้งาน เช่น nayok, admin, chang"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">รหัสผ่าน (Password):</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="กรอกรหัสผ่าน"
              required
            />
          </div>

          <button type="submit" className="login-submit-btn">
            🔓 เข้าสู่ระบบ (Sign In)
          </button>
        </form>

        {/* Demo Accounts Helper */}
        <div className="login-demo-box">
          <div className="login-demo-title">
            <span>🔑 บัญชีตัวอย่างสำหรับทดสอบระบบ (รหัสผ่าน: <strong>123</strong>)</span>
          </div>
          <div className="login-demo-chips">
            {[
              { u: "nayok", label: "ฮนมะ ยูจิโจ (นายก อบจ.)" },
              { u: "edu", label: "เอดาจิม่า เฮฮาจิ (ผอ.กองการศึกษา)" },
              { u: "yotta", label: "มาสค์ไรเดอร์ ดีเคด (ผอ.กองยุทธศาสตร์)" },
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

        <div className="login-footer-credits">
          ระบบจัดทำและพิมพ์หนังสือราชการมาตรฐาน A4 • พัฒนาโดย Saksith Sinarun
        </div>
      </div>
    </div>
  );
};
