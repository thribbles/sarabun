import React, { useState, useEffect } from "react";
import {
  UserMember,
  loadAllMembers,
  saveAllMembers,
  updateMemberProfile,
} from "../../src/authTypes";
import { PRACHIN_BURI_DIVISIONS } from "../../src/sampleData";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserMember | null;
  onLogin: (user: UserMember) => void;
  onLogout: () => void;
  onUpdateProfile: (updated: UserMember) => void;
  initialTab?: "login" | "register" | "profile";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  onUpdateProfile,
  initialTab = "login",
}) => {
  const [tab, setTab] = useState<"login" | "register" | "profile">(initialTab);
  const [members, setMembers] = useState<UserMember[]>([]);

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSuccessMsg, setLoginSuccessMsg] = useState("");

  // Register form state
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regPosition, setRegPosition] = useState("");
  const [regDivision, setRegDivision] = useState(PRACHIN_BURI_DIVISIONS[0].name);
  const [regSection, setRegSection] = useState(PRACHIN_BURI_DIVISIONS[0].sections[0] || "");
  const [regCustomSection, setRegCustomSection] = useState("");
  const [regPhone, setRegPhone] = useState(PRACHIN_BURI_DIVISIONS[0].phone);
  const [regDocPrefix, setRegDocPrefix] = useState(PRACHIN_BURI_DIVISIONS[0].docPrefix);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  // Profile form state
  const [profFullName, setProfFullName] = useState("");
  const [profPosition, setProfPosition] = useState("");
  const [profDivision, setProfDivision] = useState("");
  const [profSection, setProfSection] = useState("");
  const [profCustomSection, setProfCustomSection] = useState("");
  const [profPhone, setProfPhone] = useState("");
  const [profDocPrefix, setProfDocPrefix] = useState("");
  const [profSuccess, setProfSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      const all = loadAllMembers();
      setMembers(all);
      setLoginError("");
      setRegError("");
      setRegSuccess("");
      setProfSuccess("");

      if (currentUser) {
        setTab(initialTab === "login" ? "profile" : initialTab);
        setProfFullName(currentUser.fullName);
        setProfPosition(currentUser.position);
        setProfDivision(currentUser.division);
        setProfSection(currentUser.section);
        setProfPhone(currentUser.phone);
        setProfDocPrefix(currentUser.docPrefix);
      } else {
        setTab("login");
      }
    }
  }, [isOpen, currentUser, initialTab]);

  if (!isOpen) return null;

  // จัดการเมื่อเปลี่ยนกองในฟอร์มสมัคร
  const handleRegDivisionChange = (divName: string) => {
    setRegDivision(divName);
    const found = PRACHIN_BURI_DIVISIONS.find((d) => d.name === divName);
    if (found) {
      setRegSection(found.sections[0] || "");
      setRegCustomSection("");
      setRegPhone(found.phone);
      setRegDocPrefix(found.docPrefix);
    }
  };

  // จัดการเมื่อเปลี่ยนกองในฟอร์มโปรไฟล์
  const handleProfDivisionChange = (divName: string) => {
    setProfDivision(divName);
    const found = PRACHIN_BURI_DIVISIONS.find((d) => d.name === divName);
    if (found) {
      setProfSection(found.sections[0] || "");
      setProfCustomSection("");
      setProfPhone(found.phone);
      setProfDocPrefix(found.docPrefix);
    }
  };

  // ดำเนินการเข้าสู่ระบบ
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const trimmedUser = loginUsername.trim().toLowerCase();
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
      setLoginError("ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบชื่อผู้ใช้หรือสมัครสมาชิกใหม่");
      return;
    }

    if (found.password && found.password !== loginPassword) {
      setLoginError("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง (สำหรับบัญชีตัวอย่าง รหัสคือ 123)");
      return;
    }

    onLogin(found);
    onClose();
  };

  // ดำเนินการสมัครสมาชิกใหม่
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    const username = regUsername.trim().toLowerCase();
    if (!username || username.length < 3) {
      setRegError("ชื่อผู้ใช้ (Username) ต้องมีอย่างน้อย 3 ตัวอักษร");
      return;
    }

    if (!regPassword || regPassword.length < 3) {
      setRegError("รหัสผ่านต้องมีอย่างน้อย 3 ตัวอักษร");
      return;
    }

    if (!regFullName.trim()) {
      setRegError("กรุณากรอกชื่อ-นามสกุล");
      return;
    }

    // ตรวจสอบชื่อผู้ใช้ซ้ำ
    if (members.some((m) => m.username.toLowerCase() === username)) {
      setRegError(`ชื่อผู้ใช้ "${username}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น`);
      return;
    }

    const finalSection = regCustomSection.trim() || regSection;

    const newMember: UserMember = {
      id: `mem-${Date.now()}`,
      username,
      password: regPassword,
      fullName: regFullName.trim(),
      position: regPosition.trim() || "เจ้าหน้าที่",
      division: regDivision,
      section: finalSection,
      phone: regPhone.trim(),
      docPrefix: regDocPrefix.trim(),
      useShortOrgName: false,
    };

    const updatedMembers = [...members, newMember];
    saveAllMembers(updatedMembers);
    setMembers(updatedMembers);

    setRegSuccess("สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบ...");
    setTimeout(() => {
      onLogin(newMember);
      onClose();
    }, 800);
  };

  // บันทึกการแก้ไขโปรไฟล์
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setProfSuccess("");

    const finalSection = profCustomSection.trim() || profSection;

    const updatedData: Partial<UserMember> = {
      fullName: profFullName.trim(),
      position: profPosition.trim(),
      division: profDivision,
      section: finalSection,
      phone: profPhone.trim(),
      docPrefix: profDocPrefix.trim(),
    };

    const updated = updateMemberProfile(currentUser.id, updatedData) || {
      ...currentUser,
      ...updatedData,
    };

    setMembers(loadAllMembers());
    onUpdateProfile(updated);

    setProfSuccess("บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว และอัปเดตข้อมูลบนหัวหนังสือและผู้ลงนามแล้ว");
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const currentDivObj =
    PRACHIN_BURI_DIVISIONS.find((d) => d.name === (tab === "register" ? regDivision : profDivision)) ||
    PRACHIN_BURI_DIVISIONS[0];

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div
        className="auth-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="auth-modal-header">
          <div className="auth-modal-title">
            <span className="auth-crest-icon">ครุฑ</span>
            <div>
              <h3>ระบบสมาชิกและข้อมูลสังกัด (กอง/ฝ่าย)</h3>
              <p>ผูกข้อมูลกองและฝ่ายกับหัวหนังสือราชการอัตโนมัติ (แก้ไขทีหลังได้ตลอดเวลา)</p>
            </div>
          </div>
          <button type="button" className="auth-modal-close" onClick={onClose} title="ปิดหน้าต่าง">
            ✕
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="auth-modal-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${tab === "login" ? "active" : ""}`}
            onClick={() => setTab("login")}
          >
            🔑 เข้าสู่ระบบ
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${tab === "register" ? "active" : ""}`}
            onClick={() => setTab("register")}
          >
            ➕ สมัครสมาชิกใหม่
          </button>
          {currentUser && (
            <button
              type="button"
              className={`auth-tab-btn ${tab === "profile" ? "active" : ""}`}
              onClick={() => setTab("profile")}
            >
              👤 ข้อมูลสังกัดของฉัน
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="auth-modal-body">
          {/* TAB 1: LOGIN */}
          {tab === "login" && (
            <div className="auth-pane">
              {currentUser && (
                <div className="auth-current-badge">
                  <span>ผู้ใช้ปัจจุบันที่เข้าสู่ระบบ:</span>
                  <strong>{currentUser.fullName}</strong>
                  <span className="badge-dept">
                    ({currentUser.division} - {currentUser.section || "ไม่ระบุฝ่าย"})
                  </span>
                  <button
                    type="button"
                    className="auth-logout-btn"
                    onClick={() => {
                      onLogout();
                      setLoginSuccessMsg("ออกจากระบบแล้ว");
                    }}
                  >
                    🚪 ออกจากระบบ
                  </button>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="auth-form">
                {loginSuccessMsg && <div className="auth-alert success">{loginSuccessMsg}</div>}
                {loginError && <div className="auth-alert error">{loginError}</div>}

                <div className="auth-field-group">
                  <label className="auth-label">ชื่อผู้ใช้งาน (Username):</label>
                  <input
                    type="text"
                    className="auth-input"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="เช่น chang, pasadu, admin"
                    autoFocus
                  />
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">รหัสผ่าน (Password):</label>
                  <input
                    type="password"
                    className="auth-input"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="รหัสผ่าน (ตัวอย่าง: 123)"
                  />
                </div>

                <div className="auth-btn-row">
                  <button type="submit" className="auth-btn-submit">
                    🔓 เข้าสู่ระบบ
                  </button>
                  <button
                    type="button"
                    className="auth-btn-secondary"
                    onClick={() => setTab("register")}
                  >
                    ยังไม่มีบัญชี? สมัครใหม่
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: REGISTER */}
          {tab === "register" && (
            <div className="auth-pane">
              <form onSubmit={handleRegisterSubmit} className="auth-form">
                {regError && <div className="auth-alert error">{regError}</div>}
                {regSuccess && <div className="auth-alert success">{regSuccess}</div>}

                <div className="auth-grid-2">
                  <div className="auth-field-group">
                    <label className="auth-label">ชื่อผู้ใช้ (Username) *:</label>
                    <input
                      type="text"
                      className="auth-input"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="เช่น somchai"
                      required
                    />
                  </div>
                  <div className="auth-field-group">
                    <label className="auth-label">รหัสผ่าน (Password) *:</label>
                    <input
                      type="password"
                      className="auth-input"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="กำหนดรหัสผ่าน"
                      required
                    />
                  </div>
                </div>

                <div className="auth-grid-2">
                  <div className="auth-field-group">
                    <label className="auth-label">ชื่อ-นามสกุล *:</label>
                    <input
                      type="text"
                      className="auth-input"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="เช่น นายสมชาย ใจดี"
                      required
                    />
                  </div>
                  <div className="auth-field-group">
                    <label className="auth-label">ตำแหน่ง:</label>
                    <input
                      type="text"
                      className="auth-input"
                      value={regPosition}
                      onChange={(e) => setRegPosition(e.target.value)}
                      placeholder="เช่น นายช่างโยธาปฏิบัติงาน"
                    />
                  </div>
                </div>

                {/* สังกัดกอง */}
                <div className="auth-field-group">
                  <label className="auth-label">กอง / สำนัก สังกัด *:</label>
                  <select
                    className="auth-select"
                    value={regDivision}
                    onChange={(e) => handleRegDivisionChange(e.target.value)}
                  >
                    {PRACHIN_BURI_DIVISIONS.map((div) => (
                      <option key={div.name} value={div.name}>
                        {div.name} ({div.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* สังกัดฝ่าย */}
                <div className="auth-field-group">
                  <label className="auth-label">ฝ่ายที่สังกัด (เลือกหรือพิมพ์เอง):</label>
                  <div className="auth-section-options">
                    {currentDivObj.sections.map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        className={`auth-sec-chip ${regSection === sec && !regCustomSection ? "active" : ""}`}
                        onClick={() => {
                          setRegSection(sec);
                          setRegCustomSection("");
                        }}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: "6px" }}>
                    <input
                      type="text"
                      className="auth-input"
                      value={regCustomSection}
                      onChange={(e) => setRegCustomSection(e.target.value)}
                      placeholder="หรือพิมพ์ชื่อฝ่ายอื่น ๆ ที่นี่ (หากไม่มีในรายการ)"
                    />
                  </div>
                </div>

                <div className="auth-grid-2">
                  <div className="auth-field-group">
                    <label className="auth-label">เบอร์โทรศัพท์ประจำกอง/ฝ่าย:</label>
                    <input
                      type="text"
                      className="auth-input"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="เช่น โทร. ๐-๓๗๔๕-๒๐๓๕"
                    />
                  </div>
                  <div className="auth-field-group">
                    <label className="auth-label">รหัสเลขที่หนังสือประจำกอง:</label>
                    <input
                      type="text"
                      className="auth-input"
                      value={regDocPrefix}
                      onChange={(e) => setRegDocPrefix(e.target.value)}
                      placeholder="เช่น ปจ ๕๑๐๐๓/"
                    />
                  </div>
                </div>

                <div className="auth-btn-row">
                  <button type="submit" className="auth-btn-submit">
                    💾 ยืนยันสมัครสมาชิกและเข้าสู่ระบบ
                  </button>
                  <button
                    type="button"
                    className="auth-btn-secondary"
                    onClick={() => setTab("login")}
                  >
                    กลับไปหน้าเข้าสู่ระบบ
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: PROFILE EDIT */}
          {tab === "profile" && currentUser && (
            <div className="auth-pane">
              <form onSubmit={handleProfileSubmit} className="auth-form">
                {profSuccess && <div className="auth-alert success">{profSuccess}</div>}

                <div className="auth-grid-2">
                  <div className="auth-field-group">
                    <label className="auth-label">ชื่อผู้ใช้ (Username):</label>
                    <input
                      type="text"
                      className="auth-input disabled"
                      value={currentUser.username}
                      disabled
                    />
                  </div>
                  <div className="auth-field-group">
                    <label className="auth-label">ชื่อ-นามสกุล:</label>
                    <input
                      type="text"
                      className="auth-input"
                      value={profFullName}
                      onChange={(e) => setProfFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">ตำแหน่ง:</label>
                  <input
                    type="text"
                    className="auth-input"
                    value={profPosition}
                    onChange={(e) => setProfPosition(e.target.value)}
                  />
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">กอง / สำนัก สังกัด:</label>
                  <select
                    className="auth-select"
                    value={profDivision}
                    onChange={(e) => handleProfDivisionChange(e.target.value)}
                  >
                    {PRACHIN_BURI_DIVISIONS.map((div) => (
                      <option key={div.name} value={div.name}>
                        {div.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">ฝ่ายที่สังกัด:</label>
                  <div className="auth-section-options">
                    {currentDivObj.sections.map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        className={`auth-sec-chip ${profSection === sec && !profCustomSection ? "active" : ""}`}
                        onClick={() => {
                          setProfSection(sec);
                          setProfCustomSection("");
                        }}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: "6px" }}>
                    <input
                      type="text"
                      className="auth-input"
                      value={profCustomSection}
                      onChange={(e) => setProfCustomSection(e.target.value)}
                      placeholder="หรือพิมพ์ชื่อฝ่ายอื่น ๆ ที่นี่"
                    />
                  </div>
                </div>

                <div className="auth-grid-2">
                  <div className="auth-field-group">
                    <label className="auth-label">เบอร์โทรศัพท์กอง/ฝ่าย:</label>
                    <input
                      type="text"
                      className="auth-input"
                      value={profPhone}
                      onChange={(e) => setProfPhone(e.target.value)}
                    />
                  </div>
                  <div className="auth-field-group">
                    <label className="auth-label">รหัสเลขที่หนังสือประจำกอง:</label>
                    <input
                      type="text"
                      className="auth-input"
                      value={profDocPrefix}
                      onChange={(e) => setProfDocPrefix(e.target.value)}
                    />
                  </div>
                </div>

                <div className="auth-btn-row">
                  <button type="submit" className="auth-btn-submit">
                    💾 บันทึกข้อมูลและซิงค์ไปยังหัวหนังสือ
                  </button>
                  <button
                    type="button"
                    className="auth-logout-btn"
                    onClick={() => {
                      onLogout();
                      setTab("login");
                    }}
                  >
                    🚪 ออกจากระบบ
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
