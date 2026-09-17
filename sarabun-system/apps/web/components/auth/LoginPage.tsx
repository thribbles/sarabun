import React, { useState } from "react";
import { UserMember, loadAllMembers } from "../../src/authTypes";

interface LoginPageProps {
  onLogin: (user: UserMember) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
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
        (m.username.toLowerCase() === "nayok" && (trimmedUser === "นายก" || trimmedUser === "nayok"))
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

        {/* Form Login */}
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
              autoFocus
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
              { u: "nayok", label: "นายก อบจ. (nayok)" },
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
