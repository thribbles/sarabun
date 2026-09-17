import React, { useState, useLayoutEffect, useRef } from "react";
import "../../styles/print.css";
import { GarudaCrest } from "./GarudaCrest";
import {
  splitBodyIntoBlocks,
  ContentBlock,
  DocumentPageData,
  A4_SAFE_PRINTABLE_HEIGHT_PX,
  PAGE_NUMBER_HEADER_PX,
  MEMO_HEADER_ESTIMATE_PX,
  EXTERNAL_HEADER_ESTIMATE_PX,
  SIGNATURE_BLOCK_ESTIMATE_PX,
} from "./paginationHelper";
import { convertToThaiNumerals, DEFAULT_BOTTOM_SLOGAN } from "../../src/sampleData";

/**
 * แยกวันที่ราชการไทย เช่น "๑๗ กันยายน ๒๕๖๙" เป็น 2 ส่วน:
 * - dayPart: "๑๗ " (เลขวันที่ + เว้นวรรค)
 * - monthYearPart: "กันยายน ๒๕๖๙" (ชื่อเดือน + ปี)
 * สำหรับจัดวางวันที่หนังสือภายนอกตามระเบียบสารบรรณ:
 * "ตัวอักษรแรกของชื่อเดือนต้องตรงกับเท้าขวาของตราครุฑ"
 */
function splitThaiDate(date: string): { dayPart: string; monthYearPart: string } {
  const trimmed = date.trim();
  // หาช่องว่างตัวแรก (หลังเลขวันที่)
  const firstSpace = trimmed.indexOf(" ");
  if (firstSpace === -1) return { dayPart: "", monthYearPart: trimmed };
  return {
    dayPart: trimmed.slice(0, firstSpace + 1), // "๑๗ "
    monthYearPart: trimmed.slice(firstSpace + 1), // "กันยายน ๒๕๖๙"
  };
}

export type DocumentTypeCode = "memo" | "external";

export type PrintFields = {
  // ฟิลด์ส่วนกลาง
  documentNo?: string;
  date: string;
  subject: string;
  to: string;
  body: string; // รองรับทั้ง HTML string หรือ plain text แยก \n\n
  signerName?: string;
  signerPosition?: string;

  // เฉพาะ memo (หนังสือภายใน / บันทึกข้อความ) — อ้างอิง in01.pdf / exam01.pdf
  department?: string;

  // เฉพาะ external (หนังสือภายนอก) — อ้างอิง exam02.pdf / 03.pdf
  agencyTop?: string;
  agencyAddress?: string;
  reference?: string;
  enclosure?: string;
  footerOffice?: string;

  // ข้อความด้านล่างของหนังสือราชการ (ตามนโยบายกระทรวงมหาดไทย/อปท.)
  bottomSlogan?: string;
  showBottomSlogan?: boolean;
};

/**
 * เรนเดอร์บล็อกข้อความแต่ละก้อน (Paragraph, Table, List)
 */
const RenderBlock: React.FC<{ block: ContentBlock }> = ({ block }) => {
  if (block.type === "table") {
    return (
      <div
        className="body-block rich-content"
        dangerouslySetInnerHTML={{ __html: block.htmlContent }}
      />
    );
  }

  if (block.type === "list") {
    return (
      <div
        className="body-block rich-content"
        dangerouslySetInnerHTML={{ __html: block.htmlContent }}
      />
    );
  }

  const isContinued = !block.isIndent;
  return (
    <div className="body-block">
      <p className={`para ${isContinued ? "para-continued" : ""}`}>
        {block.htmlContent}
      </p>
    </div>
  );
};

/**
 * PrintPage: Render หนังสือราชการตัดหน้ากระดาษ A4 เสมือนจริงเมื่อเต็มตามระเบียบสารบรรณ
 * รองรับทั้งหนังสือภายใน (in01.pdf) และหนังสือภายนอก (03.pdf)
 */
export const PrintPage: React.FC<{
  type: DocumentTypeCode;
  fields: PrintFields;
  id?: string;
  showDottedLines?: boolean;
  showMarginGuide?: boolean;
}> = ({
  type,
  fields,
  id = "print-page",
  showDottedLines = true,
  showMarginGuide = false,
}) => {
  const [pages, setPages] = useState<DocumentPageData[]>([]);
  const measureRef = useRef<HTMLDivElement>(null);

  const rawBlocks = splitBodyIntoBlocks(fields.body || "");

  // คำนวณและตัดหน้ากระดาษตามความสูงจริงของเนื้อหาในหน้า A4 (952px printable area)
  useLayoutEffect(() => {
    if (!measureRef.current) {
      setPages([
        {
          pageNumber: 1,
          pageNumberThai: "๑",
          blocks: rawBlocks,
          isFirstPage: true,
          isLastPage: true,
        },
      ]);
      return;
    }

    const headerEl = measureRef.current.querySelector('[data-measure="header"]');
    const signatureEl = measureRef.current.querySelector('[data-measure="signature"]');
    const footerOfficeEl = measureRef.current.querySelector('[data-measure="footer-office"]');

    const headerH = headerEl
      ? (headerEl as HTMLElement).offsetHeight
      : (type === "memo" ? MEMO_HEADER_ESTIMATE_PX : EXTERNAL_HEADER_ESTIMATE_PX);

    const sigH = signatureEl
      ? (signatureEl as HTMLElement).offsetHeight
      : SIGNATURE_BLOCK_ESTIMATE_PX;

    const footerH = footerOfficeEl
      ? (footerOfficeEl as HTMLElement).offsetHeight
      : 0;

    const signatureTotalH = sigH + footerH + 16;

    // ความจุพื้นที่พิมพ์ (พิกเซลที่ความละเอียด 96 DPI ของ A4)
    // หน้า ๑: พื้นที่พิมพ์ 920px ลบด้วยความสูงของส่วนหัว
    const page1Capacity = Math.max(200, A4_SAFE_PRINTABLE_HEIGHT_PX - headerH);
    // หน้า ๒ เป็นต้นไป: พื้นที่พิมพ์ 920px ลบด้วยหัวเลขหน้า "- ๒ -"
    const pageNCapacity = A4_SAFE_PRINTABLE_HEIGHT_PX - PAGE_NUMBER_HEADER_PX;

    const calculateBlockHeight = (block: ContentBlock): number => {
      const el = measureRef.current?.querySelector(`[data-block-id="${block.id}"]`) as HTMLElement | null;
      if (el && el.offsetHeight > 10) {
        return el.offsetHeight + 8;
      }
      // คำนวณความสูง fallback อัตโนมัติตามความยาวและประเภท
      if (block.type === "table") {
        const rowCount = (block.htmlContent.match(/<tr/gi) || []).length;
        return Math.max(90, rowCount * 38 + 20);
      }
      if (block.type === "list") {
        const itemCount = (block.htmlContent.match(/<li/gi) || []).length;
        return Math.max(60, itemCount * 30 + 16);
      }
      const textLen = block.htmlContent.replace(/<[^>]+>/g, "").length;
      const lines = Math.max(1, Math.ceil(textLen / 60));
      return lines * 28 + 8;
    };

    // ตรวจสอบความสูงของแต่ละบล็อก
    const blockHeights = rawBlocks.map(calculateBlockHeight);

    // เริ่มจัดบล็อกลงหน้ากระดาษ A4 ตามระเบียบสารบรรณ
    const generatedPages: DocumentPageData[] = [];
    let currentBlocks: ContentBlock[] = [];
    let currentHeight = 0;
    let currentCapacity = page1Capacity;

    rawBlocks.forEach((block, idx) => {
      const bHeight = blockHeights[idx] || 36;
      const isLastBlock = idx === rawBlocks.length - 1;
      const isConcludingBlock = block.isConcluding || isLastBlock;
      const spaceNeeded = bHeight + (isConcludingBlock ? signatureTotalH : 0);

      // กฎระเบียบสารบรรณ: ถ้าย่อหน้าจบ ("จึงเรียนมาเพื่อ...") หรือบล็อกสุดท้าย อยู่ในหน้าปัจจุบันแล้วลายเซ็นไม่พอ
      // ให้ตัดขึ้นหน้า ๒ ทันที เพื่อนำย่อหน้าจบไปอยู่ร่วมกับลายเซ็นในหน้าถัดไปเสมอ ห้ามปล่อยลายเซ็นอยู่โดดเดี่ยว
      if (isConcludingBlock && currentHeight + spaceNeeded > currentCapacity && currentBlocks.length > 0) {
        generatedPages.push({
          pageNumber: generatedPages.length + 1,
          pageNumberThai: convertToThaiNumerals(String(generatedPages.length + 1)),
          blocks: currentBlocks,
          isFirstPage: generatedPages.length === 0,
          isLastPage: false,
        });
        currentBlocks = [block];
        currentHeight = bHeight;
        currentCapacity = pageNCapacity;
        return;
      }

      if (currentHeight + spaceNeeded <= currentCapacity) {
        currentBlocks.push(block);
        currentHeight += bHeight;
      } else if (currentHeight + bHeight <= currentCapacity && !isLastBlock) {
        currentBlocks.push(block);
        currentHeight += bHeight;
      } else {
        // เมื่อเต็มหน้า A4 ให้ตัดขึ้นหน้าใหม่ทันที
        if (currentBlocks.length > 0) {
          generatedPages.push({
            pageNumber: generatedPages.length + 1,
            pageNumberThai: convertToThaiNumerals(String(generatedPages.length + 1)),
            blocks: currentBlocks,
            isFirstPage: generatedPages.length === 0,
            isLastPage: false,
          });
          currentBlocks = [block];
          currentHeight = bHeight;
          currentCapacity = pageNCapacity;
        } else {
          // บล็อกเดียวสูงเกินหน้ากระดาษ ให้ใส่ลงไป
          currentBlocks.push(block);
          currentHeight += bHeight;
        }
      }
    });

    // บันทึกหน้าสุดท้าย
    if (currentBlocks.length > 0 || generatedPages.length === 0) {
      // ตรวจสอบความปลอดภัย: หากลายมือชื่อล้นหน้า ให้ยกย่อหน้าสุดท้ายไปอยู่หน้าใหม่คู่กับลายมือชื่อ เพื่อป้องกันลายมือชื่ออยู่โดดเดี่ยว
      if (currentHeight + signatureTotalH > currentCapacity && currentBlocks.length > 1) {
        const movedBlock = currentBlocks.pop()!;
        generatedPages.push({
          pageNumber: generatedPages.length + 1,
          pageNumberThai: convertToThaiNumerals(String(generatedPages.length + 1)),
          blocks: currentBlocks,
          isFirstPage: generatedPages.length === 0,
          isLastPage: false,
        });
        generatedPages.push({
          pageNumber: generatedPages.length + 1,
          pageNumberThai: convertToThaiNumerals(String(generatedPages.length + 1)),
          blocks: [movedBlock],
          isFirstPage: false,
          isLastPage: true,
        });
      } else {
        generatedPages.push({
          pageNumber: generatedPages.length + 1,
          pageNumberThai: convertToThaiNumerals(String(generatedPages.length + 1)),
          blocks: currentBlocks,
          isFirstPage: generatedPages.length === 0,
          isLastPage: true,
        });
      }
    }

    if (generatedPages.length > 0) {
      generatedPages[generatedPages.length - 1].isLastPage = true;
    }

    setPages(generatedPages);
  }, [type, fields.body, fields.subject, fields.department, fields.signerName, fields.signerPosition, fields.documentNo]);

  const dottedClass = showDottedLines ? "dotted-active" : "";
  const displayPages = pages.length > 0 ? pages : [
    {
      pageNumber: 1,
      pageNumberThai: "๑",
      blocks: rawBlocks,
      isFirstPage: true,
      isLastPage: true,
    },
  ];

  // ส่วนราชการ: คงขนาดฟอนต์มาตรฐาน 16pt ไว้เสมอ หากชื่อกองหรือฝ่ายยาว ให้บีบตัวอักษร (Squeeze / Condense) แทนการลดขนาดฟอนต์
  const deptLen = (fields.department || "").length;
  let deptStyle: React.CSSProperties = {
    fontSize: "16pt",
    lineHeight: 1.2,
    display: "inline-block",
    whiteSpace: "nowrap",
  };
  if (deptLen > 48) {
    if (deptLen > 85) {
      deptStyle.letterSpacing = "-0.7px";
      deptStyle.transform = "scaleX(0.90)";
      deptStyle.transformOrigin = "left center";
    } else if (deptLen > 70) {
      deptStyle.letterSpacing = "-0.5px";
      deptStyle.transform = "scaleX(0.95)";
      deptStyle.transformOrigin = "left center";
    } else if (deptLen > 58) {
      deptStyle.letterSpacing = "-0.35px";
    } else {
      deptStyle.letterSpacing = "-0.2px";
    }
  }

  return (
    <>
      {/* องค์ประกอบซ่อนสำหรับวัดขนาดพิกเซลจริงของฟอนต์และองค์ประกอบ (Hidden Measurement Stage) */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className={`print-page sheet-page doc-${type}`}
        style={{
          position: "absolute",
          top: -99999,
          left: -99999,
          width: "210mm",
          height: "auto",
          maxHeight: "none",
          minHeight: "auto",
          visibility: "hidden",
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <div data-measure="header">
          {type === "memo" ? (
            <>
              <div className="memo-header">
                <div className="memo-crest-box">
                  <div style={{ height: "1.5cm" }} />
                </div>
                <h2 className="memo-title">บันทึกข้อความ</h2>
              </div>
              <div className="field-row field-dept-row">
                <span className="field-label">ส่วนราชการ</span>
                <span className="field-val" style={deptStyle}>{fields.department || ""}</span>
              </div>
              <div className="field-row field-no-date-row">
                <div className="no-group">
                  <span className="field-label">ที่</span>
                  <span className="field-val">{fields.documentNo || ""}</span>
                </div>
                <div className="date-group">
                  <span className="field-label">วันที่</span>
                  <span className="field-val">{fields.date || ""}</span>
                </div>
              </div>
              <div className="field-row field-subject-row">
                <span className="field-label">เรื่อง</span>
                <span className="field-val">{fields.subject || ""}</span>
              </div>
              <div className="field-row field-to-row">
                <span className="field-label">เรียน</span>
                <span className="field-val">{fields.to || ""}</span>
              </div>
            </>
          ) : (
            <>
              <div className="crest-wrapper external-crest">
                <div style={{ height: "3cm" }} />
              </div>
              <div className="ext-meta-header">
                <div className="meta-left">
                  <span className="field-label">ที่</span>
                  <span className="field-val">{fields.documentNo || ""}</span>
                </div>
                <div className="meta-right">
                  <div className="agency-name field-val">{fields.agencyTop || ""}</div>
                  <div className="agency-address field-val">{fields.agencyAddress || ""}</div>
                </div>
              </div>
              {/* วันที่: ตัวแรกของชื่อเดือนต้องตรงกับเท้าขวาของตราครุฑ (กึ่งกลางหน้า) */}
              <div className="ext-date-row">
                <span className="ext-date-day">{splitThaiDate(fields.date || "").dayPart}</span>
                <span className="field-val">{splitThaiDate(fields.date || "").monthYearPart}</span>
              </div>
              <div className="field-row">
                <span className="field-label">เรื่อง</span>
                <span className="field-val">{fields.subject || ""}</span>
              </div>
              <div className="field-row">
                <span className="field-label">เรียน</span>
                <span className="field-val">{fields.to || ""}</span>
              </div>
            </>
          )}
        </div>

        {rawBlocks.map((b) => (
          <div
            key={b.id}
            data-block-id={b.id}
            className={`body-block ${b.type === "table" || b.type === "list" ? "rich-content" : ""}`}
          >
            {b.type === "table" || b.type === "list" ? (
              <div dangerouslySetInnerHTML={{ __html: b.htmlContent }} />
            ) : (
              <p className={`para ${!b.isIndent ? "para-continued" : ""}`}>{b.htmlContent}</p>
            )}
          </div>
        ))}

        <div data-measure="signature" className="signature-block">
          <div className="signer-col">
            <div className="name">{fields.signerName || ""}</div>
            <div className="position">{fields.signerPosition || ""}</div>
          </div>
        </div>

        {type === "external" && fields.footerOffice && (
          <div data-measure="footer-office" className="footer-office-block">
            {fields.footerOffice}
          </div>
        )}
      </div>

      {/* แสดงผลแผ่นกระดาษ A4 เสมือนจริง (ตัดหน้าเมื่อเต็มตามระเบียบสารบรรณ) */}
      <div className="sheets-container" id={id}>
        {displayPages.map((page, pageIdx) => {
          const isPage1 = pageIdx === 0;
          const isFinal = page.isLastPage;

          return (
            <div key={page.pageNumber} className="sheet-wrapper">
              {/* ป้ายกำกับระบุแผ่นที่ สำหรับตรวจทาน (ซ่อนอัตโนมัติเมื่อสั่งพิมพ์) */}
              <div className="sheet-tag no-print">
                📄 แผ่นที่ {page.pageNumberThai} (หน้า {page.pageNumberThai}) {displayPages.length > 1 ? `จากทั้งหมด ${convertToThaiNumerals(String(displayPages.length))} แผ่น` : ""}
              </div>

              <div
                className={`print-page sheet-page doc-${type} ${dottedClass}`}
                id={`a4-sheet-${page.pageNumber}`}
              >
                {showMarginGuide && <div className="margin-guide-indicator no-print" />}

                {/* 1. ส่วนหัวหน้ากระดาษ */}
                {isPage1 ? (
                  // หน้าที่ ๑: แสดงตราครุฑทางการและข้อมูลหัวหนังสือตามระเบียบ
                  type === "memo" ? (
                    <>
                      <div className="memo-header">
                        <div className="memo-crest-box">
                          <GarudaCrest size="1.5cm" />
                        </div>
                        <h2 className="memo-title">บันทึกข้อความ</h2>
                      </div>

                      <div className="field-row field-dept-row">
                        <span className="field-label">ส่วนราชการ</span>
                        <div className="field-underline-box">
                          <span className="field-val" style={deptStyle}>{fields.department || ""}</span>
                        </div>
                      </div>

                      <div className="field-row field-no-date-row">
                        <div className="no-group">
                          <span className="field-label">ที่</span>
                          <div className="field-underline-box">
                            <span className="field-val">{fields.documentNo || ""}</span>
                          </div>
                        </div>
                        <div className="date-group">
                          <span className="field-label">วันที่</span>
                          <div className="field-underline-box">
                            <span className="field-val">{fields.date || ""}</span>
                          </div>
                        </div>
                      </div>

                      <div className="field-row field-subject-row">
                        <span className="field-label">เรื่อง</span>
                        <div className="field-underline-box">
                          <span className="field-val">{fields.subject || ""}</span>
                        </div>
                      </div>

                      <div className="field-row field-to-row">
                        <span className="field-label">เรียน</span>
                        <div className="field-val-box">
                          <span className="field-val">{fields.to || ""}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="crest-wrapper external-crest">
                        <GarudaCrest size="3cm" />
                      </div>

                      <div className="ext-meta-header">
                        <div className="meta-left">
                          <span className="field-label">ที่</span>
                          <span className="field-val">{fields.documentNo || ""}</span>
                        </div>
                        <div className="meta-right">
                          <div className="agency-name field-val">{fields.agencyTop || ""}</div>
                          {fields.agencyAddress && (
                            <div className="agency-address field-val">{fields.agencyAddress}</div>
                          )}
                        </div>
                      </div>

                      {/* วันที่: ตัวแรกของชื่อเดือนต้องตรงกับเท้าขวาของตราครุฑ (กึ่งกลางหน้า) */}
                      <div className="ext-date-row">
                        <span className="ext-date-day">{splitThaiDate(fields.date || "").dayPart}</span>
                        <span className="field-val">{splitThaiDate(fields.date || "").monthYearPart}</span>
                      </div>

                      <div className="field-row">
                        <span className="field-label">เรื่อง</span>
                        <span className="field-val">{fields.subject || ""}</span>
                      </div>
                      <div className="field-row">
                        <span className="field-label">เรียน</span>
                        <span className="field-val">{fields.to || ""}</span>
                      </div>
                      {fields.reference && (
                        <div className="field-row">
                          <span className="field-label">อ้างถึง</span>
                          <span className="field-val">{fields.reference}</span>
                        </div>
                      )}
                      {fields.enclosure && (
                        <div className="field-row">
                          <span className="field-label">สิ่งที่ส่งมาด้วย</span>
                          <span className="field-val">{fields.enclosure}</span>
                        </div>
                      )}
                    </>
                  )
                ) : (
                  // หน้าที่ ๒ เป็นต้นไป: แสดงเลขหน้ากึ่งกลางด้านบน "- ๒ -" ตามระเบียบสำนักนายกฯ
                  <div className="page-number-header">
                    <span>- {page.pageNumberThai} -</span>
                  </div>
                )}

                {/* 2. เนื้อหาสำหรับหน้านี้ */}
                <div className="page-body-content">
                  {page.blocks.map((block) => (
                    <RenderBlock key={block.id} block={block} />
                  ))}
                </div>

                {/* 3. ส่วนท้ายหนังสือ (เฉพาะหน้าสุดท้าย) */}
                {isFinal && (
                  <>
                    {type === "external" && <div className="closing">ขอแสดงความนับถือ</div>}

                    <div className="signature-block">
                      <div className="signer-col">
                        <div className="name">{fields.signerName || ""}</div>
                        <div className="position">{fields.signerPosition || ""}</div>
                      </div>
                    </div>

                    {type === "external" && fields.footerOffice && (
                      <div className="footer-office-block">
                        {fields.footerOffice.split("\n").map((line, idx) => (
                          <div key={idx}>{line}</div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* 4. ข้อความด้านล่างของหนังสือราชการ (หากมีหน้า ๒ ให้ไปหน้า ๒ หน้าแรกไม่ต้องมี) */}
                {((pages.length === 1 && page.pageNumber === 1) || (pages.length > 1 && page.pageNumber === 2)) && (
                  <div className="page-bottom-slogan">
                    {fields.bottomSlogan || DEFAULT_BOTTOM_SLOGAN}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
