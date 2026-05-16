const express = require('express');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'results.json');

// 初始化文件
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]');
}

app.use(express.json({ limit: '10mb' }));

// ------------------- 修复后的页面路由 -------------------
// 首页：同时支持 / 和 /index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 其他页面
app.get('/action1.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'action1.html'));
});
app.get('/MOS.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'MOS.html'));
});
app.get('/Godspeed.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Godspeed.html'));
});
app.get('/Mind.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Mind.html'));
});

// 视频路由
app.get('/angry.mp4', (req, res) => {
  res.sendFile(path.join(__dirname, 'angry.mp4'));
});

// 用户初始化
app.post('/initUser', (req, res) => {
  try {
    let d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    d.push({ ...req.body, type: 'base' });
    fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
  } catch (e) {}
  res.json({ ok: true });
});

// 提交接口
app.post('/submit', (req, res) => {
  try {
    let d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    d.push(req.body);
    fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
  } catch (e) {}
  res.json({ status: 'ok' });
});

// 后台路由（极简版，不会崩溃）
app.get('/admin', (req, res) => {
  let html = `
  <html>
  <head>
    <meta charset="utf-8">
    <title>问卷后台</title>
    <style>
      body { font-family: Arial; padding: 20px; }
      pre { background: #f5f7fa; padding: 15px; border-radius: 8px; overflow-x: auto; }
    </style>
  </head>
  <body>
    <h1>问卷后台</h1>
    <pre>${fs.readFileSync(DATA_FILE, 'utf8')}</pre>
  </body>
  </html>
  `;
  res.send(html);
});

// 导出Excel
app.get('/export', (req, res) => {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(raw);
    XLSX.utils.book_append_sheet(wb, ws, "数据");
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=survey.xlsx');
    res.send(buf);
  } catch (e) {
    res.send("导出失败");
  }
});

// 启动服务
app.listen(PORT, '0.0.0.0', () => {
  console.log("服务已启动");
});
