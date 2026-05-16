const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'results.json');

// 初始化文件
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]');
}

app.use(express.json());

// 1. 页面路由（修复404）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
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
app.get('/angry.mp4', (req, res) => {
  res.sendFile(path.join(__dirname, 'angry.mp4'));
});

// 2. 用户初始化
app.post('/initUser', (req, res) => {
  try {
    let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    data.push({ ...req.body, type: 'base' });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {}
  res.json({ ok: true });
});

// 3. 提交问卷
app.post('/submit', (req, res) => {
  try {
    let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    data.push(req.body);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {}
  res.json({ status: 'ok' });
});

// 4. 极简后台（不崩溃，只显示原始数据）
app.get('/admin', (req, res) => {
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  res.send(`
  <html>
    <head><meta charset="utf-8"><title>问卷后台</title></head>
    <body>
      <h1>问卷后台（原始数据）</h1>
      <pre>${data}</pre>
    </body>
  </html>
  `);
});

app.listen(PORT, () => {
  console.log("服务已启动");
});
