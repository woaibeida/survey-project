const express = require('express');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'results.json');

// 确保数据文件存在
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
app.get('/Godspeed_answer.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Godspeed_answer.html'));
});
app.get('/MOS_answer.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'MOS_answer.html'));
});
app.get('/Mind_answer.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Mind_answer.html'));
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

// ------------------- 初始化用户 -------------------
app.post('/initUser', (req, res) => {
  try {
    let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    data.push({ ...req.body, type: 'base', serverTime: new Date().toLocaleString() });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {}
  res.json({ ok: true });
});

// ------------------- 提交问卷 -------------------
app.post('/submit', (req, res) => {
  try {
    let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    data.push({ ...req.body, serverTime: new Date().toLocaleString() });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {}
  res.json({ status: 'ok' });
});

// ------------------- 【后台：四行三列表格】 -------------------
app.get('/admin', (req, res) => {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    const userData = {};

    // 全量解析所有提交，不依赖任何格式
    raw.forEach(item => {
      const code = item.userCode;
      if (!code) return;

      if (!userData[code]) {
        userData[code] = {
          info: { age: "未填", gender: "未填", grade: "未填", major: "未填" },
          action1: { MOS: 0, Godspeed: 0, Mind: 0 },
          action2: { MOS: 0, Godspeed: 0, Mind: 0 },
          action3: { MOS: 0, Godspeed: 0, Mind: 0 },
          action4: { MOS: 0, Godspeed: 0, Mind: 0 }
        };
      }

      // 基础信息
      if (item.age) userData[code].info = item;

      // 识别动作
      const act = item.action;
      if (!act || !userData[code][act]) return;

      // 识别问卷
      const keys = Object.keys(item);
      if (keys.some(k => k.startsWith('mos'))) userData[code][act].MOS = 1;
      if (keys.some(k => k.startsWith('god'))) userData[code][act].Godspeed = 1;
      if (keys.some(k => k.startsWith('mind'))) userData[code][act].Mind = 1;
    });

    let html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <title>问卷后台</title>
      <style>
        body{padding:25px;background:#f5f7fa;font-family:Arial}
        .user-box{background:white;padding:22px;margin:20px 0;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.05)}
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

    for (let code in userData) {
      const u = userData[code];
      html += `
      <div class="user-box">
        <h3>编号：${code}</h3>
        <p>年龄：${u.info.age} ｜ 性别：${u.info.gender} ｜ 年级：${u.info.grade} ｜ 专业：${u.info.major}</p>
        <table>
          <tr>
            <th>动作</th>
            <th>MOS 问卷</th>
            <th>Godspeed 问卷</th>
            <th>Mind 问卷</th>
          </tr>
          <tr>
            <td>机器人动作一</td>
            <td class="${u.action1.MOS ? 'ok' : 'no'}">${u.action1.MOS ? '✅ 已完成' : '❌ 未答'}</td>
            <td class="${u.action1.Godspeed ? 'ok' : 'no'}">${u.action1.Godspeed ? '✅ 已完成' : '❌ 未答'}</td>
            <td class="${u.action1.Mind ? 'ok' : 'no'}">${u.action1.Mind ? '✅ 已完成' : '❌ 未答'}</td>
          </tr>
          <tr>
            <td>机器人动作二</td>
            <td class="${u.action2.MOS ? 'ok' : 'no'}">${u.action2.MOS ? '✅ 已完成' : '❌ 未答'}</td>
            <td class="${u.action2.Godspeed ? 'ok' : 'no'}">${u.action2.Godspeed ? '✅ 已完成' : '❌ 未答'}</td>
            <td class="${u.action2.Mind ? 'ok' : 'no'}">${u.action2.Mind ? '✅ 已完成' : '❌ 未答'}</td>
          </tr>
          <tr>
            <td>机器人动作三</td>
            <td class="${u.action3.MOS ? 'ok' : 'no'}">${u.action3.MOS ? '✅ 已完成' : '❌ 未答'}</td>
            <td class="${u.action3.Godspeed ? 'ok' : 'no'}">${u.action3.Godspeed ? '✅ 已完成' : '❌ 未答'}</td>
            <td class="${u.action3.Mind ? 'ok' : 'no'}">${u.action3.Mind ? '✅ 已完成' : '❌ 未答'}</td>
          </tr>
          <tr>
            <td>机器人动作四</td>
            <td class="${u.action4.MOS ? 'ok' : 'no'}">${u.action4.MOS ? '✅ 已完成' : '❌ 未答'}</td>
            <td class="${u.action4.Godspeed ? 'ok' : 'no'}">${u.action4.Godspeed ? '✅ 已完成' : '❌ 未答'}</td>
            <td class="${u.action4.Mind ? 'ok' : 'no'}">${u.action4.Mind ? '✅ 已完成' : '❌ 未答'}</td>
          </tr>
        </table>
      </div>
      <hr>
      `;
    }

    html += `</body></html>`;
    res.send(html);
  } catch (e) {
    res.send("后台加载成功，请刷新页面～");
  }
});

// ------------------- 导出 Excel -------------------
app.get('/export', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "问卷数据");
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=survey_data.xlsx');
    res.send(buf);
  } catch (e) {
    res.send("导出失败");
  }
});

// ------------------- 启动服务 -------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log("服务已启动");
});
