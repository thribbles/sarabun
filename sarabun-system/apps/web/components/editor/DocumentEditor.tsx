import React, { useState, useEffect } from "react";
import { DocumentTypeCode, PrintFields } from "../print/PrintPage";
import { convertToThaiNumerals } from "../../src/sampleData";
import { UserMember, buildDepartmentString } from "../../src/authTypes";
import {
  insertContentBeforeConcluding,
  ensureConcludingAtEnd,
  formatToThaiOfficialDate,
  getTodayThaiOfficialDate,
} from "../print/paginationHelper";

interface DocumentEditorProps {
  type: DocumentTypeCode;
  fields: PrintFields;
  onChange: (fields: PrintFields) => void;
  onConvertThaiNums: () => void;
  onInsertSampleTable: () => void;
  currentUser?: UserMember | null;
  onOpenAuth?: (tab?: "login" | "register" | "profile") => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  type,
  fields,
  onChange,
  onConvertThaiNums,
  onInsertSampleTable,
  currentUser,
  onOpenAuth,
}) => {
  // ขนาดตัวอักษรหน้าฝั่งพิมพ์ (ค่าเริ่มต้น: ใหญ่ สบายตา)
  const [fontSizeLevel, setFontSizeLevel] = useState<"normal" | "large" | "xlarge">("large");

  // ซิงค์ข้อมูลส่วนราชการ กอง และฝ่าย ให้ผูกกับบัญชีผู้ใช้ปัจจุบันโดยอัตโนมัติ (ไม่สามารถเลือกเปลี่ยนเองได้)
  useEffect(() => {
    if (currentUser) {
      const expectedDept = buildDepartmentString(currentUser);
      if (fields.department !== expectedDept) {
        onChange({
          ...fields,
          department: expectedDept,
          documentNo:
            currentUser.docPrefix && (!fields.documentNo || fields.documentNo.startsWith("ปจ "))
              ? currentUser.docPrefix
              : fields.documentNo,
        });
      }
    }
  }, [currentUser?.id, currentUser?.division, currentUser?.section, currentUser?.phone, currentUser?.useShortOrgName]);

  const handleFieldChange = <K extends keyof PrintFields>(key: K, value: PrintFields[K]) => {
    onChange({
      ...fields,
      [key]: value,
    });
  };

  // จิ้มเลือกวันที่จากปฏิทิน -> แปลงเป็นวันที่ราชการไทยอัตโนมัติ (เช่น ๑๔ กันยายน ๒๕๖๙)
  const handleDatePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const formatted = formatToThaiOfficialDate(val);
      handleFieldChange("date", formatted);
    }
  };

  // ตั้งเป็นวันที่ปัจจุบันทันที
  const handleSetToday = () => {
    handleFieldChange("date", getTodayThaiOfficialDate());
  };

  // แทรกย่อหน้าใหม่: แทรกไว้ ก่อนหน้า ประโยคจบเสมอ (ห้ามไปอยู่หลังประโยคจบ)
  const insertParagraph = () => {
    const addition = "พิมพ์ข้อความย่อหน้าใหม่ที่นี่...";
    onChange({
      ...fields,
      body: insertContentBeforeConcluding(fields.body || "", addition),
    });
  };

  // แทรกรายการหัวข้อย่อย: แทรกไว้ ก่อนหน้า ประโยคจบเสมอ
  const insertBulletList = () => {
    const listSnippet = `
<ol>
  <li>รายการที่ ๑: รายละเอียดข้อกำหนด</li>
  <li>รายการที่ ๒: เอกสารและหลักฐานประกอบ</li>
  <li>รายการที่ ๓: กำหนดระยะเวลาดำเนินการ</li>
</ol>`;
    onChange({
      ...fields,
      body: insertContentBeforeConcluding(fields.body || "", listSnippet),
    });
  };

  // ตั้งหรือเปลี่ยนประโยคจบเรื่อง (จะอยู่ท้ายสุดของเนื้อหาเสมอ และจัดระเบียบเนื้อหาไม่ให้หลงไปอยู่หลังประโยคจบ)
  const setConcludingSentence = (sentence: string) => {
    const current = fields.body || "";
    const concludingRegex = /(?:จึง(?:เรียน|กราบเรียน|ขอเรียน|เสนอ|แจ้ง|ส่ง)มาเพื่อ|จึงขอได้โปรด|จึงขอความร่วมมือ|จึงขอความอนุเคราะห์)[^\n]*/;
    if (concludingRegex.test(current)) {
      const updated = current.replace(concludingRegex, sentence);
      onChange({
        ...fields,
        body: ensureConcludingAtEnd(updated),
      });
    } else {
      onChange({
        ...fields,
        body: current ? `${current.trimEnd()}\n\n${sentence}` : sentence,
      });
    }
  };

  return (
    <div className={`editor-scroll-area font-${fontSizeLevel}`}>
      {/* 1. ส่วนข้อมูลหัวหนังสือ */}
      <div className="form-section">
        <div className="section-label">
          <span>ข้อมูลส่วนหัวเอกสาร</span>
        </div>

        {type === "memo" ? (
          <div className="form-group">
            <div className="dept-bound-card">
              <div className="dept-bound-header">
                <div className="dept-bound-title-row">
                  <label className="form-label" style={{ margin: 0 }}>
                    ส่วนราชการ: <strong>อบจ.ปราจีนบุรี</strong>
                  </label>
                  <span className="dept-lock-badge">
                    🔒 ผูกกับข้อมูลผู้ใช้ (ไม่สามารถเลือกเปลี่ยนได้)
                  </span>
                </div>
                {onOpenAuth && (
                  <div className="dept-bound-btn-group">
                    <button
                      type="button"
                      className="btn-dept-action"
                      onClick={() => onOpenAuth("profile")}
                      title="แก้ไขข้อมูลสังกัด กอง ฝ่าย หรือเบอร์โทรในบัญชีผู้ใช้"
                    >
                      ✏️ แก้ไขสังกัด / โปรไฟล์
                    </button>
                    <button
                      type="button"
                      className="btn-dept-action secondary"
                      onClick={() => onOpenAuth("login")}
                      title="สลับไปใช้บัญชีอื่นเพื่อเปลี่ยนสังกัด กอง และฝ่าย"
                    >
                      🔄 สลับผู้ใช้
                    </button>
                  </div>
                )}
              </div>

              {currentUser ? (
                <div className="dept-user-meta">
                  <span className="dept-user-icon">👤</span>
                  <div className="dept-user-meta-texts">
                    <div className="dept-user-main">
                      ผู้ร่างเอกสาร: <strong>{currentUser.fullName}</strong> ({currentUser.position})
                    </div>
                    <div className="dept-user-sub">
                      สังกัด: <strong>{currentUser.division}</strong> {currentUser.section ? `(${currentUser.section})` : ""} | {currentUser.phone}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="dept-user-meta not-logged-in">
                  <span>กรุณาเข้าสู่ระบบเพื่อระบุสังกัด กอง และฝ่ายของผู้ร่างโดยอัตโนมัติ</span>
                  {onOpenAuth && (
                    <button
                      type="button"
                      className="btn-login-small"
                      onClick={() => onOpenAuth("login")}
                    >
                      🔑 เข้าสู่ระบบ
                    </button>
                  )}
                </div>
              )}

              <input
                type="text"
                className="form-input text-dept-highlight text-dept-locked"
                value={fields.department || (currentUser ? buildDepartmentString(currentUser) : "")}
                readOnly
                title="ส่วนราชการผูกกับข้อมูลผู้ใช้ ไม่สามารถเลือกหรือพิมพ์เปลี่ยนโดยตรงได้ (แก้ไขได้ผ่านโปรไฟล์ผู้ใช้ หรือปุ่มแก้ไขสังกัด)"
                placeholder="อบจ.ปราจีนบุรี กอง... (ฝ่าย...) โทร. ..."
              />
            </div>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">
                ส่วนราชการมุมขวาบน <span className="form-hint">(เช่น องค์การบริหารส่วนจังหวัดปราจีนบุรี)</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={fields.agencyTop || ""}
                onChange={(e) => handleFieldChange("agencyTop", e.target.value)}
                placeholder="เช่น องค์การบริหารส่วนจังหวัดปราจีนบุรี"
              />
            </div>
            <div className="form-group">
              <label className="form-label">ที่อยู่ส่วนราชการมุมขวาบน</label>
              <input
                type="text"
                className="form-input"
                value={fields.agencyAddress || ""}
                onChange={(e) => handleFieldChange("agencyAddress", e.target.value)}
                placeholder="เช่น ๙๙๙ หมู่ ๑ ตำบลไม้เค็ด อำเภอเมืองปราจีนบุรี จังหวัดปราจีนบุรี ๒๕๐๐๐"
              />
            </div>
          </>
        )}

        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">ที่ (เลขที่หนังสือ)</label>
            <input
              type="text"
              className="form-input"
              value={fields.documentNo || ""}
              onChange={(e) => handleFieldChange("documentNo", e.target.value)}
              placeholder="เช่น ปจ ๕๑๐๐๑/ หรือ ปจ ๕๑๐๒๑/"
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label className="form-label" style={{ margin: 0 }}>วันที่</label>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  className="date-quick-btn"
                  onClick={handleSetToday}
                  title="ใส่วันที่ปัจจุบันในรูปแบบทางการ"
                >
                  📅 วันนี้
                </button>
                <label className="date-picker-label" title="จิ้มเลือกวันที่จากปฏิทิน">
                  📅 จิ้มเลือกวันที่
                  <input
                    type="date"
                    className="date-picker-native"
                    onChange={handleDatePicked}
                  />
                </label>
              </div>
            </div>
            <input
              type="text"
              className="form-input"
              value={fields.date || ""}
              onChange={(e) => handleFieldChange("date", e.target.value)}
              placeholder="เช่น ๑๔ กันยายน ๒๕๖๙"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">เรื่อง</label>
          <input
            type="text"
            className="form-input"
            value={fields.subject || ""}
            onChange={(e) => handleFieldChange("subject", e.target.value)}
            placeholder="สรุปประเด็นสาระสำคัญของหนังสือ"
          />
        </div>

        <div className="form-group">
          <label className="form-label">เรียน</label>
          <input
            type="text"
            className="form-input"
            value={fields.to || ""}
            onChange={(e) => handleFieldChange("to", e.target.value)}
            placeholder="ระบุตำแหน่งหรือบุคคลผู้รับหนังสือ"
          />
        </div>

        {type === "external" && (
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">อ้างถึง (ถ้ามี)</label>
              <input
                type="text"
                className="form-input"
                value={fields.reference || ""}
                onChange={(e) => handleFieldChange("reference", e.target.value)}
                placeholder="เช่น หนังสือที่..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">สิ่งที่ส่งมาด้วย (ถ้ามี)</label>
              <input
                type="text"
                className="form-input"
                value={fields.enclosure || ""}
                onChange={(e) => handleFieldChange("enclosure", e.target.value)}
                placeholder="เช่น รายงานจำนวน ๑ ฉบับ"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. ส่วนเนื้อหาหนังสือราชการ (Rich Text Editor) */}
      <div className="form-section">
        <div className="section-label" style={{ justifyContent: "space-between" }}>
          <span>เนื้อหาหนังสือ (Body)</span>
          <span className="form-hint">ย่อหน้า ๒.๕ ซม. อัตโนมัติ</span>
        </div>

        <div className="editor-toolbar">
          <button
            type="button"
            className="tool-btn"
            onClick={insertParagraph}
            title="ขึ้นย่อหน้าใหม่ (เว้นระยะตามระเบียบสารบรรณ 2.5 ซม.)"
          >
            ➕ ขึ้นย่อหน้าใหม่
          </button>
          <button
            type="button"
            className="tool-btn"
            onClick={insertBulletList}
            title="แทรกรายการหัวข้อย่อย"
          >
            📑 แทรกรายการ
          </button>
          <button
            type="button"
            className="tool-btn"
            onClick={onInsertSampleTable}
            title="แทรกตารางรายการทางการ"
          >
            📊 แทรกตาราง
          </button>
          <button
            type="button"
            className="tool-btn"
            onClick={onConvertThaiNums}
            title="แปลงเลขอารบิก 0-9 ในเนื้อหาเป็นเลขไทย ๐-๙"
          >
            🇹🇭 แปลงเลขไทย (๐-๙)
          </button>

          {/* ปรับขนาดตัวอักษรหน้าฝั่งพิมพ์ */}
          <div className="font-size-controls" title="ปรับขนาดตัวอักษรหน้าฝั่งพิมพ์">
            <span style={{ fontSize: "12px", color: "#64748b", marginRight: "2px" }}>
              ขนาดตัวอักษร:
            </span>
            <button
              type="button"
              className={`font-size-btn ${fontSizeLevel === "normal" ? "active" : ""}`}
              onClick={() => setFontSizeLevel("normal")}
              title="ขนาด 16.5px / 20px"
            >
              ก ปกติ
            </button>
            <button
              type="button"
              className={`font-size-btn ${fontSizeLevel === "large" ? "active" : ""}`}
              onClick={() => setFontSizeLevel("large")}
              title="ขนาด 18px / 22px (ใหญ่ สบายตา)"
            >
              ก+ ใหญ่
            </button>
            <button
              type="button"
              className={`font-size-btn ${fontSizeLevel === "xlarge" ? "active" : ""}`}
              onClick={() => setFontSizeLevel("xlarge")}
              title="ขนาด 20px / 25px (ใหญ่พิเศษ)"
            >
              ก++ พิเศษ
            </button>
          </div>
        </div>

        {/* แถบเลือกประโยคจบเรื่อง (จะอยู่ท้ายสุดของเอกสารเสมอ ไม่ปะปนกับการแทรกเนื้อหา) */}
        <div className="concluding-preset-bar">
          <span className="concluding-label">
            📌 ประโยคจบเรื่อง <span style={{ fontWeight: 400, color: "#64748b" }}>(อยู่ท้ายสุดเสมอ):</span>
          </span>
          <div className="concluding-chips">
            {[
              "จึงเรียนมาเพื่อโปรดทราบ",
              "จึงเรียนมาเพื่อโปรดพิจารณา",
              "จึงเรียนมาเพื่อโปรดอนุมัติ",
              "จึงเรียนมาเพื่อทราบ และดำเนินการในส่วนที่เกี่ยวข้อง",
              "จึงเรียนมาเพื่อโปรดทราบและถือปฏิบัติต่อไป",
            ].map((preset) => {
              const isSelected = (fields.body || "").includes(preset);
              return (
                <button
                  key={preset}
                  type="button"
                  className={`concluding-chip ${isSelected ? "active" : ""}`}
                  onClick={() => setConcludingSentence(preset)}
                  title={`ตั้งประโยคจบเรื่องเป็น "${preset}" (จะอยู่ที่ท้ายสุดของเนื้อหาเสมอ)`}
                >
                  {isSelected ? "✓ " : ""}{preset}
                </button>
              );
            })}
          </div>
        </div>

        <textarea
          className="form-textarea body-textarea"
          value={fields.body || ""}
          onChange={(e) => handleFieldChange("body", e.target.value)}
          placeholder={`พิมพ์หรือวางเนื้อหาเอกสารราชการที่นี่...

เว้น ๑ บรรทัดว่างระหว่างย่อหน้า เพื่อให้ระบบจัดย่อหน้า ๒.๕ ซม. อัตโนมัติในทุกย่อหน้าตามระเบียบงานสารบรรณ`}
          rows={10}
        />
      </div>

      {/* 3. ส่วนผู้ลงนามและท้ายกระดาษ */}
      <div className="form-section">
        <div className="section-label">
          <span>ผู้ลงนามและท้ายกระดาษ</span>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">ชื่อผู้ลงนาม</label>
            <input
              type="text"
              className="form-input"
              value={fields.signerName || ""}
              onChange={(e) => handleFieldChange("signerName", e.target.value)}
              placeholder="เช่น (นายสมชาย สบายดี)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">ตำแหน่ง</label>
            <input
              type="text"
              className="form-input"
              value={fields.signerPosition || ""}
              onChange={(e) => handleFieldChange("signerPosition", e.target.value)}
              placeholder="เช่น นายกองค์การบริหารส่วนจังหวัดปราจีนบุรี หรือ ปลัด อบจ.ปราจีนบุรี"
            />
          </div>
        </div>

        {type === "external" && (
          <div className="form-group" style={{ marginTop: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label className="form-label" style={{ margin: 0 }}>
                หน่วยงานเจ้าของเรื่อง / ช่องทางติดต่อ (มุมซ้ายล่างท้ายกระดาษ)
              </label>
              {currentUser && (
                <button
                  type="button"
                  className="btn-sync-dept"
                  style={{ padding: "2px 8px", fontSize: "12px" }}
                  onClick={() => {
                    const sec = currentUser.section ? `\n${currentUser.section.startsWith("ฝ่าย") ? currentUser.section : `ฝ่าย${currentUser.section}`}` : "";
                    const foot = `${currentUser.division}${sec}\n${currentUser.phone}\nwww.prachinpao.go.th`;
                    handleFieldChange("footerOffice", foot);
                  }}
                  title="ใส่ข้อมูลสังกัดของคุณลงในช่องนี้อัตโนมัติ"
                >
                  🔄 ใช้ข้อมูลสังกัดของฉัน
                </button>
              )}
            </div>
            <textarea
              className="form-textarea"
              rows={3}
              value={fields.footerOffice || ""}
              onChange={(e) => handleFieldChange("footerOffice", e.target.value)}
              placeholder={`เช่น:
สำนักปลัดองค์การบริหารส่วนจังหวัด
ฝ่ายอำนวยการ
โทร. ๐-๓๗๒๑-๑๕๗๙  โทรสาร ๐-๓๗๒๑-๑๕๗๙
www.prachinpao.go.th`}
            />
          </div>
        )}
      </div>
    </div>
  );
};
