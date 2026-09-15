# แผนพัฒนาระบบร่างหนังสือราชการและพิมพ์เอกสาร

## 1. ชื่อโครงการ

**ระบบร่างหนังสือราชการและพิมพ์เอกสารบนเว็บ (Web-based Official Document Drafting & Printing System)**

---

## 2. วัตถุประสงค์

พัฒนาระบบสำหรับจัดทำหนังสือราชการผ่าน Web Browser โดยผู้ใช้งานสามารถ

* สร้างหนังสือราชการ
* กรอกข้อมูลหนังสือผ่านแบบฟอร์ม
* ร่างและจัดรูปแบบเนื้อหา
* ใช้ Template หนังสือราชการ
* Preview ก่อนพิมพ์
* พิมพ์ลงกระดาษ A4 โดยตรง
* บันทึกเป็น PDF
* แก้ไขหนังสือร่างย้อนหลัง
* ค้นหาและเรียกดูหนังสือ
* จัดการผู้ใช้งานและสิทธิ์
* เก็บประวัติการดำเนินการ

เป้าหมายหลักคือ **ลดการจัดรูปแบบเอกสารด้วย Microsoft Word และลดปัญหาการจัดหน้ากระดาษไม่ตรงกัน**

---

# 3. แนวคิดระบบ

ระบบแบ่งออกเป็น 2 ส่วนหลัก

### 3.1 ส่วนจัดทำหนังสือ

ผู้ใช้งานกรอกข้อมูลผ่าน Web Application

```text
ข้อมูลหนังสือ
    ↓
Template
    ↓
เนื้อหา
    ↓
ระบบจัด Layout
    ↓
Preview
```

### 3.2 ส่วนพิมพ์

```text
Preview
    ↓
Print Layout A4
    ↓
Browser Print
    ↓
เครื่องพิมพ์
```

ไม่ควรใช้หน้าเว็บสำหรับการพิมพ์โดยตรง แต่ควรสร้าง **Print Template** แยกจากหน้าจอใช้งาน

---

# 4. ประเภทเอกสารระยะแรก

รองรับหนังสือราชการที่จำเป็นต่อการใช้งานก่อน ได้แก่

1. หนังสือภายนอก
2. หนังสือภายใน
3. หนังสือประทับตรา
4. บันทึกข้อความ
5. เอกสารแนบ

สามารถเพิ่ม Template ใหม่ภายหลังได้โดยไม่ต้องแก้ Core System

---

# 5. ข้อมูลหนังสือ

## 5.1 ข้อมูลทั่วไป

* ประเภทหนังสือ
* เลขที่หนังสือ
* วันที่
* ชั้นความเร็ว
* ชั้นความลับ
* ส่วนราชการ
* เรื่อง
* เรียน
* อ้างถึง
* สิ่งที่ส่งมาด้วย

## 5.2 เนื้อหา

รองรับ

* ย่อหน้า
* ตัวหนา
* ตัวเอียง
* การจัดชิดซ้าย/ขวา/กึ่งกลาง
* ตาราง
* รายการหัวข้อ
* การขึ้นหน้าใหม่
* รูปภาพ
* ลายเซ็น
* ตำแหน่งผู้ลงนาม

## 5.3 ข้อมูลผู้ลงนาม

* ชื่อ
* นามสกุล
* ตำแหน่ง
* หน่วยงาน
* ลายเซ็น
* วันที่ลงนาม

---

# 6. Workflow

```text
Login
  ↓
Dashboard
  ↓
สร้างหนังสือ
  ↓
เลือกประเภทหนังสือ
  ↓
กรอกข้อมูล
  ↓
เขียนเนื้อหา
  ↓
บันทึกร่าง
  ↓
Preview
  ↓
ตรวจสอบรูปแบบ
  ↓
┌───────────────┐
│               │
↓               ↓
แก้ไข          ยืนยัน
                 ↓
          พิมพ์ / PDF
                 ↓
              เสร็จสิ้น
```

---

# 7. สถานะเอกสาร

กำหนดสถานะอย่างน้อยดังนี้

```text
DRAFT
ร่าง

REVIEW
รอตรวจสอบ

APPROVED
อนุมัติ

PRINTED
พิมพ์แล้ว

CANCELLED
ยกเลิก
```

---

# 8. ระบบผู้ใช้งาน

## Role

### ADMIN

สามารถ

* จัดการผู้ใช้งาน
* จัดการหน่วยงาน
* จัดการ Template
* จัดการระบบ
* ดู Audit Log

### AUTHOR

สามารถ

* สร้างหนังสือ
* แก้ไขหนังสือของตนเอง
* Preview
* พิมพ์
* Export PDF

### REVIEWER

สามารถ

* ตรวจสอบหนังสือ
* ส่งกลับแก้ไข
* อนุมัติ

### VIEWER

สามารถ

* ดูเอกสารที่ได้รับสิทธิ์

---

# 9. Print Engine

ส่วนนี้เป็นหัวใจของระบบ

## 9.1 กระดาษ

กำหนดมาตรฐาน

```text
Paper: A4
Width: 210 mm
Height: 297 mm
```

## 9.2 CSS Print

ใช้

```css
@page {
    size: A4;
    margin: 0;
}

@media print {
    body {
        margin: 0;
    }

    .print-page {
        width: 210mm;
        min-height: 297mm;
        page-break-after: always;
    }
}
```

## 9.3 ข้อกำหนด

ต้องควบคุม

* ระยะขอบ
* ตำแหน่งตราครุฑ
* ฟอนต์
* ขนาดตัวอักษร
* ระยะบรรทัด
* ย่อหน้า
* ตำแหน่งลายเซ็น
* Page Break

ให้คงที่ระหว่าง Preview และ Print

---

# 10. Font

ใช้ฟอนต์ราชการเป็นหลัก

```text
TH Sarabun New
```

ระบบควรติดตั้ง/โหลด Font จาก Web Server เพื่อให้เครื่อง Client ไม่จำเป็นต้องมี Font ติดตั้งเอง

ตัวอย่าง

```css
font-family: "TH Sarabun New", sans-serif;
```

---

# 11. Template System

Template ไม่ควร Hard-code อยู่ในหน้าเว็บ

ควรออกแบบเป็นระบบกลาง

```text
Template
├── name
├── type
├── version
├── page_size
├── margins
├── font
├── header
├── footer
├── fields
└── active
```

ตัวอย่าง

```text
หนังสือภายนอก
Version 1
Version 2
Version 3
```

เมื่อมีการเปลี่ยนแบบหนังสือ สามารถสร้าง Version ใหม่ได้

---

# 12. Database

แนะนำ PostgreSQL

โครงสร้างเบื้องต้น

```text
users
departments
roles
document_types
document_templates
documents
document_contents
document_signers
document_attachments
document_revisions
document_logs
```

## documents

```text
id
document_no
document_type_id
department_id
subject
to_person
reference
status
created_by
created_at
updated_at
```

## document_contents

```text
id
document_id
content
version
created_at
updated_at
```

## document_signers

```text
id
document_id
name
position
signature
signed_at
```

## document_logs

```text
id
document_id
user_id
action
ip_address
created_at
```

---

# 13. Document Versioning

ไม่ควรเขียนทับข้อมูลเดิมทั้งหมด

ตัวอย่าง

```text
หนังสือ #000123

Version 1
สร้างร่าง

Version 2
แก้ไขเรื่อง

Version 3
แก้ไขเนื้อหา

Version 4
ตรวจสอบแล้ว

Version 5
อนุมัติ
```

สามารถย้อนดู Version ก่อนหน้าได้

---

# 14. การค้นหา

รองรับการค้นหา

* เลขหนังสือ
* เรื่อง
* วันที่
* หน่วยงาน
* ผู้สร้าง
* ผู้ลงนาม
* ประเภทหนังสือ
* สถานะ

ตัวอย่าง

```text
ค้นหา:
"จัดซื้อ"

ผลลัพธ์:
หนังสือ 001/2569
หนังสือ 045/2569
หนังสือ 087/2569
```

---

# 15. Attachment

รองรับไฟล์แนบ

```text
PDF
DOCX
XLSX
JPG
PNG
ZIP
```

กำหนด

* Maximum file size
* Allowed MIME type
* Virus scanning
* Access Control

ไม่ควรเปิดไฟล์แนบให้ Public โดยตรง

---

# 16. Security

ระบบเป็นเอกสารราชการ จึงควรออกแบบ Security ตั้งแต่ต้น

## Authentication

* Username / Password
* Session Management
* Password Hashing
* Account Lockout

หากหน่วยงานมีระบบ Identity Provider สามารถต่อยอดเป็น

```text
LDAP
Active Directory
SSO
```

## Authorization

ใช้ RBAC

```text
User
 ↓
Role
 ↓
Permission
```

## Web Security

ป้องกันอย่างน้อย

```text
SQL Injection
XSS
CSRF
IDOR
File Upload Attack
Path Traversal
Session Hijacking
Brute Force
```

---

# 17. Audit Log

ทุกการกระทำสำคัญควรบันทึก

```text
ใคร
ทำอะไร
เอกสารอะไร
เมื่อไหร่
จาก IP อะไร
ผลลัพธ์อะไร
```

ตัวอย่าง

```text
09:15
user01
CREATE
Document #123

09:30
user01
UPDATE
Document #123

10:05
review01
APPROVE
Document #123

10:15
user01
PRINT
Document #123
```

---

# 18. Dashboard

หน้าแรกหลัง Login

แสดง

```text
หนังสือทั้งหมด       128
ร่าง                   23
รอตรวจสอบ              8
อนุมัติแล้ว             92
ยกเลิก                  5
```

พร้อม

* หนังสือล่าสุด
* หนังสือรอตรวจสอบ
* หนังสือที่ต้องดำเนินการ
* ปุ่มสร้างหนังสือใหม่

---

# 19. หน้าจอหลัก

## Login

```text
[ Logo ]

Username
[____________]

Password
[____________]

[ เข้าสู่ระบบ ]
```

## Dashboard

```text
┌──────────────────────────────┐
│ ระบบร่างหนังสือราชการ       │
├──────────────────────────────┤
│ หนังสือทั้งหมด 128           │
│ ร่าง 23                      │
│ รอตรวจ 8                     │
│ อนุมัติ 92                   │
├──────────────────────────────┤
│ [ + สร้างหนังสือ ]           │
└──────────────────────────────┘
```

## Document Editor

แบ่งเป็น 2 Pane

```text
┌──────────────────┬───────────────────┐
│ ข้อมูลหนังสือ    │ Preview           │
│                  │                   │
│ เลขที่           │   ตราครุฑ         │
│ วันที่            │                   │
│ เรื่อง            │   เรื่อง...       │
│ เรียน             │                   │
│                  │   เนื้อหา...      │
│ เนื้อหา           │                   │
│                  │                   │
│ [บันทึก]         │ [พิมพ์] [PDF]     │
└──────────────────┴───────────────────┘
```

---

# 20. Technology Stack

## Frontend

แนะนำ

```text
Next.js
TypeScript
Tailwind CSS
TipTap
```

### เหตุผล

* Modern Web Application
* Component Architecture
* Type Safety
* รองรับ Rich Text Editor
* รองรับ Print Layout
* พัฒนาต่อได้ง่าย

---

# 21. Backend

แนะนำ

```text
NestJS
TypeScript
```

หรือหากต้องการลดความซับซ้อน

```text
Next.js
API Routes
```

สำหรับระบบหน่วยงานขนาดกลางขึ้นไป แนะนำแยก Backend

```text
Frontend
    ↓
REST API
    ↓
NestJS
    ↓
PostgreSQL
```

---

# 22. Infrastructure

แนะนำ

```text
Linux
Docker
Nginx
PostgreSQL
Redis
Object Storage
```

Architecture

```text
Internet / LAN
      ↓
    Nginx
      ↓
Frontend
      ↓
Backend API
      ↓
PostgreSQL
      ↓
Object Storage
```

Redis ใช้สำหรับ

* Session
* Cache
* Queue
* Rate Limit

---

# 23. Deployment

ใช้ Docker Compose ในระยะแรก

```text
docker-compose.yml

services:

  frontend
  backend
  postgres
  redis
  nginx
```

ภายหลังสามารถย้ายไป

```text
VM
Proxmox
VMware
Cloud
Kubernetes
```

ได้

---

# 24. PDF Generation

มี 2 แนวทาง

### วิธีที่ 1 — Browser Print

```text
HTML
 ↓
CSS
 ↓
window.print()
 ↓
Printer / Save PDF
```

ข้อดี

* ตรงกับหน้าจอ Preview
* ไม่ต้องสร้าง PDF Server
* ทำงานง่าย
* พิมพ์ตรงเครื่อง Client

### วิธีที่ 2 — Server PDF

ใช้ Chromium Headless

```text
HTML
 ↓
Chromium
 ↓
PDF
```

ใช้สำหรับ

* Archive
* ส่งต่อ
* ดาวน์โหลด
* เอกสารที่ต้องการ Layout คงที่

**แนะนำให้ใช้ทั้งสองวิธี**

---

# 25. การควบคุม Page Break

ต้องมีระบบตรวจสอบกรณีเนื้อหายาว

```text
หน้า 1
────────────
หัวหนังสือ
เนื้อหา
เนื้อหา
เนื้อหา

หน้า 2
────────────
เนื้อหาต่อ
เนื้อหา
ลงชื่อ
```

ห้ามเกิดกรณี

```text
ชื่อผู้ลงนาม

[ขึ้นหน้าใหม่]

ตำแหน่ง
```

ควรใช้ CSS

```css
.signature {
    break-inside: avoid;
    page-break-inside: avoid;
}
```

---

# 26. การพิมพ์จริง

ระบบต้องทดสอบกับเครื่องพิมพ์จริงหลายรุ่น

ตัวแปรที่ต้องตรวจสอบ

* Printer Driver
* Margins
* Scale
* Paper Size
* Header/Footer ของ Browser
* Print Background
* Font Rendering

ต้องกำหนดคู่มือผู้ใช้ให้ตั้ง

```text
Paper: A4
Scale: 100%
Margins: None
Headers and Footers: Off
```

เพื่อให้ Layout ตรงกับ Template

---

# 27. การทดสอบ

## Functional Test

ทดสอบ

* สร้างหนังสือ
* แก้ไข
* บันทึก
* ลบ
* Preview
* Print
* PDF
* Attachment
* Approval

## Print Test

ทดสอบ

```text
1 หน้า
2 หน้า
3 หน้า
เนื้อหายาว
ตาราง
ลายเซ็น
เอกสารแนบ
```

## Security Test

ทดสอบ

```text
XSS
SQL Injection
CSRF
IDOR
File Upload
Authentication
Authorization
```

---

# 28. MVP

ระยะแรกไม่ควรทำระบบใหญ่เกินไป

### Phase 1

ทำให้ได้ก่อน

```text
Login
↓
Dashboard
↓
สร้างหนังสือ
↓
เลือก Template
↓
กรอกข้อมูล
↓
Rich Text
↓
Preview A4
↓
Print
↓
PDF
```

### Phase 2

เพิ่ม

```text
ผู้ตรวจ
ผู้อนุมัติ
Version
Audit Log
Attachment
Search
```

### Phase 3

เพิ่ม

```text
Digital Signature
LDAP / AD
SSO
เลขหนังสืออัตโนมัติ
ระบบสารบรรณ
API
Notification
Mobile/PWA
```

---

# 29. สิ่งที่ไม่ควรทำ

ไม่ควรออกแบบระบบโดย

```text
Web Form
   ↓
สร้าง DOCX
   ↓
ให้ผู้ใช้เปิด Word
   ↓
จัดหน้าเอง
   ↓
พิมพ์
```

เพราะจะทำให้ระบบกลับไปพึ่งพา Word และเกิดปัญหา Format

แนวทางที่ต้องการคือ

```text
Data
 ↓
Template
 ↓
HTML Print Layout
 ↓
A4
 ↓
Printer
```

---

# 30. ผลลัพธ์ที่ต้องการ

เมื่อผู้ใช้งานสร้างหนังสือเสร็จ จะสามารถกด

```text
[ Preview ]

        ↓

[ พิมพ์ ]

        ↓

เครื่องพิมพ์
```

หรือ

```text
[ PDF ]

        ↓

หนังสือราชการ.pdf
```

โดย Layout ต้องเหมือนกันทั้ง

```text
Preview
   =
PDF
   ≈
กระดาษจริง
```

---

# 31. เกณฑ์ความสำเร็จ

ระบบถือว่าพร้อมใช้งานเมื่อ

* สร้างหนังสือผ่าน Web ได้
* ไม่ต้องใช้ Word ในขั้นตอนปกติ
* Template ถูกต้องตามแบบที่หน่วยงานกำหนด
* Preview ตรงกับ Print
* พิมพ์ A4 ได้จริง
* รองรับเอกสารหลายหน้า
* มีระบบสิทธิ์
* มี Audit Log
* มีระบบสำรองข้อมูล
* สามารถเพิ่ม Template ได้โดยไม่แก้ Core System

---

# 32. แนวทางพัฒนาที่แนะนำ

เริ่มจาก **Print Engine + Template ก่อน** ไม่ควรเริ่มจากระบบ User/Workflow ขนาดใหญ่

ลำดับการพัฒนา:

```text
1. A4 Print Engine
        ↓
2. หนังสือภายนอก Template
        ↓
3. Editor
        ↓
4. Preview
        ↓
5. Print/PDF
        ↓
6. Database
        ↓
7. User/Role
        ↓
8. Workflow
        ↓
9. Audit Log
        ↓
10. Digital Signature / SSO
```

**แกนหลักของระบบคือ Template + Print Engine** เพราะถ้าสองส่วนนี้ทำได้แม่น ระบบส่วนอื่นสามารถต่อเติมภายหลังได้โดยไม่ต้องรื้อระบบใหม่
