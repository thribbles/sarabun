import React, { useState, useEffect } from "react";
import "../styles/app.css";
import "../styles/print.css";
import { PrintPage, DocumentTypeCode, PrintFields } from "../components/print/PrintPage";
import { DocumentEditor } from "../components/editor/DocumentEditor";
import {
  TEMPLATE_IN01_MEMO,
  SAMPLE_MEMO_EXAM01,
  SAMPLE_EXTERNAL,
  convertToThaiNumerals,
  DEFAULT_BOTTOM_SLOGAN,
} from "./sampleData";
import { insertContentBeforeConcluding, ensureConcludingAtEnd, getTodayThaiOfficialDate } from "../components/print/paginationHelper";
import {
  UserMember,
  loadCurrentMember,
  saveCurrentMember,
  clearCurrentMember,
  loadAllMembers,
  buildDepartmentString,
} from "./authTypes";
import { AuthModal } from "../components/auth/AuthModal";
import { AuthPage } from "../components/auth/AuthPage";
import { ProfilePage } from "../components/auth/ProfilePage";
import { SignatoryPage } from "../components/auth/SignatoryPage";
import { DocumentListPage } from "../components/list/DocumentListPage";
import {
  SavedDocument,
  createDocument,
  updateDocument,
} from "./documentStore";
import { checkApiHealth } from "./api/documentsApi";

export const App: React.FC = () => {

  // ─── View routing: "list" = หน้าหลัก, "editor" = หน้าร่าง/แก้ไข, "view" = ดู+พิมพ์, "profile" = แก้ไขโปรไฟล์, "signatories" = จัดการผู้ลงนาม
  const [appView, setAppView] = useState<"list" | "editor" | "view" | "profile" | "signatories">("list");
  // บันทึกหน้าที่อยู่ก่อนหน้า สำหรับการกดย้อนกลับจากหน้าการตั้งค่า / จัดการผู้ลงนาม
  const [previousView, setPreviousView] = useState<"list" | "editor" | "view">("list");
  // id ของเอกสารที่กำลังแก้ไข (null = สร้างใหม่)
  const [editingDocId, setEditingDocId] = useState<string | null>(null);

  const [docType, setDocType] = useState<DocumentTypeCode>("memo");
  const [fields, setFields] = useState<PrintFields>(TEMPLATE_IN01_MEMO);
  // ระบบสมาชิก: บัญชีผู้ใช้งานปัจจุบัน
  const [currentUser, setCurrentUser] = useState<UserMember | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register" | "profile">("login");

  // ปรับขนาดความกว้างฝั่งพิมพ์ (ค่าเริ่มต้น 65% ให้พิมพ์ได้กว้างขวาง สบายตา)
  const [editorWidthPercent, setEditorWidthPercent] = useState<number>(65);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(0.85);
  const [showMarginGuide, setShowMarginGuide] = useState<boolean>(false);
  const [showDottedLines, setShowDottedLines] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<string>("บันทึกแล้ว");
  const [isApiOnline, setIsApiOnline] = useState<boolean | null>(null);

  // ตรวจสอบสถานะการเชื่อมต่อ Backend API (NestJS + SQLite)
  useEffect(() => {
    const checkStatus = () => {
      checkApiHealth()
        .then((online) => setIsApiOnline(online))
        .catch(() => setIsApiOnline(false));
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // โหลดข้อมูลล่าสุดจาก localStorage เมื่อเริ่มต้น
  useEffect(() => {
    try {
      const savedType = localStorage.getItem("sarabun_doc_type") as DocumentTypeCode;
      const savedFields = localStorage.getItem("sarabun_doc_fields");
      const savedWidth = localStorage.getItem("sarabun_editor_width");
      if (savedType) setDocType(savedType);
      if (savedFields) {
        const parsed = JSON.parse(savedFields);
        if (parsed.body) {
          parsed.body = ensureConcludingAtEnd(parsed.body);
        }
        // แปลงข้อมูลตกค้างจากระบบเก่า (สำนักนายกรัฐมนตรี) ให้เป็น องค์การบริหารส่วนจังหวัดปราจีนบุรี อัตโนมัติ
        if (
          parsed.agencyTop === "สำนักนายกรัฐมนตรี" ||
          parsed.agencyAddress?.includes("ทำเนียบรัฐบาล") ||
          parsed.footerOffice?.includes("สำนักงานปลัดสำนักนายกรัฐมนตรี") ||
          parsed.signerPosition?.includes("ปลัดสำนักนายกรัฐมนตรี") ||
          parsed.documentNo?.startsWith("นร ")
        ) {
          parsed.agencyTop = SAMPLE_EXTERNAL.agencyTop;
          parsed.agencyAddress = SAMPLE_EXTERNAL.agencyAddress;
          parsed.footerOffice = SAMPLE_EXTERNAL.footerOffice;
          parsed.signerName = SAMPLE_EXTERNAL.signerName;
          parsed.signerPosition = SAMPLE_EXTERNAL.signerPosition;
          if (parsed.documentNo?.startsWith("นร ")) {
            parsed.documentNo = SAMPLE_EXTERNAL.documentNo;
          }
        }

        // ── แก้ที่อยู่เก่าที่อาจผิด: อบจ.ปราจีนบุรีตั้งอยู่ที่ "องค์การบริหารส่วนจังหวัด" ไม่ใช่ศาลากลางจังหวัด ──
        // ถ้า agencyTop เป็น อบจ./องค์การบริหารส่วนจังหวัดปราจีนบุรี แต่ที่อยู่ยังผิดหรือว่างเปล่า ให้รีเซ็ตเป็นที่อยู่ถูกต้อง
        const isAbj =
          parsed.agencyTop?.includes("องค์การบริหารส่วนจังหวัดปราจีนบุรี") ||
          parsed.agencyTop?.includes("อบจ.ปราจีนบุรี");
        const CORRECT_ADDRESS = "๘๑๘ ถนนปราจีนอนุสรณ์ ตำบลหน้าเมือง อำเภอเมืองปราจีนบุรี จังหวัดปราจีนบุรี ๒๕๐๐๐";
        if (isAbj && parsed.agencyAddress && parsed.agencyAddress !== CORRECT_ADDRESS) {
          // ตรวจสอบว่าเป็นที่อยู่เก่าที่ผิด (ไม่ใช่ที่อยู่ที่ผู้ใช้แก้เองโดยตั้งใจ)
          const isOldWrongAddress =
            parsed.agencyAddress.includes("ถนนราชดำเนิน") ||
            parsed.agencyAddress.includes("พระนคร") ||
            parsed.agencyAddress.includes("กรุงเทพ") ||
            parsed.agencyAddress.startsWith("818 ") || // เลขอารบิก ยังไม่แปลงเป็นไทย
            parsed.agencyAddress === "818 ถนนปราจีนอนุสรณ์ ตำบลหน้าเมือง อำเภอเมืองปราจีนบุรี จังหวัดปราจีนบุรี 25000";
          if (isOldWrongAddress) {
            parsed.agencyAddress = CORRECT_ADDRESS;
          }
        }
        if (parsed.showBottomSlogan === undefined) {
          parsed.showBottomSlogan = true;
        }
        if (!parsed.bottomSlogan || parsed.bottomSlogan.includes("ยึดมั่นมาตรฐาน")) {
          parsed.bottomSlogan = DEFAULT_BOTTOM_SLOGAN;
        }
        if (parsed.department && parsed.department.startsWith("องค์การบริหารส่วนจังหวัดปราจีนบุรี ")) {
          parsed.department = parsed.department.replace("องค์การบริหารส่วนจังหวัดปราจีนบุรี ", "อบจ.ปราจีนบุรี ");
        }
        setFields(parsed);
      }
      if (savedWidth) {
        const parsed = Number(savedWidth);
        if (parsed >= 45 && parsed <= 65) {
          setEditorWidthPercent(parsed);
        } else {
          setEditorWidthPercent(55);
          localStorage.setItem("sarabun_editor_width", "55");
        }
      } else {
        setEditorWidthPercent(55);
      }
    } catch (e) {
      console.warn("Could not load from localStorage", e);
    }

    // โหลดผู้ใช้ปัจจุบัน
    const user = loadCurrentMember();
    if (user) {
      setCurrentUser(user);
      setFields((prev) => {
        // หากเอกสารยังไม่มีผู้ลงนาม ให้ใส่ชื่อผู้ใช้ปัจจุบันเริ่มต้น (ไม่เขียนทับเอกสารที่มีผู้ลงนามอยู่แล้ว)
        if (!prev.signerName) {
          return {
            ...prev,
            signerName: `(${user.fullName})`,
            signerPosition: user.position,
          };
        }
        return prev;
      });
    }
  }, []);

  // เมื่อเข้าสู่ระบบ / สลับผู้ใช้: ผูกข้อมูลกอง ฝ่าย ลายเซ็น และวันที่ เข้ากับหนังสือราชการอัตโนมัติ
  const handleLoginUser = (user: UserMember) => {
    setCurrentUser(user);
    saveCurrentMember(user);
    setFields((prev) => {
      const deptStr = buildDepartmentString(user);
      const next: PrintFields = {
        ...prev,
        department: deptStr,
        signerName: `(${user.fullName})`,
        signerPosition: user.position,
        date: prev.date || getTodayThaiOfficialDate(),
      };
      if (user.docPrefix && (!prev.documentNo || prev.documentNo.startsWith("ปจ "))) {
        next.documentNo = user.docPrefix;
      }
      return next;
    });
  };

  // ออกจากระบบ
  const handleLogoutUser = () => {
    setCurrentUser(null);
    clearCurrentMember();
    setAppView("list");
  };


  // บันทึกการแก้ไขข้อมูลโปรไฟล์
  const handleUpdateProfile = (user: UserMember) => {
    setCurrentUser(user);
    saveCurrentMember(user);
    setFields((prev) => {
      const deptStr = buildDepartmentString(user);
      return {
        ...prev,
        department: deptStr,
        signerName: `(${user.fullName})`,
        signerPosition: user.position,
        documentNo: user.docPrefix || prev.documentNo,
      };
    });
  };

  // บันทึกลง localStorage อัตโนมัติเมื่อข้อมูลเปลี่ยนแปลง
  useEffect(() => {
    setSaveStatus("กำลังบันทึก...");
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem("sarabun_doc_type", docType);
        localStorage.setItem("sarabun_doc_fields", JSON.stringify(fields));
        localStorage.setItem("sarabun_editor_width", String(editorWidthPercent));
        setSaveStatus("บันทึกร่างแล้ว");
      } catch (e) {
        setSaveStatus("บันทึกไม่สำเร็จ");
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [docType, fields, editorWidthPercent]);

  // ตัวจัดการลากปรับขนาดฝั่งพิมพ์ (Drag to Resize)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newPercent = (e.clientX / window.innerWidth) * 100;
      // ล็อคช่วงที่เหมาะสม: ฝั่งพิมพ์กว้าง 45% - 78% (ไม่ให้เบียดจนพรีวิวหาย)
      if (newPercent >= 45 && newPercent <= 78) {
        setEditorWidthPercent(Math.round(newPercent));
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const startDragging = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  // สลับประเภทเอกสาร
  const handleTypeChange = (newType: DocumentTypeCode) => {
    if (newType === docType) return;
    setDocType(newType);
    if (newType === "memo") {
      setFields((prev) => ({
        ...prev,
        department: prev.department || TEMPLATE_IN01_MEMO.department,
      }));
    } else {
      setFields((prev) => ({
        ...prev,
        agencyTop: prev.agencyTop || SAMPLE_EXTERNAL.agencyTop,
        agencyAddress: prev.agencyAddress || SAMPLE_EXTERNAL.agencyAddress,
        footerOffice: prev.footerOffice || SAMPLE_EXTERNAL.footerOffice,
      }));
    }
  };

  // โหลดแม่แบบ in01.pdf
  const loadIn01Template = () => {
    setDocType("memo");
    const tpl: PrintFields = {
      ...TEMPLATE_IN01_MEMO,
      date: getTodayThaiOfficialDate(),
    };
    if (currentUser) {
      tpl.department = buildDepartmentString(currentUser);
      if (currentUser.docPrefix) tpl.documentNo = currentUser.docPrefix;
      tpl.signerName = `(${currentUser.fullName})`;
      tpl.signerPosition = currentUser.position;
    }
    setFields(tpl);
    setShowDottedLines(true);
  };

  // โหลดตัวอย่าง อบจ. exam01.pdf
  const loadExam01Sample = () => {
    setDocType("memo");
    setFields({
      ...SAMPLE_MEMO_EXAM01,
      date: getTodayThaiOfficialDate(),
    });
  };

  // โหลดตัวอย่างหนังสือภายนอก
  const loadExternalSample = () => {
    setDocType("external");
    const tpl: PrintFields = {
      ...SAMPLE_EXTERNAL,
      date: getTodayThaiOfficialDate(),
    };
    if (currentUser) {
      tpl.signerName = `(${currentUser.fullName})`;
      tpl.signerPosition = currentUser.position;
      const sec = currentUser.section ? `\n${currentUser.section.startsWith("ฝ่าย") ? currentUser.section : `ฝ่าย${currentUser.section}`}` : "";
      tpl.footerOffice = `${currentUser.division}${sec}\n${currentUser.phone}\nwww.prachinpao.go.th`;
    }
    setFields(tpl);
  };

  // แปลงเลขอารบิก 0-9 ทั้งหมดเป็นเลขไทย ๐-๙
  const handleConvertAllToThaiNums = () => {
    setFields((prev) => ({
      ...prev,
      documentNo: prev.documentNo ? convertToThaiNumerals(prev.documentNo) : "",
      date: prev.date ? convertToThaiNumerals(prev.date) : "",
      subject: prev.subject ? convertToThaiNumerals(prev.subject) : "",
      to: prev.to ? convertToThaiNumerals(prev.to) : "",
      body: prev.body ? convertToThaiNumerals(prev.body) : "",
      department: prev.department ? convertToThaiNumerals(prev.department) : "",
      agencyTop: prev.agencyTop ? convertToThaiNumerals(prev.agencyTop) : "",
      agencyAddress: prev.agencyAddress ? convertToThaiNumerals(prev.agencyAddress) : "",
      reference: prev.reference ? convertToThaiNumerals(prev.reference) : "",
      enclosure: prev.enclosure ? convertToThaiNumerals(prev.enclosure) : "",
      signerName: prev.signerName ? convertToThaiNumerals(prev.signerName) : "",
      signerPosition: prev.signerPosition ? convertToThaiNumerals(prev.signerPosition) : "",
      footerOffice: prev.footerOffice ? convertToThaiNumerals(prev.footerOffice) : "",
      bottomSlogan: prev.bottomSlogan ? convertToThaiNumerals(prev.bottomSlogan) : prev.bottomSlogan,
    }));
  };

  // แทรกตารางตัวอย่างในเนื้อหา: แทรกไว้ ก่อนหน้า ประโยคจบเสมอ (ห้ามไปอยู่หลังประโยคจบ)
  const handleInsertSampleTable = () => {
    const tableSnippet = `
<table>
  <thead>
    <tr>
      <th style="width: 15%;">ลำดับ</th>
      <th style="width: 55%;">รายการครุภัณฑ์ / ทรัพย์สิน</th>
      <th style="width: 15%;">จำนวน</th>
      <th style="width: 15%;">หมายเหตุ</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align: center;">๑</td>
      <td>เครื่องคอมพิวเตอร์ประมวลผล</td>
      <td style="text-align: center;">๑๐ เครื่อง</td>
      <td style="text-align: center;">สภาพพร้อมใช้</td>
    </tr>
    <tr>
      <td style="text-align: center;">๒</td>
      <td>เครื่องพิมพ์เลเซอร์มัลติฟังก์ชัน</td>
      <td style="text-align: center;">๒ เครื่อง</td>
      <td style="text-align: center;">-</td>
    </tr>
  </tbody>
</table>`;
    setFields((prev) => ({
      ...prev,
      body: insertContentBeforeConcluding(prev.body || "", tableSnippet),
    }));
  };

  // สั่งพิมพ์เอกสาร A4 หรือบันทึกเป็น PDF ครบทุกหน้า 100% ไม่ถูกตัดเหลือหน้าเดียว
  const handlePrintDocument = () => {
    const container = document.getElementById("print-page");
    if (!container) {
      window.print();
      return;
    }

    // สร้าง iframe แยกเฉพาะสำหรับการสั่งพิมพ์ ป้องกัน layout 100vh / flexbox ของเว็บแอพไม่ให้กวน
    let printFrame = document.getElementById("sarabun-print-iframe") as HTMLIFrameElement;
    if (!printFrame) {
      printFrame = document.createElement("iframe");
      printFrame.id = "sarabun-print-iframe";
      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "0";
      printFrame.style.visibility = "hidden";
      document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      window.print();
      return;
    }

    // รวม CSS stylesheets ทั้งหมด
    const styleTags = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((el) => el.outerHTML)
      .join("\n");

    const contentHtml = container.outerHTML;

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>${fields.subject || "หนังสือราชการ"}</title>
        ${styleTags}
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, .sheet-tag, button, .margin-guide-indicator {
            display: none !important;
          }
          .sheets-container {
            display: block !important;
            margin: 0 auto !important;
            padding: 0 !important;
            gap: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          .sheet-wrapper {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .sheet-wrapper:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .print-page.sheet-page {
            box-shadow: none !important;
            margin: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }
          .sheet-wrapper:last-child .print-page.sheet-page {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
      </html>
    `);
    frameDoc.close();

    // รอให้ Font และรูปภาพโหลดเสร็จสมบูรณ์แล้วสั่งพิมพ์
    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
    }, 300);
  };

  // ─── List-page navigation handlers ─────────────────────────────
  /** เปิดหน้าร่างเอกสารใหม่ */
  const handleCreateNew = (type: DocumentTypeCode) => {
    const tpl = type === "memo" ? { ...TEMPLATE_IN01_MEMO } : { ...SAMPLE_EXTERNAL };
    tpl.date = getTodayThaiOfficialDate();
    // ถ้ามี currentUser ผูกข้อมูลสังกัดและผู้ลงนามทันที
    if (currentUser) {
      const deptStr = buildDepartmentString(currentUser);
      if (type === "memo") {
        tpl.department = deptStr;
        if (currentUser.docPrefix) tpl.documentNo = currentUser.docPrefix;
      } else {
        const sec = currentUser.section ? `\n${currentUser.section.startsWith("ฝ่าย") ? currentUser.section : `ฝ่าย${currentUser.section}`}` : "";
        tpl.footerOffice = `${currentUser.division}${sec}\n${currentUser.phone}\nwww.prachinpao.go.th`;
      }
      tpl.signerName = `(${currentUser.fullName})`;
      tpl.signerPosition = currentUser.position;
    }
    setDocType(type);
    setFields(tpl);
    setEditingDocId(null);
    setAppView("editor");
  };

  /** เปิดหน้าแก้ไขเอกสารที่มีอยู่ */
  const handleEditDoc = (doc: SavedDocument) => {
    setDocType(doc.docType);
    setFields({ ...doc.fields });
    setEditingDocId(doc.id);
    setAppView("editor");
  };

  /** เปิดหน้าดู/พิมพ์เอกสาร (โหลดฟิลด์แล้วไปอยู่ view mode) */
  const handleViewDoc = (doc: SavedDocument) => {
    setDocType(doc.docType);
    setFields({ ...doc.fields });
    setEditingDocId(doc.id);
    setAppView("view");
  };

  /** บันทึกเอกสารลง store แล้วกลับหน้ารายการ */
  const handleSaveAndGoList = () => {
    if (editingDocId) {
      updateDocument(editingDocId, docType, fields);
    } else {
      createDocument(docType, fields, currentUser?.fullName, currentUser?.id);
    }
    setAppView("list");
  };

  /** กลับหน้ารายการโดยไม่บันทึกเพิ่ม */
  const handleBackToList = () => {
    setAppView("list");
  };

  // ─── Login Guard: ผู้ใช้งานต้องเข้าสู่ระบบก่อนเข้าถึงเอกสาร ──────
  if (!currentUser) {
    return <AuthPage onLogin={handleLoginUser} />;
  }

  return (
    <div className="app-container">
      {/* 1. Top Global Navigation Header: สีเขียวมรกตราชการตาม Mockup */}
      <header className="app-header no-print">
        <div className="header-left">
          <button
            type="button"
            className="brand-badge-btn"
            onClick={() => setAppView("list")}
            title="คลิกเพื่อกลับสู่หน้ารายการหนังสือราชการ"
            style={{ display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", cursor: "pointer" }}
          >
            <div className="brand-icon" title="ระบบงานสารบรรณ">
              <img src="/book-logo.svg" alt="ระบบสารบรรณ" width="34" height="34" />
            </div>
            <div className="brand-text-group" style={{ textAlign: "left" }}>
              <div className="brand-title" style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.2px" }}>
                ระบบสารบรรณอิเล็กทรอนิกส์ <span style={{ fontSize: "13px", fontWeight: 400, opacity: 0.9 }}>(Sarabun Digital System)</span>
              </div>
              <div className="brand-subtitle" style={{ color: "#a7f3d0", fontSize: "12px" }}>
                องค์การบริหารส่วนจังหวัดปราจีนบุรี (อบจ.ปราจีนบุรี)
              </div>
            </div>
          </button>

          {/* Badge แสดงสถานะฐานข้อมูล */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 600,
              padding: "3px 9px",
              borderRadius: "20px",
              backgroundColor: isApiOnline ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
              color: isApiOnline ? "#a7f3d0" : "#fef08a",
              border: isApiOnline ? "1px solid rgba(167, 243, 208, 0.3)" : "1px solid rgba(254, 240, 138, 0.3)",
              marginLeft: "6px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: isApiOnline ? "#10b981" : "#f59e0b",
                display: "inline-block",
              }}
            />
            {isApiOnline ? "ระบบออนไลน์" : "โหมดออฟไลน์"}
          </div>
        </div>

        <div className="header-right">
          {/* Action buttons ตามแต่ละมุมมอง */}
          {appView === "editor" && (
            <>
              <button
                type="button"
                className="btn btn-view-mode-nav"
                onClick={() => setAppView("view")}
                title="สลับไปดูตัวอย่างพิมพ์หน้าเต็ม"
              >
                🖨️ ดูตัวอย่างพิมพ์
              </button>
              <button
                type="button"
                className="editor-save-go-list-btn"
                onClick={handleSaveAndGoList}
                title="บันทึกเอกสารและกลับหน้ารายการ"
              >
                ✓ บันทึกแล้วกลับรายการ
              </button>
            </>
          )}

          {appView === "view" && (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-header-action"
                onClick={() => setAppView("editor")}
                title="กลับไปหน้าจอพิมพ์ร่างและแก้ไข"
              >
                ✏️ แก้ไขต่อ
              </button>
              <button
                type="button"
                className="btn-print-primary-nav"
                onClick={() => window.print()}
                title="สั่งพิมพ์เอกสาร A4 (Ctrl+P)"
              >
                🖨️ สั่งพิมพ์เอกสาร
              </button>
            </>
          )}

          {/* กระดิ่งแจ้งเตือนตามแบบในภาพ Mockup */}
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "15px",
            }}
            title="การแจ้งเตือน"
          >
            🔔
          </div>

          {/* User profile dropdown button */}
          {currentUser && (
            <div
              onClick={() => {
                setPreviousView(appView === "signatories" || appView === "profile" ? previousView : (appView as any));
                setAppView("profile");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 12px 4px 6px",
                borderRadius: "20px",
                backgroundColor: "rgba(255, 255, 255, 0.14)",
                cursor: "pointer",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
              title="คลิกเพื่อแก้ไขข้อมูลโปรไฟล์"
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  color: "#065f46",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                {currentUser.fullName ? currentUser.fullName.charAt(0) : "👤"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", lineHeight: 1.2 }}>
                  {currentUser.fullName}
                </span>
                <span style={{ fontSize: "11px", color: "#a7f3d0", lineHeight: 1.2 }}>
                  {currentUser.position || currentUser.division}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            className="member-logout-btn"
            onClick={handleLogoutUser}
            title="ออกจากระบบ"
            style={{
              padding: "5px 10px",
              fontSize: "12px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* 2. App Body: Left Sidebar + Main Workspace (ตามภาพ Mockup) */}
      <div className="app-body-container">
        {/* Left Sidebar */}
        <aside className="app-sidebar no-print">
          <nav className="sidebar-nav">
            <button
              type="button"
              className={`sidebar-nav-item ${appView === "list" ? "active" : ""}`}
              onClick={() => setAppView("list")}
              title="คลังหนังสือราชการของฉัน"
            >
              <span className="sidebar-nav-icon">🏠</span>
              <span className="sidebar-nav-label">หน้าหลัก</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${appView === "editor" ? "active" : ""}`}
              onClick={() => handleCreateNew("memo")}
              title="ร่างหนังสือราชการใหม่"
            >
              <span className="sidebar-nav-icon">📄</span>
              <span className="sidebar-nav-label">สร้างเอกสาร</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${appView === "signatories" ? "active" : ""}`}
              onClick={() => {
                setPreviousView(appView === "signatories" || appView === "profile" ? previousView : (appView as any));
                setAppView("signatories");
              }}
              title="จัดการรายชื่อผู้ลงนาม"
            >
              <span className="sidebar-nav-icon">✍️</span>
              <span className="sidebar-nav-label">ผู้ลงนาม</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${appView === "profile" ? "active" : ""}`}
              onClick={() => {
                setPreviousView(appView === "signatories" || appView === "profile" ? previousView : (appView as any));
                setAppView("profile");
              }}
              title="แก้ไขข้อมูลโปรไฟล์ / สังกัด"
            >
              <span className="sidebar-nav-icon">⚙️</span>
              <span className="sidebar-nav-label">การตั้งค่า</span>
            </button>
          </nav>

          {/* Sidebar Footer User Card */}
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {currentUser.fullName ? currentUser.fullName.charAt(0) : "👤"}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{currentUser.fullName}</div>
              <div className="sidebar-user-dept">
                {currentUser.division.replace("องค์การบริหารส่วนจังหวัด", "อบจ.")}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="app-workspace" style={{ flex: 1, overflowY: "auto" }}>

          {/* ─── หน้ารายการเอกสาร (list view) ─── */}
          {appView === "list" && (
            <DocumentListPage
              currentUser={currentUser}
              onCreateNew={handleCreateNew}
              onEditDoc={handleEditDoc}
              onViewDoc={handleViewDoc}
            />
          )}

          {/* ─── หน้าแก้ไขโปรไฟล์ (profile view) ─── */}
          {appView === "profile" && (
            <ProfilePage
              currentUser={currentUser}
              onUpdate={(up) => {
                setCurrentUser(up);
                handleUpdateProfile(up);
              }}
              onBack={() => setAppView(previousView || "list")}
            />
          )}

          {/* ─── หน้าจัดการผู้ลงนาม (signatories view) ─── */}
          {appView === "signatories" && (
            <SignatoryPage
              currentUser={currentUser}
              onBack={() => setAppView(previousView || "list")}
            />
          )}

          {/* ─── หน้าร่าง+แก้ไข (editor view) หรือ หน้าดู/พิมพ์ (view view) ─── */}
          {(appView === "editor" || appView === "view") && (
            <>
            {/* คอลัมน์ซ้าย: ฟอร์มพิมพ์และร่างเนื้อหา (ขยายกว้างขวาง สบายตา ปรับขนาดได้) */}
            <section
              className="editor-panel no-print"
              style={{ width: `${editorWidthPercent}%`, display: appView === "view" ? "none" : undefined }}
            >
              <div className="editor-header-bar">
                <div className="editor-title">
                  <span>
                    {docType === "memo"
                      ? "ร่างเนื้อหา: หนังสือภายใน (บันทึกข้อความ in01.pdf)"
                      : "ร่างเนื้อหา: หนังสือภายนอก (03.pdf)"}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div className="save-indicator">
                    <span className="save-dot" />
                    <span>{saveStatus}</span>
                  </div>

                  {/* ตัวเลือกขนาดความกว้างฝั่งพิมพ์แบบด่วน */}
                  <div className="width-presets" title="เลือกความกว้างฝั่งพิมพ์">
                    <span style={{ fontSize: "11.5px", color: "var(--text-muted)", marginRight: "2px" }}>
                      ขนาดฝั่งพิมพ์:
                    </span>
                    <button
                      type="button"
                      className={`preset-btn ${editorWidthPercent === 55 ? "active" : ""}`}
                      onClick={() => setEditorWidthPercent(55)}
                      title="ความกว้างแบบมาตรฐาน 55%"
                    >
                      55%
                    </button>
                    <button
                      type="button"
                      className={`preset-btn ${editorWidthPercent === 65 ? "active" : ""}`}
                      onClick={() => setEditorWidthPercent(65)}
                      title="ขยายฝั่งพิมพ์ 65% (แนะนำ - พิมพ์สบายตา)"
                    >
                      65% (ขยาย)
                    </button>
                    <button
                      type="button"
                      className={`preset-btn ${editorWidthPercent === 75 ? "active" : ""}`}
                      onClick={() => setEditorWidthPercent(75)}
                      title="ขยายกว้างพิเศษ 75%"
                    >
                      75%
                    </button>
                  </div>
                </div>
              </div>

              <DocumentEditor
                type={docType}
                fields={fields}
                onChange={setFields}
                onConvertThaiNums={handleConvertAllToThaiNums}
                onInsertSampleTable={handleInsertSampleTable}
                currentUser={currentUser}
                onOpenAuth={(t) => {
                  setAuthModalTab(t || "login");
                  setIsAuthModalOpen(true);
                }}
                onManageSignatories={() => {
                  setPreviousView("editor");
                  setAppView("signatories");
                }}
              />
            </section>

            {/* แถบเส้นแบ่งปรับขนาด (ไม่แสดงใน view mode) */}
            {appView !== "view" && (
              <div
                className={`resizer-splitter no-print ${isDragging ? "dragging" : ""}`}
                onMouseDown={startDragging}
                title="คลิกแล้วลากเพื่อปรับขนาดความกว้างฝั่งพิมพ์ตามที่ต้องการ"
              >
                <div className="resizer-handle" />
              </div>
            )}

            {/* คอลัมน์ขวา: แสดงพรีวิวกระดาษ A4 เสมือนจริงเคียงข้างกันตลอดเวลา */}
            <section
              className="preview-panel"
              style={{ width: appView === "view" ? "100%" : `calc(${100 - editorWidthPercent}% - 8px)` }}
            >
              <div className="preview-controls no-print">
                <div className="zoom-controls">
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", marginRight: "4px" }}>
                    มุมมอง:
                  </span>
                  <button
                    type="button"
                    className="zoom-btn"
                    onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
                    title="ซูมออก"
                  >
                    -
                  </button>
                  <span className="zoom-text">{Math.round(zoom * 100)}%</span>
                  <button
                    type="button"
                    className="zoom-btn"
                    onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(1))))}
                    title="ซูมเข้า"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "4px 8px", fontSize: "11px", height: "28px" }}
                    onClick={() => setZoom(0.85)}
                  >
                    รีเซ็ต
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {docType === "memo" && (
                    <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={showDottedLines}
                        onChange={(e) => setShowDottedLines(e.target.checked)}
                      />
                      แสดงเส้นประจุดไข่ปลา
                    </label>
                  )}

                  <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={showMarginGuide}
                      onChange={(e) => setShowMarginGuide(e.target.checked)}
                    />
                    เส้นวัดขอบ
                  </label>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: "5px 12px" }}
                    onClick={handlePrintDocument}
                    title="พิมพ์ลงกระดาษ A4 หรือบันทึกเป็น PDF (พิมพ์ครบทุกหน้า)"
                  >
                    🖨️ พิมพ์ / PDF
                  </button>
                </div>
              </div>

              {/* พื้นที่แสดงกระดาษ A4 เสมือนจริง */}
              <div className="preview-scroll-container">
                <div
                  className="paper-wrapper"
                  style={{
                    transform: `scale(${zoom})`,
                  }}
                >
                    <PrintPage
                      type={docType}
                      fields={fields}
                      showDottedLines={showDottedLines}
                      showMarginGuide={showMarginGuide}
                    />
                </div>
              </div>
            </section>
          </>
        )}

        </main>
      </div>

      {/* 3. หน้าต่างระบบสมาชิก (เข้าสู่ระบบ / สมัครใหม่ / จัดการสังกัด) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleLoginUser}
        onLogout={handleLogoutUser}
        onUpdateProfile={handleUpdateProfile}
        initialTab={authModalTab}
      />
    </div>
  );
};
