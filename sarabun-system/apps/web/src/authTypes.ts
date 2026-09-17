import { PRACHIN_BURI_DIVISIONS } from "./sampleData";

export interface UserMember {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  position: string;
  division: string;
  section: string;
  phone: string;
  docPrefix: string;
  useShortOrgName?: boolean;
}

/**
 * บัญชีสมาชิกตัวอย่างเริ่มต้น (Preset Demo Accounts) ประจำแต่ละกองของ อบจ.ปราจีนบุรี
 */
export const DEFAULT_MEMBERS: UserMember[] = [
  {
    id: "mem-nayok",
    username: "nayok",
    password: "123",
    fullName: "ฮนมะ ยูจิโจ",
    position: "นายกองค์การบริหารส่วนจังหวัดปราจีนบุรี",
    division: "องค์การบริหารส่วนจังหวัดปราจีนบุรี",
    section: "",
    phone: "โทร. ๐-๓๗๒๑-๑๕๗๙",
    docPrefix: "ปจ ๕๑๐๐๑/",
    useShortOrgName: true,
  },
  {
    id: "mem-admin",
    username: "admin",
    password: "123",
    fullName: "นาย คิระ ยามาโตะ",
    position: "หัวหน้าสำนักปลัด อบจ.ปราจีนบุรี",
    division: "สำนักปลัดองค์การบริหารส่วนจังหวัด",
    section: "ฝ่ายอำนวยการ",
    phone: "โทร. ๐-๓๗๒๑-๑๕๗๙",
    docPrefix: "ปจ ๕๑๐๐๑/",
    useShortOrgName: true,
  },
  {
    id: "mem-pasadu",
    username: "pasadu",
    password: "123",
    fullName: "นางสาว โจเซพ โจสตา",
    position: "ผู้อำนวยการกองพัสดุและทรัพย์สิน",
    division: "กองพัสดุและทรัพย์สิน",
    section: "ฝ่ายจัดหาพัสดุ",
    phone: "โทร. ๐-๓๗๔๕-๒๐๓๓",
    docPrefix: "ปจ ๕๑๐๒๑/",
    useShortOrgName: true,
  },
  {
    id: "mem-chang",
    username: "chang",
    password: "123",
    fullName: "นาย เอโดงาว่า โคนัน",
    position: "ผู้อำนวยการกองช่าง",
    division: "กองช่าง",
    section: "ฝ่ายก่อสร้างและซ่อมบำรุง",
    phone: "โทร. ๐-๓๗๔๕-๒๐๓๕",
    docPrefix: "ปจ ๕๑๐๐๓/",
    useShortOrgName: true,
  },
  {
    id: "mem-klang",
    username: "klang",
    password: "123",
    fullName: "นางสาว เฟริน จุบจุบ",
    position: "ผู้อำนวยการกองคลัง",
    division: "กองคลัง",
    section: "ฝ่ายการเงินและบัญชี",
    phone: "โทร. ๐-๓๗๔๕-๒๐๓๔",
    docPrefix: "ปจ ๕๑๐๐๒/",
    useShortOrgName: true,
  },
  {
    id: "mem-yotta",
    username: "yotta",
    password: "123",
    fullName: "มาสค์ไรเดอร์ ดีเคด",
    position: "ผู้อำนวยการกองยุทธศาสตร์และงบประมาณ",
    division: "กองยุทธศาสตร์และงบประมาณ",
    section: "ฝ่ายแผนงานและงบประมาณ",
    phone: "โทร. ๐-๓๗๔๕-๒๐๓๘",
    docPrefix: "ปจ ๕๑๐๐๕/",
    useShortOrgName: true,
  },
  {
    id: "mem-ph",
    username: "ph",
    password: "123",
    fullName: "นาง อุอิอะ เอาะแอะ",
    position: "ผู้อำนวยการกองสาธารณสุข",
    division: "กองสาธารณสุข",
    section: "ฝ่ายส่งเสริมสาธารณสุข",
    phone: "โทร. ๐-๓๗๔๕-๒๐๓๖",
    docPrefix: "ปจ ๕๑๐๐๔/",
    useShortOrgName: true,
  },
  {
    id: "mem-edu",
    username: "edu",
    password: "123",
    fullName: "เอดาจิม่า เฮฮาจิ",
    position: "ผู้อำนวยการกองการศึกษา ศาสนา และวัฒนธรรม",
    division: "กองการศึกษา ศาสนา และวัฒนธรรม",
    section: "ฝ่ายบริหารการศึกษา",
    phone: "โทร. ๐-๓๗๔๕-๒๐๓๗",
    docPrefix: "ปจ ๕๑๐๐๖/",
    useShortOrgName: true,
  },
];

const STORAGE_MEMBERS_KEY = "sarabun_auth_members";
const STORAGE_CURRENT_USER_KEY = "sarabun_current_user";

const MEMBERS_VERSION_KEY = "sarabun_members_version";
const CURRENT_MEMBERS_VERSION = "v2026_09_17_02";

/**
 * โหลดรายชื่อสมาชิกทั้งหมดจาก localStorage (โดยรักษาข้อมูลที่ผู้ใช้แก้ไขไว้ ไม่เขียนทับซ้ำซาก)
 */
export function loadAllMembers(): UserMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_MEMBERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(DEFAULT_MEMBERS));
      localStorage.setItem(MEMBERS_VERSION_KEY, CURRENT_MEMBERS_VERSION);
      return [...DEFAULT_MEMBERS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const storedVersion = localStorage.getItem(MEMBERS_VERSION_KEY);

      // ทำการอัปเดตชื่อเริ่มต้นเฉพาะเมื่อ version เปลี่ยนเพียงครั้งเดียว (One-time Migration)
      if (storedVersion !== CURRENT_MEMBERS_VERSION) {
        const updated = parsed.map((item) => {
          const demoMatch = DEFAULT_MEMBERS.find(
            (d) => d.id === item.id || d.username.toLowerCase() === item.username.toLowerCase()
          );
          if (demoMatch) {
            return {
              ...item,
              fullName: demoMatch.fullName,
              position: demoMatch.position,
              division: demoMatch.division,
              section: demoMatch.section,
              phone: demoMatch.phone,
              docPrefix: demoMatch.docPrefix,
              useShortOrgName: true,
            };
          }
          return item;
        });

        // เติม Demo user ที่อาจจะยังไม่มีใน storage
        for (const d of DEFAULT_MEMBERS) {
          const foundIdx = updated.findIndex((u) => u.username.toLowerCase() === d.username.toLowerCase());
          if (foundIdx === -1) {
            updated.push(d);
          }
        }

        localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(updated));
        localStorage.setItem(MEMBERS_VERSION_KEY, CURRENT_MEMBERS_VERSION);
        return updated;
      }

      // หากเป็นเวอร์ชันปัจจุบันแล้ว ให้คงข้อมูลที่ผู้ใช้แก้ไขไว้ทั้งหมด
      // เพียงแค่เติม user ใหม่ที่ยังไม่มีใน storage
      let modified = false;
      for (const d of DEFAULT_MEMBERS) {
        if (!parsed.some((u) => u.username.toLowerCase() === d.username.toLowerCase())) {
          parsed.push(d);
          modified = true;
        }
      }
      if (modified) {
        localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(parsed));
      }

      return parsed;
    }
    return [...DEFAULT_MEMBERS];
  } catch (e) {
    return [...DEFAULT_MEMBERS];
  }
}

/**
 * บันทึกรายชื่อสมาชิกทั้งหมดลง localStorage
 */
export function saveAllMembers(members: UserMember[]): void {
  try {
    localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(members));
  } catch (e) {
    console.error("Failed to save members", e);
  }
}

/**
 * โหลดสมาชิกที่กำลังเข้าสู่ระบบอยู่ (โดยไม่เขียนทับข้อมูลที่ผู้ใช้แก้ไข)
 */
export function loadCurrentMember(): UserMember | null {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (!raw) {
      return null;
    }
    const parsed: UserMember = JSON.parse(raw);
    const storedVersion = localStorage.getItem(MEMBERS_VERSION_KEY);
    if (storedVersion !== CURRENT_MEMBERS_VERSION) {
      const demoMatch = DEFAULT_MEMBERS.find(
        (d) => d.id === parsed.id || d.username.toLowerCase() === parsed.username.toLowerCase()
      );
      if (demoMatch) {
        parsed.fullName = demoMatch.fullName;
        parsed.position = demoMatch.position;
        parsed.division = demoMatch.division;
        parsed.section = demoMatch.section;
        parsed.phone = demoMatch.phone;
        parsed.docPrefix = demoMatch.docPrefix;
        parsed.useShortOrgName = true;
        saveCurrentMember(parsed);
      }
    }
    return parsed;
  } catch (e) {
    return null;
  }
}

/**
 * บันทึกสมาชิกปัจจุบันลง localStorage
 */
export function saveCurrentMember(user: UserMember | null): void {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    } else {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.error("Failed to save current user", e);
  }
}

export function clearCurrentMember(): void {
  saveCurrentMember(null);
}

/**
 * สมัครสมาชิก / ลงทะเบียนเจ้าหน้าที่ใหม่
 */
export function registerMember(data: Omit<UserMember, "id">): { success: boolean; message?: string; user?: UserMember } {
  const members = loadAllMembers();
  const trimmedUser = data.username.trim().toLowerCase();
  if (!trimmedUser) {
    return { success: false, message: "กรุณาระบุชื่อผู้ใช้งาน" };
  }
  if (members.some((m) => m.username.toLowerCase() === trimmedUser)) {
    return { success: false, message: "ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว กรุณาเลือกชื่ออื่น" };
  }

  const newUser: UserMember = {
    ...data,
    id: `mem-${Date.now()}`,
    username: trimmedUser,
  };

  members.push(newUser);
  saveAllMembers(members);
  saveCurrentMember(newUser);
  return { success: true, user: newUser };
}

/**
 * อัปเดตข้อมูลโปรไฟล์ผู้ใช้งาน และซิงค์ไปยังรายชื่อผู้ลงนาม
 */
export function updateMemberProfile(userId: string, data: Partial<UserMember>): UserMember | null {
  const members = loadAllMembers();
  const index = members.findIndex((m) => m.id === userId);
  if (index === -1) return null;

  const oldUser = members[index];
  const updated: UserMember = { ...oldUser, ...data };
  members[index] = updated;
  saveAllMembers(members);
  saveCurrentMember(updated);

  // ซิงค์ชื่อและตำแหน่งไปยังรายการผู้ลงนามที่สอดคล้องกัน (ถ้ามี)
  try {
    const rawSigs = localStorage.getItem("sarabun_signatories");
    if (rawSigs) {
      const sigs = JSON.parse(rawSigs);
      if (Array.isArray(sigs)) {
        let sigModified = false;
        const oldNameClean = oldUser.fullName.replace(/[()]/g, "").trim();
        const newFormattedName = `(${updated.fullName.replace(/[()]/g, "").trim()})`;

        const updatedSigs = sigs.map((s) => {
          const sClean = (s.name || "").replace(/[()]/g, "").trim();
          const isTarget =
            s.id === `preset-${updated.username}` ||
            (updated.username === "nayok" && s.id === "preset-nayok") ||
            (updated.username === "edu" && s.id === "preset-edu") ||
            (updated.username === "yotta" && s.id === "preset-yotta") ||
            (updated.username === "admin" && s.id === "preset-palad") ||
            (oldNameClean && sClean === oldNameClean);

          if (isTarget) {
            sigModified = true;
            return {
              ...s,
              name: newFormattedName,
              position: updated.position || s.position,
              division: updated.division || s.division,
            };
          }
          return s;
        });

        if (sigModified) {
          localStorage.setItem("sarabun_signatories", JSON.stringify(updatedSigs));
        }
      }
    }
  } catch (e) {
    console.error("Failed to sync signatory on profile update", e);
  }

  return updated;
}




/**
 * แปลงข้อมูลสมาชิกเป็นข้อความ "ส่วนราชการ" อัตโนมัติ
 */
export function buildDepartmentString(
  user: Pick<UserMember, "division" | "section" | "phone" | "useShortOrgName">
): string {
  const orgPrefix = user.useShortOrgName === false ? "องค์การบริหารส่วนจังหวัดปราจีนบุรี" : "อบจ.ปราจีนบุรี";
  const secPart = user.section
    ? ` (${user.section.startsWith("ฝ่าย") ? user.section : `ฝ่าย${user.section}`})`
    : "";
  return `${orgPrefix} ${user.division}${secPart} ${user.phone}`.trim();
}
