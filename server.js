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

// 页面路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/action1.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'action1.html'));
});
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

// 【终极极简后台：只显示原始数据 + 表格】
app.get('/admin', (req, res) => {
  let html = `
  <html>
  <head>
    <meta charset="utf-8">
    <title>问卷后台</title>
    <style>
      body { font-family: Arial; padding: 20px; }
      pre { background: #f5f7fa; padding: 15px; border-radius: 8px; overflow-x: auto; }
      .btn { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
    </style>
  </head>
  <body>
    <h1>📊 问卷后台（原始数据）</h1>
    <button class="btn" onclick="location.href='/export'">导出 Excel</button><br><br>
  `;

  // 先直接读取文件内容，不做任何解析
  const rawText = fs.readFileSync(DATA_FILE, 'utf8');
  html += `<h3>原始数据（未解析）：</h3>`;
  html += `<pre>${rawText}</pre>`;

  // 尝试解析数据并生成表格
  try {
    const raw = JSON.parse(rawText || '[]');
    html += `<h3>✅ 解析成功，共 ${raw.length} 条记录</h3>`;

    const users = {};
    raw.forEach(item => {
      if (!item.userCode) return;
      if (!users[item.userCode]) {
        users[item.userCode] = {
          action1: { MOS: false, Godspeed: false, Mind: false },
          action2: { MOS: false, Godspeed: false, Mind: false },
          action3: { MOS: false, Godspeed: false, Mind: false },
          action4: { MOS: false, Godspeed: false, Mind: false }
        };
      }
      if (item.action) {
        const ac = item.action;
        if (Object.keys(item).some(k => k.startsWith('mos'))) users[item.userCode][ac].MOS = true;
        if (Object.keys(item).some(k => k.startsWith('god'))) users[item.userCode][ac].Godspeed = true;
        if (Object.keys(item).some(k => k.startsWith('mind'))) users[item.userCode][ac].Mind = true;
      }
    });

    // 生成四行三列表格
    for (let uid in users) {
      html += `<h3>用户编号：${uid}</h3>`;
      html += `
      <table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse">
        <tr>
          <th>动作</th>
          <th>MOS</th>
          <th>Godspeed</th>
          <th>Mind</th>
        </tr>
        <tr>
          <td>动作一</td>
          <td>${users[uid].action1.MOS ? '✅ 已完成' : '❌ 未答'}</td>
          <td>${users[uid].action1.Godspeed ? '✅ 已完成' : '❌ 未答'}</td>
          <td>${users[uid].action1.Mind ? '✅ 已完成' : '❌ 未答'}</td>
        </tr>
        <tr>
          <td>动作二</td>
          <td>${users[uid].action2.MOS ? '✅ 已完成' : '❌ 未答'}</td>
          <td>${users[uid].action2.Godspeed ? '✅ 已完成' : '❌ 未答'}</td>
          <td>${users[uid].action2.Mind ? '✅ 已完成' : '❌ 未答'}</td>
        </tr>
        <tr>
          <td>动作三</td>
          <td>${users[uid].action3.MOS ? '✅ 已完成' : '❌ 未答'}</td>
          <td>${users[uid].action3.Godspeed ? '✅ 已完成' : '❌ 未答'}</td>
          <td>${users[uid].action3.Mind ? '✅ 已完成' : '❌ 未答'}</td>
        </tr>
        <tr>
          <td>动作四</td>
          <td>${users[uid].action4.MOS ? '✅ 已完成' : '❌ 未答'}</td>
          <td>${users[uid].action4.Godspeed ? '✅ 已完成' : '❌ 未答'}</td>
          <td>${users[uid].action4.Mind ? '✅ 已完成' : '❌ 未答'}</td>
        </tr>
      </table>
      <br>
      `;
    }
  } catch (e) {
    html += `<h3>❌ 解析数据失败：${e.message}</h3>`;
  }

  html += `</body></html>`;
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
