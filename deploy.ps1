#!/usr/bin/env pwsh
# deploy.ps1 - สคริปต์ deploy ระบบสารบรรณ (sarabun-system)
# ใช้: .\deploy.ps1 [web|api|all]
# ตัวอย่าง: .\deploy.ps1 web    → build + deploy แค่ web frontend
#           .\deploy.ps1 all    → build + deploy ทั้งระบบ

param(
    [ValidateSet("web", "api", "all")]
    [string]$Target = "all"
)

# root docker-compose.yml คือตัวจริงที่ใช้งาน (context ชี้ไป ./sarabun-system)
$ComposeFile = "$PSScriptRoot\docker-compose.yml"

Write-Host "🚀 เริ่ม deploy: $Target" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

function Deploy-Service($service) {
    Write-Host "`n📦 Building: $service (no-cache) ..." -ForegroundColor Yellow
    docker compose -f $ComposeFile build --no-cache $service
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build ล้มเหลว: $service" -ForegroundColor Red
        exit 1
    }

    Write-Host "🔄 Deploying: $service (force recreate) ..." -ForegroundColor Yellow
    # --force-recreate: บังคับสร้าง container ใหม่แม้ config ไม่เปลี่ยน → โหลด image ใหม่เสมอ
    docker compose -f $ComposeFile up -d --force-recreate --no-build $service
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Deploy ล้มเหลว: $service" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ $service deploy สำเร็จ" -ForegroundColor Green
}

switch ($Target) {
    "web" { Deploy-Service "web" }
    "api" { Deploy-Service "api" }
    "all" {
        Deploy-Service "web"
        Deploy-Service "api"
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "🎉 Deploy เสร็จสมบูรณ์!" -ForegroundColor Green
Write-Host "🌐 เว็บไซต์: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔌 API:     http://localhost:3001" -ForegroundColor Cyan
Write-Host "`n💡 ถ้าเว็บยังแสดงผลเก่า กด Ctrl+Shift+R เพื่อ Hard Refresh`n" -ForegroundColor Yellow

docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"
