const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'results.json');

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

app.use(express.json());
app.use(express.static(__dirname));

// ==============================================
// 后台页面：显示每题答案 + 删除整条受试者
// ==============================================
app.get('/admin', (req, res) => {
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const groups = {};

  raw.forEach(item => {
    const code = item.userCode || '未知';
    if (!groups[code]) {
      groups[code] = { MOS: null, Godspeed: null, Mind: null };
    }
    if (item.type?.includes('MOS')) groups[code].MOS = item;
    if (item.type?.includes('Godspeed')) groups[code].Godspeed = item;
    if (item.type?.includes('Mind')) groups[code].Mind = item;
  });

  let html = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>问卷完整数据后台</title>
    <style>
      body{font-family:Arial;padding:20px;background:#f6f8fa}
      .item{background:white;padding:20px;margin:20px 0;border-radius:10px;box-shadow:0 1px 3px #00000015}
      h3{color:#2d8cf0;margin-top:0}
      .answer{background:#f9f9f9;padding:12px;border-radius:6px;font-size:13px;white-space:pre-wrap}
      .none{color:#999}
      .delBtn{background:#ff4444;color:white;padding:8px 14px;border:none;border-radius:6px;cursor:pointer;margin-top:10px}
    </style>
  </head>
  <body>
    <h1>📊 问卷完整答案后台（可删除受试者）</h1>
  `;

  for (let code in groups) {
    const u = groups[code];
    html += `<div class="item">`;
    html += `<h3>受试者编码：${code}</h3>`;

    // MOS
    html += `<p><strong>MOS 情绪问卷：</strong></p>`;
    if (u.MOS) html += `<div class="answer">${JSON.stringify(u.MOS, null, 2)}</div>`;
    else html += `<p class="none">未答</p>`;

    // Godspeed
    html += `<p><strong>Godspeed 问卷：</strong></p>`;
    if (u.Godspeed) html += `<div class="answer">${JSON.stringify(u.Godspeed, null, 2)}</div>`;
    else html += `<p class="none">未答</p>`;

    // Mind
    html += `<p><strong>Mind 心智问卷：</strong></p>`;
    if (u.Mind) html += `<div class="answer">${JSON.stringify(u.Mind, null, 2)}</div>`;
    else html += `<p class="none">未答</p>`;

    // 删除按钮（删除整条受试者）
    html += `<button class="delBtn" onclick="del('${code}')">🗑️ 删除该受试者所有数据</button>`;
    html += `</div><hr>`;
  }

  html += `
  <script>
  function del(code){
    if(!confirm('确定要删除【' + code + '】的所有问卷数据吗？\\n此操作不可恢复！')) return
    location.href='/delete?code='+code
  }
  </script>
  </body></html>`;

  res.send(html);
});

// ==============================================
// 删除接口：删除一个受试者的所有数据
// ==============================================
app.get('/delete', (req, res) => {
  const code = req.query.code;
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const filtered = raw.filter(item => item.userCode !== code);
  fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2));
  res.redirect('/admin');
});

// ==============================================
// 提交答案接口
// ==============================================
app.post('/submit', (req, res) => {
  const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  d.push({ ...req.body, serverTime: new Date().toLocaleString() });
  fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
  res.send({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log("======================================");
  console.log("✅ 启动成功！");
  console.log("📱 问卷：http://localhost:3000/index.html");
  console.log("👤 后台（可删整条）：http://localhost:3000/admin");
  console.log("======================================");
});