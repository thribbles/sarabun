import { Controller, Get, Header } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  @Header("Content-Type", "text/html; charset=utf-8")
  getRoot() {
    return `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>Sarabun API Server</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #0f172a;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            background: #1e293b;
            padding: 32px 40px;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            max-width: 540px;
            width: 100%;
            border: 1px solid #334155;
          }
          .header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
          }
          .badge {
            background: #065f46;
            color: #34d399;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
          }
          h1 { margin: 0; font-size: 24px; color: #38bdf8; }
          p { color: #94a3b8; line-height: 1.6; margin: 8px 0; }
          .routes {
            margin-top: 20px;
            background: #0f172a;
            border-radius: 8px;
            padding: 14px;
          }
          .route-item {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid #1e293b;
            font-size: 14px;
          }
          .route-item:last-child { border-bottom: none; }
          .route-item a { color: #38bdf8; text-decoration: none; }
          .route-item a:hover { text-decoration: underline; }
          .method { color: #10b981; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>🚀 Sarabun API Backend</h1>
            <span class="badge">● Online</span>
          </div>
          <p>ระบบ Backend API จัดการหนังสือราชการอิเล็กทรอนิกส์ (NestJS 10 + SQLite)</p>
          <p>ฐานข้อมูล: <strong>SQLite (dev.db)</strong> พร้อมใช้งาน</p>
          <div class="routes">
            <div style="font-weight: 600; margin-bottom: 8px; color: #cbd5e1;">Available Endpoints:</div>
            <div class="route-item">
              <span><span class="method">GET</span> <a href="/documents">/documents</a></span>
              <span style="color: #64748b;">รายการหนังสือราชการ</span>
            </div>
            <div class="route-item">
              <span><span class="method">POST</span> /documents</span>
              <span style="color: #64748b;">สร้างหนังสือใหม่</span>
            </div>
          </div>
          <p style="margin-top: 24px; font-size: 13px; color: #64748b; text-align: center;">
            เปิด Web Frontend ได้ที่: <a href="http://localhost:3000" style="color: #38bdf8;">http://localhost:3000</a>
          </p>
        </div>
      </body>
      </html>
    `;
  }
}
