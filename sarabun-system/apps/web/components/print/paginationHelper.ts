/**
 * paginationHelper.ts
 * ตัวช่วยคำนวณและตัดหน้ากระดาษ A4 อัตโนมัติตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ
 * 
 * สเปก A4:
 * - กว้าง 210 มม., สูง 297 มม.
 * - ขอบบน 2.5 ซม. (94.5px), ขอบล่าง 2.0 ซม. (75.6px)
 * - ขอบซ้าย 3.0 ซม., ขอบขวา 2.0 ซม. -> ความกว้างพิมพ์ 160 มม. (604.7px)
 * - ความสูงพื้นที่พิมพ์รวมต่อหน้า = 297 - 25 - 20 = 252 มม. (~952.4px)
 * - เพื่อความปลอดภัยไม่ให้เนื้อหาชนขอบล่าง กำหนด Safe Printable Height = 920px
 * 
 * กฎการตัดหน้าและการลงลายมือชื่อตามระเบียบงานสารบรรณ:
 * 1. ย่อหน้าจบ ("จึงเรียนมาเพื่อ..."): เป็นบรรทัดจบเนื้อหา ต้องเยื้อง 2.5 ซม.
 * 2. ห้ามมิให้ลายมือชื่อไปอยู่โดดเดี่ยวในหน้าใหม่โดยไม่มีเนื้อความ
 * 3. หากลายมือชื่อล้นหน้า ต้องยกย่อหน้าจบ ("จึงเรียนมาเพื่อ...") ข้ามไปอยู่หน้า ๒ คู่กับลายมือชื่อเสมอ
 */

import { convertToThaiNumerals } from "../../src/sampleData";

export interface ContentBlock {
  id: string;
  type: "para" | "html" | "table" | "list";
  htmlContent: string;
  isIndent: boolean; // ย่อหน้า 2.5 ซม.
  isConcluding?: boolean; // เป็นย่อหน้าจบเนื้อหา (จึงเรียนมาเพื่อ...)
}

export interface DocumentPageData {
  pageNumber: number; // 1, 2, 3...
  pageNumberThai: string; // "๑", "๒", "๓"...
  blocks: ContentBlock[];
  isFirstPage: boolean;
  isLastPage: boolean;
}

// ค่ามาตรฐานในหน่วยพิกเซล (96 DPI: 1mm ≈ 3.7795px)
// กำหนด Safe Height 920px เพื่อเว้นระยะขอบล่าง 2 ซม. สบายตา ไม่ชนขอบกระดาษ
export const A4_SAFE_PRINTABLE_HEIGHT_PX = 920; 
export const MEMO_HEADER_ESTIMATE_PX = 250; // บันทึกข้อความ (ครุฑ 1.5 ซม. + หัวหนังสือ)
export const EXTERNAL_HEADER_ESTIMATE_PX = 300; // หนังสือภายนอก (ครุฑ 3 ซม. + หัว)
export const PAGE_NUMBER_HEADER_PX = 45; // หัวเลขหน้า "- ๒ -"
export const SIGNATURE_BLOCK_ESTIMATE_PX = 140; // บล็อกลงชื่อและตำแหน่ง (เว้น 4 Enter)

/**
 * แยกข้อความ Body ออกเป็นก้อน (Blocks) ที่สามารถตัดขึ้นหน้าใหม่ได้
 * ตรวจจับประโยคจบ ("จึงเรียนมาเพื่อ...") และจัดเป็นย่อหน้าจบเนื้อหาอัตโนมัติ
 */
export function splitBodyIntoBlocks(content: string): ContentBlock[] {
  if (!content || !content.trim()) return [];

  // แยก content ออกเป็น token ระหว่าง HTML blocks กับ plain text
  const blockTagRegex = /(<(?:table|ol|ul|div|blockquote)[\s\S]*?<\/(?:table|ol|ul|div|blockquote)>)/gi;
  const parts = content.split(blockTagRegex);
  
  const blocks: ContentBlock[] = [];
  let blockCounter = 0;

  parts.forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("<table") || trimmed.startsWith("<ol") || trimmed.startsWith("<ul") || trimmed.startsWith("<div") || trimmed.startsWith("<blockquote")) {
      const lower = trimmed.toLowerCase();
      const isTable = lower.startsWith("<table");
      const isList = lower.startsWith("<ol") || lower.startsWith("<ul");
      blocks.push({
        id: `block-${blockCounter++}`,
        type: isTable ? "table" : isList ? "list" : "html",
        htmlContent: trimmed,
        isIndent: false,
      });
    } else {
      // ตรวจจับย่อหน้าจบ "จึงเรียนมาเพื่อ..." / "จึงกราบเรียนมาเพื่อ..." / "จึงส่งมาเพื่อ..."
      // แยกให้อยู่ในบล็อกเดี่ยวเฉพาะตัวเสมอ
      const rawParas = trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

      rawParas.forEach((para) => {
        // หากในย่อหน้ามีคำขึ้นต้นภาคความประสงค์ เช่น "จึงเรียนมาเพื่อ..."
        const concludingMatch = para.search(/จึง(?:เรียน|กราบเรียน|เสนอ|แจ้ง|ส่ง)มาเพื่อ/);
        
        if (concludingMatch > 0) {
          // แยกข้อความก่อนหน้า กับข้อความ "จึงเรียนมาเพื่อ..."
          const beforeText = para.substring(0, concludingMatch).trim();
          const concludingText = para.substring(concludingMatch).trim();

          if (beforeText) {
            blocks.push({
              id: `block-${blockCounter++}`,
              type: "para",
              htmlContent: beforeText,
              isIndent: true,
            });
          }

          blocks.push({
            id: `block-${blockCounter++}`,
            type: "para",
            htmlContent: concludingText,
            isIndent: true, // บรรทัดจบต้องเยื้อง 2.5 ซม. เสมอ
            isConcluding: true,
          });
          return;
        }

        const isThisConcluding = /^จึง(?:เรียน|กราบเรียน|เสนอ|แจ้ง|ส่ง)มาเพื่อ/.test(para);

        const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length > 1 && !isThisConcluding) {
          lines.forEach((line, lIdx) => {
            const isLineConcluding = /^จึง(?:เรียน|กราบเรียน|เสนอ|แจ้ง|ส่ง)มาเพื่อ/.test(line);
            blocks.push({
              id: `block-${blockCounter++}`,
              type: "para",
              htmlContent: line,
              isIndent: lIdx === 0 || isLineConcluding,
              isConcluding: isLineConcluding,
            });
          });
        } else if (para.length > 280 && !isThisConcluding) {
          // ย่อหน้ายาว ตัดตามประโยคเพื่อการขึ้นหน้าที่สวยงาม
          const sentences = para.split(/(?<=[\.\!\?])\s+|(?=ทั้งนี้)|(?=อนึ่ง)/g).filter(Boolean);
          sentences.forEach((sent, sIdx) => {
            blocks.push({
              id: `block-${blockCounter++}`,
              type: "para",
              htmlContent: sent.trim(),
              isIndent: sIdx === 0,
            });
          });
        } else {
          blocks.push({
            id: `block-${blockCounter++}`,
            type: "para",
            htmlContent: para,
            isIndent: true,
            isConcluding: isThisConcluding,
          });
        }
      });
    }
  });

  return blocks;
}

/**
 * แทรกเนื้อหาใหม่ (ย่อหน้าใหม่, ตาราง, รายการ) ไว้ ก่อนหน้า ประโยคจบเสมอ
 * ห้ามแทรกไว้หลัง "จึงเรียนมาเพื่อ..." หรือประโยคจบเรื่องเด็ดขาด เพราะนี่คือจบเรื่องแล้ว
 * หากมีเนื้อหาเดิมที่หลงไปอยู่หลังประโยคจบ จะถูกย้ายกลับมาอยู่ข้างหน้าประโยคจบให้อัตโนมัติ
 */
export function insertContentBeforeConcluding(currentBody: string, snippet: string): string {
  if (!currentBody || !currentBody.trim()) {
    return `${snippet.trim()}\n\nจึงเรียนมาเพื่อโปรดทราบ`;
  }

  // ค้นหาประโยคจบเรื่องตามระเบียบงานสารบรรณ
  const concludingRegex = /(?:จึง(?:เรียน|กราบเรียน|ขอเรียน|เสนอ|แจ้ง|ส่ง)มาเพื่อ|จึงขอได้โปรด|จึงขอความร่วมมือ|จึงขอความอนุเคราะห์)[^\n]*/;
  const match = currentBody.match(concludingRegex);

  if (match && match.index !== undefined) {
    const concludingSentence = match[0].trim();
    // ข้อความที่อยู่ก่อนหน้าประโยคจบ
    const beforePart = currentBody.substring(0, match.index).trim();
    // ข้อความที่อาจหลงไปอยู่หลังประโยคจบ (เช่น ตาราง หรือย่อหน้าเดิม)
    const afterPart = currentBody.substring(match.index + match[0].length).trim();

    const parts: string[] = [];
    if (beforePart) parts.push(beforePart);
    if (afterPart) parts.push(afterPart);
    if (snippet && snippet.trim()) parts.push(snippet.trim());

    return `${parts.join("\n\n")}\n\n${concludingSentence}`;
  }

  // หากยังไม่มีประโยคจบในเนื้อหา ให้ต่อท้ายเนื้อหาเดิม
  return `${currentBody.trimEnd()}\n\n${snippet.trim()}\n\nจึงเรียนมาเพื่อโปรดทราบ`;
}

/**
 * ตรวจสอบและย้ายเนื้อหาทั้งหมดที่อยู่หลัง "จึงเรียนมาเพื่อ..." ให้กลับมาอยู่ข้างหน้าเสมอ
 */
export function ensureConcludingAtEnd(currentBody: string): string {
  if (!currentBody || !currentBody.trim()) return currentBody;

  const concludingRegex = /(?:จึง(?:เรียน|กราบเรียน|ขอเรียน|เสนอ|แจ้ง|ส่ง)มาเพื่อ|จึงขอได้โปรด|จึงขอความร่วมมือ|จึงขอความอนุเคราะห์)[^\n]*/;
  const match = currentBody.match(concludingRegex);
  if (!match || match.index === undefined) return currentBody;

  const concludingSentence = match[0].trim();
  const beforePart = currentBody.substring(0, match.index).trim();
  const afterPart = currentBody.substring(match.index + match[0].length).trim();

  // ถ้าไม่มีข้อความหลุดไปอยู่ข้างหลังประโยคจบอยู่แล้ว ไม่ต้องทำอะไร
  if (!afterPart) return currentBody;

  const parts: string[] = [];
  if (beforePart) parts.push(beforePart);
  if (afterPart) parts.push(afterPart);

  return `${parts.join("\n\n")}\n\n${concludingSentence}`;
}

/**
 * แปลงวันที่ ISO (YYYY-MM-DD จาก Date Picker) เป็นรูปแบบวันเดือนปีทางราชการไทย (เลขไทย)
 * เช่น "2026-09-14" -> "๑๔ กันยายน ๒๕๖๙"
 */
export function formatToThaiOfficialDate(isoDateStr: string): string {
  if (!isoDateStr) return "";
  const parts = isoDateStr.split("-");
  if (parts.length !== 3) return isoDateStr;

  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];

  const beYear = year > 2400 ? year : year + 543;
  const thaiDay = convertToThaiNumerals(String(day));
  const thaiMonth = thaiMonths[monthIdx] || "";
  const thaiYear = convertToThaiNumerals(String(beYear));

  return `${thaiDay} ${thaiMonth} ${thaiYear}`;
}

/**
 * ดึงวันที่ปัจจุบันในรูปแบบวันเดือนปีทางราชการไทย
 */
export function getTodayThaiOfficialDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return formatToThaiOfficialDate(`${yyyy}-${mm}-${dd}`);
}
