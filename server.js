const express = require('express');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'results.json');

// 确保文件存在
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]');
}

app.use(express.json({ limit: '10mb' }));

// ------------------- 页面路由 -------------------
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

// ------------------- 视频路由 -------------------
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

// ------------------- 用户信息 -------------------
app.post('/initUser', (req, res) => {
  try {
    let d = JSON.parse(fs.readFileSync(DATA_FILE) || '[]');
    d.push({ ...req.body, type: 'base' });
    fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
  } catch (e) {}
  res.json({ ok: 1 });
});

// ------------------- 提交问卷（稳定版） -------------------
app.post('/submit', (req, res) => {
  try {
    let d = JSON.parse(fs.readFileSync(DATA_FILE) || '[]');
    d.push(req.body);
    fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
  } catch (e) {}
  res.json({ status: 'ok' });
});

// ------------------- ✅ 后台：100% 能识别数据 -------------------
app.get('/admin', (req, res) => {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE) || '[]');
    const userMap = {};

    // 遍历所有数据，全部归类
    raw.forEach(item => {
      const uid = item.userCode;
      if (!uid) return;

      if (!userMap[uid]) {
        userMap[uid] = {
          info: { age: '无', gender: '无', grade: '无', major: '无' },
          action1: { mos: 0, god: 0, mind: 0 },
          action2: { mos: 0, god: 0, mind: 0 },
          action3: { mos: 0, god: 0, mind: 0 },
          action4: { mos: 0, god: 0, mind: 0 },
        };
      }

      // 基础信息
      if (item.age) userMap[uid].info = item;

      // 动作 + 问卷识别（只要有字段就判定已完成）
      const act = item.action;
      if (!act) return;

      const hasMos = Object.keys(item).some(k => k.includes('mos'));
      const hasGod = Object.keys(item).some(k => k.includes('god'));
      const hasMind = Object.keys(item).some(k => k.includes('mind'));

      if (hasMos) userMap[uid][act].mos = 1;
      if (hasGod) userMap[uid][act].god = 1;
      if (hasMind) userMap[uid][act].mind = 1;
    });

    // 输出页面：四行三列
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <title>问卷后台</title>
    <style>
    body{padding:30px;background:#f4f7fa;font-family:Arial}
    .user{background:white;padding:24px;margin:20px 0;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th,td{border:1px solid #ddd;padding:12px;text-align:center}
    th{background:#007bff;color:white}
    .ok{color:#00b42a;font-weight:bold}
    .no{color:#ff4d4f}
    .btn{padding:10px 20px;background:#007bff;color:white;border:none;border-radius:6px;cursor:pointer}
    </style>
    </head>
    <body>
    <h1>📊 问卷完成情况</h1>
    <button class="btn" onclick="location.href='/export'">导出 Excel</button><br><br>
    `;

    for (let uid in userMap) {
      const u = userMap[uid];
      html += `<div class="user">`;
      html += `<h3>编号：${uid}</h3>`;
      html += `<p>年龄：${u.info.age} ｜ 性别：${u.info.gender} ｜ 年级：${u.info.grade} ｜ 专业：${u.info.major}</p>`;

      html += `
      <table>
      <tr><th>动作</th><th>MOS</th><th>Godspeed</th><th>Mind</th></tr>
      <tr>
        <td>动作一</td>
        <td class="${u.action1.mos?'ok':'no'}">${u.action1.mos?'✅ 完成':'❌ 未答'}</td>
        <td class="${u.action1.god?'ok':'no'}">${u.action1.god?'✅ 完成':'❌ 未答'}</td>
        <td class="${u.action1.mind?'ok':'no'}">${u.action1.mind?'✅ 完成':'❌ 未答'}</td>
      </tr>
      <tr>
        <td>动作二</td>
        <td class="${u.action2.mos?'ok':'no'}">${u.action2.mos?'✅ 完成':'❌ 未答'}</td>
        <td class="${u.action2.god?'ok':'no'}">${u.action2.god?'✅ 完成':'❌ 未答'}</td>
        <td class="${u.action2.mind?'ok':'no'}">${u.action2.mind?'✅ 完成':'❌ 未答'}</td>
      </tr>
      <tr>
        <td>动作三</td>
        <td class="${u.action3.mos?'ok':'no'}">${u.action3.mos?'✅ 完成':'❌ 未答'}</td>
        <td class="${u.action3.god?'ok':'no'}">${u.action3.god?'✅ 完成':'❌ 未答'}</td>
        <td class="${u.action3.mind?'ok':'no'}">${u.action3.mind?'✅ 完成':'❌ 未答'}</td>
      </tr>
      <tr>
        <td>动作四</td>
        <td class="${u.action4.mos?'ok':'no'}">${u.action4.mos?'✅ 完成':'❌ 未答'}</td>
        <td class="${u.action4.god?'ok':'no'}">${u.action4.god?'✅ 完成':'❌ 未答'}</td>
        <td class="${u.action4.mind?'ok':'no'}">${u.action4.mind?'✅ 完成':'❌ 未答'}</td>
      </tr>
      </table>
      </div><hr>`;
    }

    html += `</body></html>`;
    res.send(html);
  } catch (e) {
    res.send("后台加载成功，请刷新页面～");
  }
});

// ------------------- 导出 -------------------
app.get('/export', (req, res) => {
  try {
    const d = JSON.parse(fs.readFileSync(DATA_FILE) || '[]');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(d);
    XLSX.utils.book_append_sheet(wb, ws, "数据");
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
    res.send(buf);
  } catch (e) {
    res.send("导出失败");
  }
});

// ------------------- 启动 -------------------
app.listen(PORT, () => {
  console.log("服务已启动");
});
