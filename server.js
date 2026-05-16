const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// ===================== 数据持久化：从 result.json 读取 =====================
const DATA_PATH = path.join(__dirname, 'result.json');
let DB = [];

// 读取数据
function loadDB() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const content = fs.readFileSync(DATA_PATH, 'utf8');
      DB = JSON.parse(content);
    } else {
      DB = [];
    }
  } catch (e) {
    DB = [];
  }
}

// 保存数据
function saveDB() {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(DB, null, 2), 'utf8');
  } catch (e) {}
}

loadDB(); // 启动时加载

// ===================== 中间件 =====================
app.use(express.json());
app.use(express.static(__dirname));

// ===================== 页面路由 =====================
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

// ===================== 视频 =====================
app.get('/angry.mp4', (req, res) => {
  res.sendFile(path.join(__dirname, 'angry.mp4'));
});

// ===================== 用户信息提交 =====================
app.post('/initUser', (req, res) => {
  try {
    const { userCode, age, gender, grade, major } = req.body;
    const exist = DB.some(u => u.userCode === userCode && u.type === "base");
    if (!exist) {
      const user = {
        userCode, age, gender, grade, major,
        type: "base",
        time: new Date().toLocaleString()
      };
      DB.push(user);
      saveDB();
    }
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: true });
  }
});

// ===================== 问卷提交（自动保存到 result.json） =====================
app.post('/submit', (req, res) => {
  try {
    const data = {
      ...req.body,
      saveTime: new Date().toLocaleString()
    };
    DB.push(data);
    saveDB();
    res.json({ status: "ok" });
  } catch (e) {
    res.json({ status: "ok" });
  }
});

// ===================== 后台显示（从 result.json 读取） =====================
app.get('/admin', (req, res) => {
  try {
    loadDB(); // 每次打开后台都重新读取文件，确保最新
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
        .ans{
          margin-top:10px;padding:12px;background:#f8f9fa;
          border-radius:8px;text-align:left;white-space:pre-wrap;
          display:none;font-size:14px
        }
      </style>
    </head>
    <body>
      <h1>📋 受试者问卷详情（数据已保存到 result.json）</h1>
    `;

    const actions = ["action1","action2","action3","action4"];
    const titles = ["动作一","动作二","动作三","动作四"];

    for (let code in userMap) {
      const u = userMap[code];
      if (!u.base) continue;

      html += `<div class="user">`;
      html += `<h3>受试者：${code}</h3>`;
      html += `<div class="info">
        年龄：${u.base.age} &nbsp;&nbsp; 性别：${u.base.gender}<br>
        年级：${u.base.grade} &nbsp;&nbsp; 专业：${u.base.major}
      </div>`;

      html += `<table>
        <tr><th>动作</th><th>MOS 问卷</th><th>Godspeed 问卷</th><th>Mind 问卷</th></tr>`;

      for (let i=0;i<4;i++) {
        const act = actions[i];
        const d = u[act];
        html += `<tr><td><strong>${titles[i]}</strong></td>`;

        // MOS
        if (d.mos) {
          const ans = JSON.stringify(d.mos, null, 2);
          html += `
          <td>
            <div class="yes" onclick="t('${code}-${act}-mos')">✅ 已完成</div>
            <div class="ans" id="${code}-${act}-mos">${ans}</div>
          </td>`;
        } else html += `<td class="no">未完成</td>`;

        // Godspeed
        if (d.god) {
          const ans = JSON.stringify(d.god, null, 2);
          html += `
          <td>
            <div class="yes" onclick="t('${code}-${act}-god')">✅ 已完成</div>
            <div class="ans" id="${code}-${act}-god">${ans}</div>
          </td>`;
        } else html += `<td class="no">未完成</td>`;

        // Mind
        if (d.mind) {
          const ans = JSON.stringify(d.mind, null, 2);
          html += `
          <td>
            <div class="yes" onclick="t('${code}-${act}-mind')">✅ 已完成</div>
            <div class="ans" id="${code}-${act}-mind">${ans}</div>
          </td>`;
        } else html += `<td class="no">未完成</td>`;

        html += `</tr>`;
      }
      html += `</table></div><hr>`;
    }

    html += `
    <script>
      function t(id){
        const e=document.getElementById(id);
        e.style.display=e.style.display=='block'?'none':'block';
      }
    </script>
    </body></html>`;

    res.send(html);
  } catch (err) {
    res.send("后台正常运行，暂无数据");
  }
});

// ===================== 启动服务 =====================
app.listen(PORT, () => {
  console.log("✅ 服务已启动 | 数据保存到 result.json");
});
