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
import { Signatory, loadSignatories, getSignatoriesForUser } from "../../src/signatoryStore";

interface DocumentEditorProps {
  type: DocumentTypeCode;
  fields: PrintFields;
  onChange: (fields: PrintFields) => void;
  onConvertThaiNums: () => void;
  onInsertSampleTable: () => void;
  currentUser?: UserMember | null;
  onOpenAuth?: (tab?: "login" | "register" | "profile") => void;
  onManageSignatories?: () => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  type,
  fields,
  onChange,
  onConvertThaiNums,
  onInsertSampleTable,
  currentUser,
  onOpenAuth,
  onManageSignatories,
}) => {
  // ขนาดตัวอักษรหน้าฝั่งพิมพ์ (ค่าเริ่มต้น: ใหญ่ สบายตา)
  const [fontSizeLevel, setFontSizeLevel] = useState<"normal" | "large" | "xlarge">("large");

  // รายชื่อผู้ลงนามที่บันทึกไว้ (กรองตามสิทธิ์กอง: ผู้ลงนามลงนามได้แค่กองนั้นๆ ยกเว้นนายก อบจ. เห็นทุกกอง)
  const [signatories, setSignatories] = useState<Signatory[]>([]);

  useEffect(() => {
    setSignatories(getSignatoriesForUser(currentUser, fields.department));
  }, [currentUser?.id, currentUser?.username, currentUser?.division, fields.department]);

  // ซิงค์ข้อมูลสังกัดและเลขที่เอกสารเฉพาะเมื่อยังไม่มีค่า (ไม่ทับซ้อนหรือเขียนทับชื่อผู้ลงนามที่ผู้ใช้เลือก)
  useEffect(() => {
    if (currentUser) {
      const expectedDept = buildDepartmentString(currentUser);
      const shouldUpdateDept = !fields.department;
      const shouldUpdateDocNo =
        currentUser.docPrefix && (!fields.documentNo || fields.documentNo.startsWith("ปจ "));

      if (shouldUpdateDept) {
        onChange({
          ...fields,
          department: expectedDept,
          documentNo: shouldUpdateDocNo ? currentUser.docPrefix : fields.documentNo,
        });
      }
    }
  }, [
    currentUser?.id,
    currentUser?.fullName,
    currentUser?.position,
    currentUser?.division,
    currentUser?.section,
    currentUser?.phone,
    currentUser?.useShortOrgName,
  ]);

  // กรองรายชื่อผู้ลงนาม:
  // 1) ตัดรายการที่ชื่อตรงกับ currentUser ออก เพื่อไม่ให้เกิดปุ่ม "ฉัน" ชน/ซ้ำซ้อนกับรายชื่อ
  // 2) ตัดรายการที่ชื่อซ้ำกันเองออก (Deduplicate)
  const filteredSignatories = React.useMemo(() => {
    const cleanUser = currentUser?.fullName ? currentUser.fullName.replace(/[()]/g, "").trim().toLowerCase() : "";
    const seen = new Set<string>();
    const result: Signatory[] = [];

    for (const s of signatories) {
      const cleanName = s.name.replace(/[()]/g, "").trim().toLowerCase();
      if (cleanUser && cleanName === cleanUser) {
        continue;
      }
      if (!seen.has(cleanName)) {
        seen.add(cleanName);
        result.push(s);
      }
    }
    return result;
  }, [signatories, currentUser?.fullName]);

  const currentCleanSigner = (fields.signerName || "").replace(/[()]/g, "").trim().toLowerCase();
  const userCleanName = (currentUser?.fullName || "").replace(/[()]/g, "").trim().toLowerCase();
  const isSelfSelected = Boolean(userCleanName && currentCleanSigner === userCleanName);

  const isSignatorySelected = (s: Signatory) => {
    const cleanS = s.name.replace(/[()]/g, "").trim().toLowerCase();
    return cleanS === currentCleanSigner;
  };

  const applySigner = (name: string, position: string) => {
    onChange({
      ...fields,
      signerName: name,
      signerPosition: position,
    });
  };

  const selectedDropdownValue = React.useMemo(() => {
    if (isSelfSelected) return "self";
    const matched = filteredSignatories.find(isSignatorySelected);
    return matched ? matched.id : "";
  }, [isSelfSelected, filteredSignatories, currentCleanSigner]);

  const handleDropdownChange = (val: string) => {
    if (!val) return;
    if (val === "self" && currentUser) {
      applySigner(`(${currentUser.fullName})`, currentUser.position);
    } else {
      const target = filteredSignatories.find((s) => s.id === val);
      if (target) {
        applySigner(target.name, target.position);
      }
    }
  };

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
            <label className="form-label">
              ส่วนราชการ <span className="form-hint">(เช่น อบจ.ปราจีนบุรี กองช่าง โทร. ๐-๓๗๒๑-๑๕๗๙)</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={fields.department || ""}
              onChange={(e) => handleFieldChange("department", e.target.value)}
              placeholder="เช่น อบจ.ปราจีนบุรี กองช่าง (ฝ่ายก่อสร้าง) โทร. ..."
            />
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
                placeholder="เช่น ๘๑๘ ถนนปราจีนอนุสรณ์ ตำบลหน้าเมือง อำเภอเมืองปราจีนบุรี จังหวัดปราจีนบุรี ๒๕๐๐๐"
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
        <div className="section-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <span>ผู้ลงนามและท้ายกระดาษ</span>
          {onManageSignatories && (
            <button
              type="button"
              onClick={onManageSignatories}
              style={{
                background: "transparent",
                border: "none",
                color: "#0284c7",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 6px",
              }}
              title="เปิดหน้าจัดการรายชื่อผู้ลงนาม"
            >
              ⚙️ จัดการรายชื่อผู้ลงนาม →
            </button>
          )}
        </div>

        {/* Quick-select: เลือกผู้ลงนามจากรายการที่บันทึกไว้ (แก้ปัญหาซ้ำซ้อนและชนกัน) */}
        <div
          className="form-group"
          style={{
            marginBottom: "16px",
            padding: "12px 14px",
            backgroundColor: "#f8fafc",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <label className="form-label" style={{ margin: 0, fontWeight: 700, color: "#1e293b", fontSize: "13px" }}>
              📋 เลือกผู้ลงนาม (จากรายการที่บันทึกไว้)
            </label>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Dropdown Selector สำหรับเลือกได้ชัดเจน */}
            <select
              className="form-input"
              value={selectedDropdownValue}
              onChange={(e) => handleDropdownChange(e.target.value)}
              style={{
                backgroundColor: "#ffffff",
                fontSize: "13px",
                fontWeight: 500,
                color: "#1e293b",
                cursor: "pointer",
              }}
            >
              <option value="">-- เลือกผู้ลงนามจากรายการที่บันทึกไว้ --</option>
              {currentUser && (
                <option value="self">
                  👤 บัญชีของฉัน: ({currentUser.fullName}) — {currentUser.position}
                </option>
              )}
              {filteredSignatories.map((s) => (
                <option key={s.id} value={s.id}>
                  ✍️ {s.note ? `[${s.note}] ` : ""}{s.name} — {s.position}
                </option>
              ))}
            </select>

            {/* Quick Chips สำหรับเลือกด่วน พร้อมแสดงสถานะที่เลือกอยู่ ไม่ซ้ำซ้อน */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>เลือกด่วน:</span>

              {/* ชิป: ตัวเอง */}
              {currentUser && (
                <button
                  type="button"
                  onClick={() => applySigner(`(${currentUser.fullName})`, currentUser.position)}
                  style={{
                    padding: "4px 12px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    borderRadius: "16px",
                    border: isSelfSelected ? "1.5px solid #059669" : "1px solid #cbd5e1",
                    backgroundColor: isSelfSelected ? "#ecfdf5" : "#ffffff",
                    color: isSelfSelected ? "#065f46" : "#334155",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    boxShadow: isSelfSelected ? "0 1px 3px rgba(5, 150, 105, 0.2)" : "none",
                    transition: "all 0.15s ease",
                  }}
                  title="ใช้ชื่อและตำแหน่งของฉันเป็นผู้ลงนาม"
                >
                  {isSelfSelected ? "✓" : "👤"} ฉัน ({currentUser.fullName})
                </button>
              )}

              {/* ชิป: ผู้ลงนามที่บันทึกไว้ (กรองชื่อที่ซ้ำกับตัวเองออกแล้ว) */}
              {filteredSignatories.map((s) => {
                const isSelected = isSignatorySelected(s);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => applySigner(s.name, s.position)}
                    style={{
                      padding: "4px 12px",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      borderRadius: "16px",
                      border: isSelected ? "1.5px solid #0284c7" : "1px solid #cbd5e1",
                      backgroundColor: isSelected ? "#f0f9ff" : "#ffffff",
                      color: isSelected ? "#0369a1" : "#334155",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      boxShadow: isSelected ? "0 1px 3px rgba(2, 132, 199, 0.2)" : "none",
                      transition: "all 0.15s ease",
                    }}
                    title={`เลือก ${s.name} (${s.position})`}
                  >
                    {isSelected ? "✓" : "✍️"} {s.note || s.name}
                  </button>
                );
              })}
            </div>
          </div>
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
