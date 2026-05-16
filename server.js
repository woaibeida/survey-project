const express = require('express');
const path = require('path');
const https = require('https');
const app = express();
const PORT = process.env.PORT || 3000;

// 从环境变量读取 GitHub 配置
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USER = process.env.GITHUB_USER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const FILE_PATH = 'results.json';

// 全局缓存
let DB = [];
let fileSha = '';

// 从 GitHub 读取文件
async function loadDB() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
      method: 'GET',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'survey-app'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const data = JSON.parse(body);
        fileSha = data.sha;
        DB = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
        resolve();
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// 写入 GitHub 文件
async function saveDB() {
  return new Promise((resolve, reject) => {
    const content = Buffer.from(JSON.stringify(DB, null, 2)).toString('base64');
    const data = JSON.stringify({
      message: 'Update results.json',
      content: content,
      sha: fileSha
    });

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'survey-app',
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const data = JSON.parse(body);
        fileSha = data.content.sha;
        resolve();
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 启动时加载数据
loadDB().catch(console.error);

// 中间件
app.use(express.json());
app.use(express.static(__dirname));

// 页面路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/action1.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'action1.html'));
});
app.get('/angry.mp4', (req, res) => {
  res.sendFile(path.join(__dirname, 'angry.mp4'));
});

// 用户建档
app.post('/initUser', async (req, res) => {
  try {
    const { userCode, age, gender, grade, major } = req.body;
    const exist = DB.some(u => u.userCode === userCode && u.type === "base");
    if (!exist) {
      DB.push({
        userCode, age, gender, grade, major,
        type: "base",
        time: new Date().toLocaleString()
      });
      await saveDB();
    }
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: true });
  }
});

// 提交问卷
app.post('/submit', async (req, res) => {
  try {
    DB.push({
      ...req.body,
      saveTime: new Date().toLocaleString()
    });
    await saveDB();
    res.json({ status: "ok" });
  } catch (e) {
    res.json({ status: "ok" });
  }
});

// 后台页面
app.get('/admin', async (req, res) => {
  try {
    await loadDB(); // 每次刷新后台都从 GitHub 读取最新数据
    const userMap = {};

    DB.forEach(item => {
      if (!item.userCode) return;

      if (!userMap[item.userCode]) {
        userMap[item.userCode] = {
          base: null,
          action1: { mos: null, god: null, mind: null },
          action2: { mos: null, god: null, mind: null },
          action3: { mos: null, god: null, mind: null },
          action4: { mos: null, god: null, mind: null }
        };
      }

      if (item.type === "base") {
        userMap[item.userCode].base = item;
        return;
      }

      const act = item.action;
      if (!act || !userMap[item.userCode][act]) return;

      if (item.mos1) {
        userMap[item.userCode][act].mos = item;
        userMap[item.userCode][act].god = item;
        userMap[item.userCode][act].mind = item;
      }
    });

    let html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <title>问卷结果后台</title>
      <style>
        body{padding:30px;background:#f5f7fa;font-family:Arial}
        .user{background:white;padding:25px;margin:20px 0;border-radius:12px}
        h3{color:#2d8cf0}
        .info{margin-bottom:20px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:12px;text-align:center}
        th{background:#2d8cf0;color:white}
        .yes{color:green;cursor:pointer}
        .no{color:#999}
        .ans{margin-top:10px;padding:12px;background:#f8f9fa;border-radius:8px;text-align:left;white-space:pre-wrap;display:none;font-size:14px}
      </style>
    </head>
    <body>
      <h1>📋 受试者问卷详情（数据已保存到 GitHub）</h1>
    `;

    const actions = ["action1", "action2", "action3", "action4"];
    const titles = ["动作一", "动作二", "动作三", "动作四"];

    for (let code in userMap) {
      const u = userMap[code];
      if (!u.base) continue;

      html += `<div class="user">`;
      html += `<h3>受试者：${code}</h3>`;
      html += `<div class="info">年龄：${u.base.age} &nbsp;&nbsp; 性别：${u.base.gender}<br>年级：${u.base.grade} &nbsp;&nbsp; 专业：${u.base.major}</div>`;

      html += `<table><tr><th>动作</th><th>MOS 问卷</th><th>Godspeed 问卷</th><th>Mind 问卷</th></tr>`;

      for (let i = 0; i < 4; i++) {
        const act = actions[i];
        const d = u[act];
        html += `<tr><td><strong>${titles[i]}</strong></td>`;

        if (d.mos) {
          const ans = JSON.stringify(d.mos, null, 2);
          html += `<td><div class="yes" onclick="t('${code}-${act}-mos')">✅ 已完成</div><div class="ans" id="${code}-${act}-mos">${ans}</div></td>`;
        } else html += `<td class="no">未完成</td>`;

        if (d.god) {
          const ans = JSON.stringify(d.god, null, 2);
          html += `<td><div class="yes" onclick="t('${code}-${act}-god')">✅ 已完成</div><div class="ans" id="${code}-${act}-god">${ans}</div></td>`;
        } else html += `<td class="no">未完成</td>`;

        if (d.mind) {
          const ans = JSON.stringify(d.mind, null, 2);
          html += `<td><div class="yes" onclick="t('${code}-${act}-mind')">✅ 已完成</div><div class="ans" id="${code}-${act}-mind">${ans}</div></td>`;
        } else html += `<td class="no">未完成</td>`;

        html += `</tr>`;
      }
      html += `</table></div><hr>`;
    }

    html += `<script>function t(id){const e=document.getElementById(id);e.style.display=e.style.display=='block'?'none':'block';}</script></body></html>`;
    res.send(html);
  } catch (err) {
    res.send("后台正常运行，暂无数据");
  }
});

app.listen(PORT, () => {
  console.log("✅ 服务已启动 | 数据将保存到 GitHub 的 results.json");
});
