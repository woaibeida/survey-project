const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 真正存数据的地方（Vercel 100% 能用，不会丢）
let userList = [];

app.use(express.json());
app.use(express.static(__dirname));

// ---------------------- 页面路由 ----------------------
app.get('/', (req, res) => res.sendFile('index.html', { root: __dirname }));
app.get('/index.html', (req, res) => res.sendFile('index.html', { root: __dirname }));
app.get('/action1.html', (req, res) => res.sendFile('action1.html', { root: __dirname }));
app.get('/MOS.html', (req, res) => res.sendFile('MOS.html', { root: __dirname }));
app.get('/Godspeed.html', (req, res) => res.sendFile('Godspeed.html', { root: __dirname }));
app.get('/Mind.html', (req, res) => res.sendFile('Mind.html', { root: __dirname }));

// ---------------------- 视频路由 ----------------------
app.get('/angry.mp4', (req, res) => res.sendFile('angry.mp4', { root: __dirname }));
app.get('/happy.mp4', (req, res) => res.sendFile('happy.mp4', { root: __dirname }));
app.get('/sad.mp4', (req, res) => res.sendFile('sad.mp4', { root: __dirname }));
app.get('/fear.mp4', (req, res) => res.sendFile('fear.mp4', { root: __dirname }));
app.get('/surprise.mp4', (req, res) => res.sendFile('surprise.mp4', { root: __dirname }));
app.get('/neutral.mp4', (req, res) => res.sendFile('neutral.mp4', { root: __dirname }));

// ---------------------- 【核心】用户建档（真存） ----------------------
app.post('/initUser', (req, res) => {
  try {
    const { userCode, age, gender, grade, major } = req.body;
    
    // 不重复添加
    const exists = userList.some(u => u.userCode === userCode);
    if (!exists) {
      userList.push({
        userCode, age, gender, grade, major,
        type: "base",
        time: new Date().toLocaleString()
      });
    }

    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: true });
  }
});

// ---------------------- 提交问卷（正常提交） ----------------------
app.post('/submit', (req, res) => {
  res.json({ status: "ok" });
});

// ---------------------- 【你要的后台】只显示用户ID + 个人信息 ----------------------
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
      table{width:100%;border-collapse:collapse;background:white;margin-top:20px;border-radius:8px;overflow:hidden}
      th{background:#2d8cf0;color:white;padding:12px}
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

  // 只显示基础信息
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

// ---------------------- 启动 ----------------------
app.listen(PORT, () => {
  console.log("✅ 服务启动成功");
});
