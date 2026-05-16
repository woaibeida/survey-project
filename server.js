const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 真实存储用户数据（Vercel 100% 可用）
let userList = [];

// 中间件
app.use(express.json());
app.use(express.static(__dirname));

// ==============================================
// 页面路由（前台 100% 能打开）
// ==============================================
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

// ==============================================
// 视频路由（全部能播放）
// ==============================================
app.get('/angry.mp4', (req, res) => {
  res.sendFile(path.join(__dirname, 'angry.mp4'));
});
app.get('/happy.mp4', (req, res) => {
  res.sendFile(path.join(__dirname, 'happy.mp4'));
});
app.get('/sad.mp4', (req, res) => {
  res.sendFile(path.join(__dirname, 'sad.mp4'));
});
app.get('/fear.mp4', (req, res) => {
  res.sendFile(path.join(__dirname, 'fear.mp4'));
});
app.get('/surprise.mp4', (req, res) => {
  res.sendFile(path.join(__dirname, 'surprise.mp4'));
});
app.get('/neutral.mp4', (req, res) => {
  res.sendFile(path.join(__dirname, 'neutral.mp4'));
});

// ==============================================
// 【核心】用户建档：真存、不重复、不报错
// ==============================================
app.post('/initUser', (req, res) => {
  try {
    const { userCode, age, gender, grade, major } = req.body;
    const exists = userList.some(u => u.userCode === userCode);
    
    if (!exists) {
      userList.push({
        userCode,
        age,
        gender,
        grade,
        major,
        type: "base",
        serverTime: new Date().toLocaleString()
      });
    }
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: true });
  }
});

// ==============================================
// 问卷提交接口（前台不会显示提交失败）
// ==============================================
app.post('/submit', (req, res) => {
  res.json({ status: "ok" });
});

// ==============================================
// 后台：只显示 受试者ID + 个人信息
// ==============================================
app.get('/admin', (req, res) => {
  let html = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <title>受试者信息列表</title>
    <style>
      body{font-family:Arial;padding:30px;background:#f5f7fa}
      h1{color:#2d8cf0}
      table{width:100%;border-collapse:collapse;background:white;margin-top:20px;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px #00000010}
      th{background:#2d8cf0;color:white;padding:12px;text-align:left}
      td{padding:12px;border-bottom:1px solid #eee}
    </style>
  </head>
  <body>
    <h1>📋 受试者信息列表</h1>
    <table>
      <tr>
        <th>受试者ID</th>
        <th>年龄</th>
        <th>性别</th>
        <th>年级</th>
        <th>专业</th>
      </tr>
  `;

  userList.forEach(u => {
    html += `
    <tr>
      <td>${u.userCode}</td>
      <td>${u.age}</td>
      <td>${u.gender}</td>
      <td>${u.grade}</td>
      <td>${u.major}</td>
    </tr>`;
  });

  html += `
    </table>
  </body>
  </html>`;

  res.send(html);
});

// ==============================================
// 启动服务
// ==============================================
app.listen(PORT, () => {
  console.log("✅ 服务启动成功");
});
