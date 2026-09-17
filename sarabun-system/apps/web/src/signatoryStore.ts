/**
 * signatoryStore.ts
 * จัดการรายชื่อผู้ลงนามที่บันทึกไว้ใน localStorage
 * รองรับการแบ่งสิทธิ์ตามสังกัดกอง (ผู้ลงนามจะลงนามได้แค่กองนั้นๆ ยกเว้นนายก อบจ. เห็นทุกกอง)
 */

export interface Signatory {
  id: string;
  name: string;       // ชื่อ-สกุล (รูปแบบ: (นายสมชาย สบายดี))
  position: string;   // ตำแหน่ง
  note?: string;      // หมายเหตุ เช่น "นายก อบจ.", "รักษาราชการแทน"
  division?: string;  // กอง/สังกัด เช่น "ทั้งหมด", "กองการศึกษา ศาสนา และวัฒนธรรม", "กองยุทธศาสตร์และงบประมาณ"
}

const STORAGE_KEY = "sarabun_signatories";

/** ค่าเริ่มต้นเมื่อยังไม่มีข้อมูลใน localStorage หรือกดคืนค่าเริ่มต้น */
export const DEFAULT_SIGNATORIES: Signatory[] = [
  {
    id: "preset-nayok",
    name: "(ฮนมะ ยูจิโจ)",
    position: "นายกองค์การบริหารส่วนจังหวัดปราจีนบุรี",
    note: "นายก อบจ.ปราจีนบุรี",
    division: "ทั้งหมด",
  },
  {
    id: "preset-palad",
    name: "(นายพิพัฒน์ ชัยชนะ)",
    position: "ปลัดองค์การบริหารส่วนจังหวัดปราจีนบุรี",
    note: "ปลัด อบจ.ปราจีนบุรี",
    division: "ทั้งหมด",
  },
  {
    id: "preset-edu",
    name: "(เอดาจิม่า เฮฮาจิ)",
    position: "ผู้อำนวยการกองการศึกษา ศาสนาและวัฒนธรรม",
    note: "ผอ.กองการศึกษา",
    division: "กองการศึกษา ศาสนา และวัฒนธรรม",
  },
  {
    id: "preset-yotta",
    name: "(มาสค์ไรเดอร์ ดีเคด)",
    position: "ผู้อำนวยการกองยุทธศาสตร์และงบประมาณ",
    note: "ผอ.กองยุทธศาสตร์",
    division: "กองยุทธศาสตร์และงบประมาณ",
  },
  {
    id: "preset-admin",
    name: "(นาย คิระ ยามาโตะ)",
    position: "หัวหน้าสำนักปลัด อบจ.ปราจีนบุรี",
    note: "หัวหน้าสำนักปลัด",
    division: "สำนักปลัดองค์การบริหารส่วนจังหวัด",
  },
  {
    id: "preset-chang",
    name: "(นาย เอโดงาว่า โคนัน)",
    position: "ผู้อำนวยการกองช่าง",
    note: "ผอ.กองช่าง",
    division: "กองช่าง",
  },
  {
    id: "preset-klang",
    name: "(นางสาว เฟริน จุบจุบ)",
    position: "ผู้อำนวยการกองคลัง",
    note: "ผอ.กองคลัง",
    division: "กองคลัง",
  },
  {
    id: "preset-pasadu",
    name: "(นางสาว โจเซพ โจสตา)",
    position: "ผู้อำนวยการกองพัสดุและทรัพย์สิน",
    note: "ผอ.กองพัสดุฯ",
    division: "กองพัสดุและทรัพย์สิน",
  },
];

export function loadSignatories(): Signatory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveSignatories(DEFAULT_SIGNATORIES);
      return [...DEFAULT_SIGNATORIES];
    }
    const parsed: Signatory[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveSignatories(DEFAULT_SIGNATORIES);
      return [...DEFAULT_SIGNATORIES];
    }

    // ซิงค์ชื่อผู้บริหารมาตรฐานหากเป็น preset เก่า
    let modified = false;
    const updated = parsed.map((s) => {
      if (s.id === "preset-nayok" && (s.name.includes("เอดาจิม่า") || s.name.includes("เฮฮาจิ"))) {
        modified = true;
        return {
          ...s,
          name: "(ฮนมะ ยูจิโจ)",
          position: "นายกองค์การบริหารส่วนจังหวัดปราจีนบุรี",
          note: "นายก อบจ.ปราจีนบุรี",
          division: "ทั้งหมด",
        };
      }
      return s;
    });

    // เติม preset ที่ยังไม่มีใน storage
    for (const preset of DEFAULT_SIGNATORIES) {
      if (!updated.some((item) => item.id === preset.id)) {
        updated.push(preset);
        modified = true;
      }
    }

    if (modified) {
      saveSignatories(updated);
    }
    return updated;
  } catch {
    return [...DEFAULT_SIGNATORIES];
  }
}

export function saveSignatories(list: Signatory[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** รีเซ็ตรายชื่อผู้ลงนามกลับเป็นค่าเริ่มต้นมาตรฐาน อบจ.ปราจีนบุรี */
export function resetToDefaultSignatories(): Signatory[] {
  saveSignatories(DEFAULT_SIGNATORIES);
  return [...DEFAULT_SIGNATORIES];
}

/**
 * ดึงรายชื่อผู้ลงนามตามสิทธิ์ของผู้ใช้งาน:
 * - ผู้ลงนามจะลงนามได้แค่กองนั้นๆ
 * - ยกเว้นนายก อบจ. ที่จะเห็นผู้ลงนามของทุกกอง
 */
export function getSignatoriesForUser(
  user: { username?: string; division?: string; position?: string } | null,
  docDepartment?: string
): Signatory[] {
  const all = loadSignatories();
  if (!user) return all;

  // ตรวจสอบสิทธิ์ นายก อบจ. (ยกเว้นนายก อบจ. เห็นทุกกอง)
  const isNayok =
    user.username?.toLowerCase() === "nayok" ||
    user.position?.includes("นายก") ||
    user.division === "องค์การบริหารส่วนจังหวัดปราจีนบุรี";

  if (isNayok) {
    return all;
  }

  // ผู้ใช้งานทั่วไป: ลงนามได้แค่กองนั้นๆ + ผู้บริหารส่วนกลาง ("ทั้งหมด")
  const userDiv = (user.division || "").trim().toLowerCase();
  const docDiv = (docDepartment || "").trim().toLowerCase();

  return all.filter((s) => {
    const sDiv = (s.division || "ทั้งหมด").trim().toLowerCase();
    // ส่วนกลาง (นายก อบจ. และ ปลัด อบจ.) สามารถลงนามได้ทุกกอง
    if (
      sDiv === "ทั้งหมด" ||
      sDiv === "all" ||
      sDiv === "องค์การบริหารส่วนจังหวัดปราจีนบุรี" ||
      sDiv === "ส่วนกลาง"
    ) {
      return true;
    }
    // ผู้ลงนามประจำกอง: ต้องตรงกับกองของตนเอง หรือกองของเอกสาร
    const matchUser = userDiv && (userDiv.includes(sDiv) || sDiv.includes(userDiv));
    const matchDoc = docDiv && (docDiv.includes(sDiv) || sDiv.includes(docDiv));
    return matchUser || matchDoc;
  });
}

/** เพิ่มผู้ลงนาม พร้อมตรวจสอบชื่อซ้ำ */
export function addSignatory(data: Omit<Signatory, "id">): Signatory {
  const list = loadSignatories();
  const cleanTarget = data.name.replace(/[()]/g, "").trim().toLowerCase();
  
  const existingIdx = list.findIndex(
    (s) => s.name.replace(/[()]/g, "").trim().toLowerCase() === cleanTarget
  );
  
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...data };
    saveSignatories(list);
    return list[existingIdx];
  }

  const item: Signatory = {
    ...data,
    division: data.division || "ทั้งหมด",
    id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };
  list.push(item);
  saveSignatories(list);
  return item;
}

/** แก้ไขผู้ลงนาม */
export function updateSignatory(id: string, data: Partial<Omit<Signatory, "id">>): boolean {
  const list = loadSignatories();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], ...data };
  saveSignatories(list);
  return true;
}

/** ลบผู้ลงนาม */
export function deleteSignatory(id: string): boolean {
  const list = loadSignatories();
  const filtered = list.filter((s) => s.id !== id);
  saveSignatories(filtered);
  return true;
}
