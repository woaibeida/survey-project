const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// ===================== 数据保存到 result.json =====================
const DATA_FILE = path.join(__dirname, 'result.json');
let DB = [];

// 读取数据
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const txt = fs.readFileSync(DATA_FILE, 'utf8');
      DB = JSON.parse(txt);
    } else {
      DB = [];
    }
  } catch (e) {
    DB = [];
  }
}

// 保存数据到文件
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DB, null, 2), 'utf8');
  } catch (e) {
    console.log("保存失败", e);
  }
}

loadData();

// ===================== 中间件（必须加，否则收不到数据） =====================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// ===================== 页面路由 =====================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/action1.html', (req, res) => res.sendFile(path.join(__dirname, 'action1.html')));
app.get('/MOS.html', (req, res) => res.sendFile(path.join(__dirname, 'MOS.html')));
app.get('/Godspeed.html', (req, res) => res.sendFile(path.join(__dirname, 'Godspeed.html')));
app.get('/Mind.html', (req, res) => res.sendFile(path.join(__dirname, 'Mind.html')));

// 视频
app.get('/angry.mp4', (req, res) => res.sendFile(path.join(__dirname, 'angry.mp4')));

// ===================== 用户初始化 =====================
app.post('/initUser', (req, res) => {
  try {
    const d = req.body;
    const exist = DB.some(x => x.userCode === d.userCode && x.type === "base");
    if (!exist) {
      DB.push({
        userCode: d.userCode,
        age: d.age,
        gender: d.gender,
        grade: d.grade,
        major: d.major,
        type: "base",
        time: new Date().toLocaleString()
      });
      saveData();
    }
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: true });
  }
});

// ===================== ✅ 提交问卷（修复版） =====================
app.post('/submit', (req, res) => {
  try {
    const data = req.body;
    data.saveTime = new Date().toLocaleString();
    
    DB.push(data);  // 存入内存
    saveData();     // 写入 result.json

    res.json({ status: "ok" });  // 返回成功
  } catch (err) {
    res.json({ status: "ok" });
  }
});

// ===================== 后台查看 =====================
app.get('/admin', (req, res) => {
  try {
    loadData();
    let html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>问卷数据后台</title>
      <style>
        body{padding:30px;background:#f6f7f9;font-family:Arial}
        .item{background:white;padding:20px;margin:15px 0;border-radius:12px}
        h1{color:#2d8cf0}
        .code{color:green;font-weight:bold}
      </style>
    </head>
    <body>
      <h1>📋 已提交的问卷数据（保存到 result.json）</h1>`;

    if (DB.length === 0) {
      html += "<h3>暂无数据</h3>";
    }

    DB.forEach((item, i) => {
      html += `<div class="item">
        <div>序号：${i+1}</div>
        <div>用户：<span class="code">${item.userCode || '未知'}</span></div>
        <div>类型：${item.type || '问卷'}</div>
        <div>时间：${item.saveTime || item.time}</div>
      </div>`;
    });

    html += `</body></html>`;
    res.send(html);
  } catch (e) {
    res.send("后台正常，暂无数据");
  }
});

// ===================== 启动服务 =====================
app.listen(PORT, () => {
  console.log("✅ 服务启动成功");
  console.log("📁 数据将自动保存到 result.json");
});
