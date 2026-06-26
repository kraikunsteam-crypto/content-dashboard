# Content Dashboard

Dashboard นี้เป็นหน้า UI สำหรับดูผลวิเคราะห์คอนเทนต์ Facebook competitor scan
โดยยึดหลัก:

```text
Frontend -> API / Worker -> Google Sheets database
```

Frontend ไม่อ่าน Google Sheets โดยตรง

## Run In VS Code

เปิด terminal ที่โฟลเดอร์นี้ แล้วรัน:

```powershell
.\run-dashboard.ps1
```

The runner uses Node.js when available. If Node.js is not installed and the
Codex bundled Node.js path is unavailable, it starts a local PowerShell fallback
server with the same preview URL and API routes.

จากนั้นเปิด:

```text
http://localhost:5177
```

ถ้าไม่ได้เปิด server หน้า `index.html` ยังแสดงข้อมูลตัวอย่างจาก
`data/sample-facebook-scan.json` ได้ แต่โหมดที่ถูกต้องสำหรับโปรเจกต์คือรันผ่าน
API server

## API Routes

- `GET /api/health` - เช็กว่า server ทำงาน
- `GET /api/dashboard` - ส่ง JSON สำหรับหน้า dashboard
- `POST /api/sync` - จุดต่อยอดสำหรับ sync Google Sheets จริง

ถ้ามี Node.js อยู่ใน PATH แล้ว จะรันตรงก็ได้:

```powershell
node .\server.mjs
```

ถ้าเครื่องไม่มี Node.js ให้ติดตั้ง Node.js LTS หรือใช้ Codex bundled runtime
ของเครื่องนั้น

ตอนนี้ `/api/dashboard` จะอ่านข้อมูลล่าสุดจาก:

```text
../outputs/facebook-content-scan/cleaned_posts.json
```

ถ้าไฟล์นั้นไม่มี จะ fallback ไปที่:

```text
data/sample-facebook-scan.json
```

## Google Sheets Database Rule

เมื่อเชื่อม Google Sheets จริง ให้ใช้ flow นี้:

1. API/worker อ่าน source rows จาก tab เช่น `11A_Channel_Link_Library`
2. แต่ละ row ต้องมี stable key เช่น `Link ID`, `Channel ID`, `Post URL`
3. API/worker ไปดึงข้อมูลจาก Facebook/Meta หรือ browser-assisted scan
4. เขียนผลกลับ Google Sheets ด้วย upsert
5. Dashboard เรียกเฉพาะ API เช่น `/api/dashboard`

ห้ามใส่ Sheet credentials, Apps Script private URL, หรือ service account key ใน
frontend code

## Suggested Tabs

- `11A_Channel_Link_Library` - source/channel rows
- `Posts` - fact table ของโพสต์
- `Channel Summary` - summary รายแบรนด์
- `Method Notes` - audit/data quality notes

## UI Sections

Current status: advanced content analysis dashboard prototype. It is intended
to help the user decide what content to make next, not only view raw post data.

- ภาพรวม KPI
- จุดที่ควรสนใจวันนี้
- Top 5 คอนเทนต์มาแรง เรียงจาก reactions + comments + shares
- เพจคู่แข่งที่ active
- Hook / มุมเปิดโพสต์ พร้อมปุ่มเปิดโพสต์ต้นทาง
- ไอเดียคอนเทนต์ถัดไป
- ตารางโพสต์ล่าสุด พร้อมปุ่มเปิดโพสต์ต้นทาง
- Database contract

Production caveat: ต่อ Google Sheets จริงและ Meta API/approved export ใน
backend ก่อนใช้เป็น official reporting dashboard
