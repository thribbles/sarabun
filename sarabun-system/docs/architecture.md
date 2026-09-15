# สถาปัตยกรรมระบบ (System Architecture)
## ระบบร่างหนังสือราชการและพิมพ์เอกสารบนเว็บ

เอกสารนี้ต่อยอดจาก `plan.md` และสเปกการจัดหน้าใน `rabeab.md` / `03.pdf` (ระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ) และตัวอย่างจริงใน `exam01.pdf`, `exam02.pdf`, `in01.pdf` (บันทึกข้อความ อบจ.ปราจีนบุรี) เพื่อให้เป็นสเปกที่พร้อมลงมือเขียนโค้ดได้จริง

---

## 1. โครงสร้างโปรเจกต์ (Monorepo)

```text
sarabun-system/
├── apps/
│   ├── web/                 # Next.js (Frontend)
│   │   ├── app/
│   │   │   ├── (auth)/login/
│   │   │   ├── (main)/dashboard/
│   │   │   ├── (main)/documents/
│   │   │   │   ├── [id]/edit/
│   │   │   │   ├── [id]/preview/
│   │   │   │   └── new/
│   │   │   ├── (main)/templates/
│   │   │   ├── (main)/admin/users/
│   │   │   └── (main)/admin/departments/
│   │   ├── components/
│   │   │   ├── editor/          # TipTap-based rich text editor
│   │   │   ├── print/           # Print/A4 layout components
│   │   │   └── ui/
│   │   ├── lib/api/             # API client (typed)
│   │   └── styles/print.css     # @page / A4 rules
│   └── api/                  # NestJS (Backend)
│       ├── src/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── departments/
│       │   ├── roles/
│       │   ├── document-types/
│       │   ├── templates/
│       │   ├── documents/
│       │   ├── document-contents/
│       │   ├── document-signers/
│       │   ├── attachments/
│       │   ├── audit-log/
│       │   ├── pdf/             # Chromium headless PDF service
│       │   └── common/ (guards, interceptors, filters)
│       └── test/
├── packages/
│   ├── shared-types/         # DTO / interface ที่ frontend+backend ใช้ร่วมกัน
│   └── template-schema/      # JSON schema ของ Template (ดูข้อ 4)
├── docker-compose.yml
└── docs/
    ├── plan.md
    ├── rabeab.md
    └── architecture.md (ไฟล์นี้)
```

เหตุผลที่แยก NestJS ออกจาก Next.js API Routes: งานสารบรรณต้องมี Audit Log, RBAC ละเอียด และ PDF generation ที่รันเป็น background job ได้ ซึ่งจัดการง่ายกว่าถ้าแยก service

---

## 2. Print Engine — สเปกที่ดึงมาจาก 03.pdf / rabeab.md

จากตัวอย่างจริง (03.pdf) ค่ามาตรฐานที่ต้องทำเป็นค่าคงที่ในระบบ (CSS variables + ค่าตั้งต้นของ Template):

```css
:root {
    --page-width: 210mm;
    --page-height: 297mm;
    --margin-top: 2.5cm;      /* ขอบบน ~2.5 ซม. */
    --margin-left: 3cm;       /* ขอบซ้าย ~3 ซม. */
    --margin-right: 2cm;      /* ขอบขวา ~2 ซม. */
    --margin-bottom: 2cm;     /* ขอบล่าง ~2 ซม. */
    --font-family: "TH Sarabun New", sans-serif;
    --font-size-body: 16pt;
    --line-height: 1;         /* "1 เท่า หรือ Single" ตาม 03.pdf */
    --crut-width: 1.5cm;      /* ครุฑขนาดจากขอบกระดาษประมาณ 1.5 ซม. */
    --crut-height: 3cm;       /* สูง 3 ซม. */
}

@page {
    size: A4;
    margin: 0; /* ควบคุม margin เองด้วย .print-page เพื่อความแม่นยำ */
}

@media print {
    body { margin: 0; }
    .print-page {
        width: var(--page-width);
        min-height: var(--page-height);
        padding: var(--margin-top) var(--margin-right) var(--margin-bottom) var(--margin-left);
        font-family: var(--font-family);
        font-size: var(--font-size-body);
        line-height: var(--line-height);
        page-break-after: always;
    }
    .signature-block {
        break-inside: avoid;
        page-break-inside: avoid;
    }
}
```

กฎการเว้นระยะที่พบใน 03.pdf ต้องเก็บเป็นข้อมูล config ของ Template แต่ละประเภท (ไม่ hard-code ใน component):

| องค์ประกอบ | กฎ |
|---|---|
| หลังเลขที่/เรื่อง/เรียน/อ้างถึง/สิ่งที่ส่งมาด้วย | 1 Enter + Before 6pt |
| ย่อหน้าเนื้อหา | ย่อหน้า 2.5 ซม. |
| ก่อน "ขอแสดงความนับถือ" | 1 Enter + Before 12pt |
| ระหว่างคำลงท้ายกับลายมือชื่อ | 4 Enter |
| บรรทัดในย่อหน้าเดียวกัน | 1 เท่า (Single) |

ระบบควรมีตาราง `template_layout_rules` (ดูข้อ 4) เก็บค่าพวกนี้เป็นข้อมูล ไม่ใช่ CSS ตายตัว เพื่อให้ปรับตามหนังสือแต่ละประเภทได้โดยไม่แก้โค้ด

**Preview = Print = PDF**: ให้ทั้งสามทางใช้ CSS ไฟล์เดียวกัน (`print.css`) — Preview render ในหน้าเว็บด้วย class `.print-page` ใน container ที่ scale ให้พอดีจอ, Browser Print เรียก `window.print()` ตรง ๆ, Server PDF ใช้ Chromium headless render หน้าเดียวกันแล้ว export

---

## 3. Template ประเภทแรก: บันทึกข้อความ (อ้างอิง in01.pdf / exam01.pdf)

โครงสร้างฟิลด์ของ Template "บันทึกข้อความ" (ตรงกับตัวอย่างจริงของ อบจ.ปราจีนบุรี):

```text
header:
  - ตราครุฑ (fixed asset, ตำแหน่งคงที่)
  - "บันทึกข้อความ" (หัวเรื่องกลางหน้า)
fields:
  - ส่วนราชการ (text, รวมเบอร์โทร)
  - ที่ (auto-generate ได้ตามข้อ 6 หรือกรอกเอง)
  - วันที่ (date)
  - เรื่อง (text)
  - เรียน (text)
body:
  - เนื้อหา (rich text, ย่อหน้าอิสระ)
footer:
  - ลายมือชื่อ (signature image, optional)
  - ชื่อผู้ลงนาม (text)
  - ตำแหน่ง (text)
```

ประเภทหนังสือถัดไป (หนังสือภายนอก, หนังสือภายใน, หนังสือประทับตรา, เอกสารแนบ) ใช้โครง `document_templates` เดียวกัน ต่างกันที่ `fields_schema` และ `layout_rules` เท่านั้น — ไม่ต้องเพิ่ม table ใหม่ต่อประเภท

---

## 4. Database Schema (PostgreSQL, ฉบับเต็ม)

```sql
-- ผู้ใช้และสิทธิ์
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES departments(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL       -- ADMIN, AUTHOR, REVIEWER, VIEWER
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    position TEXT,
    department_id UUID REFERENCES departments(id),
    role_id INT REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    failed_login_count INT DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ประเภทหนังสือ + Template (ออกแบบให้เพิ่มประเภทใหม่ได้โดยไม่แก้ core)
CREATE TABLE document_types (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,       -- 'external','internal','memo','stamped','attachment'
    name TEXT NOT NULL
);

CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type_id INT REFERENCES document_types(id),
    name TEXT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    page_size TEXT DEFAULT 'A4',
    margins JSONB NOT NULL,          -- {top,left,right,bottom}
    font JSONB NOT NULL,             -- {family,size,lineHeight}
    header_config JSONB,             -- ตำแหน่งครุฑ, ข้อความหัว
    footer_config JSONB,
    fields_schema JSONB NOT NULL,    -- รายการฟิลด์ตามข้อ 3
    layout_rules JSONB NOT NULL,     -- กฎ Enter/spacing ตามข้อ 2
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (document_type_id, version)
);

-- หนังสือ
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_no TEXT,                -- เลขที่หนังสือ เช่น ปจ 51021/5960
    document_type_id INT REFERENCES document_types(id),
    template_id UUID REFERENCES document_templates(id),
    department_id UUID REFERENCES departments(id),
    subject TEXT NOT NULL,
    to_person TEXT,
    reference TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT/REVIEW/APPROVED/PRINTED/CANCELLED
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE document_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    content JSONB NOT NULL,          -- TipTap JSON (ไม่ใช่ HTML ดิบ เพื่อความปลอดภัย/แก้ไขง่าย)
    version INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE document_signers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position TEXT,
    signature_url TEXT,
    signed_at TIMESTAMPTZ
);

CREATE TABLE document_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE document_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    content_version INT NOT NULL,
    note TEXT,                       -- เช่น "แก้ไขเรื่อง", "ตรวจสอบแล้ว"
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE document_logs (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,            -- CREATE/UPDATE/APPROVE/PRINT/EXPORT_PDF/CANCEL
    ip_address INET,
    result TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

Index ที่ต้องมีตั้งแต่แรก: `documents(document_no)`, `documents(status)`, `documents(department_id)`, full-text search index บน `documents(subject)` (ใช้ `pg_trgm` หรือ Postgres `tsvector` เพราะเป็นภาษาไทย ลอง `pg_trgm` ก่อนเพราะ Thai text search built-in ไม่รองรับการตัดคำดี)

---

## 5. API Design (NestJS, REST)

```text
POST   /auth/login
POST   /auth/logout
GET    /auth/me

GET    /documents?status=&department=&q=&page=
POST   /documents
GET    /documents/:id
PATCH  /documents/:id
DELETE /documents/:id
POST   /documents/:id/submit-review
POST   /documents/:id/approve
POST   /documents/:id/reject
POST   /documents/:id/print          -> log action, ส่ง print.css payload
GET    /documents/:id/pdf            -> stream PDF จาก Chromium headless
GET    /documents/:id/revisions
GET    /documents/:id/contents/:version

POST   /documents/:id/attachments
GET    /documents/:id/attachments/:attachmentId

GET    /templates?documentType=
POST   /templates                     -- ADMIN เท่านั้น
POST   /templates/:id/new-version

GET    /users
POST   /users
PATCH  /users/:id
GET    /departments
GET    /audit-log?documentId=&userId=
```

RBAC middleware: `@Roles('ADMIN','AUTHOR')` guard ตรวจจาก `role_id` ของ user + ตรวจ ownership (AUTHOR แก้ได้เฉพาะหนังสือของตัวเองที่ยังเป็น DRAFT)

Security ที่ต้องมีตั้งแต่ Phase 1 (ตามข้อ 16 ใน plan.md): input validation ด้วย `class-validator`, sanitize เนื้อหา (เก็บเป็น TipTap JSON ไม่ใช่ HTML ดิบ ตัดปัญหา XSS ไปมาก), rate limit บน `/auth/login`, CSRF token สำหรับ cookie-based session, ตรวจ MIME/extension จริงของไฟล์แนบ (ไม่เชื่อ header จาก client)

---

## 6. Workflow สถานะเอกสาร

```text
DRAFT --submit--> REVIEW --approve--> APPROVED --print/export--> PRINTED
  ^                  |
  |                  reject
  +------------------+

(ทุกสถานะ) --cancel--> CANCELLED
```

Transition ทุกจุดบันทึกลง `document_revisions` + `document_logs`

---

## 7. MVP Roadmap ที่จับต้องได้ (สอดคล้องกับ plan.md ข้อ 32)

| ลำดับ | งาน | Output ที่ตรวจสอบได้ |
|---|---|---|
| 1 | Print Engine: component `<PrintPage>` + `print.css` ตามข้อ 2 | เทียบ Preview vs พิมพ์จริง 1 หน้า ตรงกับ 03.pdf |
| 2 | Template บันทึกข้อความ (JSON schema ตามข้อ 3) | Render ได้เหมือน exam01.pdf |
| 3 | Editor (TipTap + ฟอร์มฟิลด์) | กรอก+เนื้อหา แล้ว preview เห็นผลทันที |
| 4 | Preview + Print/PDF (2 วิธีตาม plan.md ข้อ 24) | กด Print ได้จริง, กด PDF ได้ไฟล์ที่ layout ตรงกัน |
| 5 | Database + API เชื่อม CRUD จริง | บันทึกร่าง, แก้ไขย้อนหลังได้ |
| 6 | User/Role (ADMIN/AUTHOR/REVIEWER/VIEWER) | login, สิทธิ์แยกตามบทบาท |
| 7 | Workflow (ข้อ 6) | DRAFT→REVIEW→APPROVED→PRINTED ใช้งานได้ |
| 8 | Audit Log | ทุก action หลักถูกบันทึก |
| 9 | เลขหนังสืออัตโนมัติ, Digital Signature, SSO | Phase 3 |

---

## 8. สิ่งที่ยังต้องตัดสินใจ (ต้องถามผู้ใช้ก่อนเริ่ม Phase 1 จริง)

1. Deploy บนเซิร์ฟเวอร์ของหน่วยงาน (on-prem) หรือ Cloud — มีผลต่อการเลือก Object Storage (MinIO local vs S3)
2. จะเชื่อมกับระบบสารบรรณเดิม/เลขที่หนังสือของ อบจ. หรือไม่ (มีผลต่อ endpoint ออกเลขอัตโนมัติ)
3. มี Font TH Sarabun New license สำหรับฝังในเว็บ (web font) หรือให้ตรวจสอบ/ใช้ Google Fonts TH Sarabun New (ฟรี, มีอยู่แล้ว)
4. จำนวนผู้ใช้งานเริ่มต้นและแผนกที่ต้องรองรับ (มีผลต่อการออกแบบ `departments` เป็น tree หรือ flat)
