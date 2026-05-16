const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 全局数据存储（Vercel 100% 兼容）
let DB = [];

// 基础中间件
app.use(express.json());
app.use(express.static(__dirname));

// ---------------------- 页面路由（确保前台能打开） ----------------------
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

// ---------------------- 视频路由 ----------------------
app.get('/angry.mp4', (req, res) => {
  res.sendFile(path.join(__dirname, 'angry.mp4'));
});

// ---------------------- 用户建档接口 ----------------------
app.post('/initUser', (req, res) => {
  try {
    const { userCode, age, gender, grade, major } = req.body;
    const exist = DB.some(u => u.userCode === userCode && u.type === "base");
    if (!exist) {
      DB.push({
        userCode, age, gender, grade, major,
        type: "base",
        serverTime: new Date().toLocaleString()
      });
    }
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: true });
  }
});

// ---------------------- 问卷提交接口 ----------------------
app.post('/submit', (req, res) => {
  try {
    DB.push({
      ...req.body,
      serverTime: new Date().toLocaleString()
    });
    res.json({ status: "ok" });
  } catch (e) {
    res.json({ status: "ok" });
  }
});

// ---------------------- 后台：按你要求的个人信息 + 四行三列 + 题目详情 ----------------------
app.get('/admin', (req, res) => {
  try {
    const userMap = {};

    // 分组数据
    DB.forEach(item => {
      if (!item.userCode) return;
      if (!userMap[item.userCode]) {
        userMap[item.userCode] = {
          base: null,
          action1: { MOS: null, Godspeed: null, Mind: null },
          action2: { MOS: null, Godspeed: null, Mind: null },
          action3: { MOS: null, Godspeed: null, Mind: null },
          action4: { MOS: null, Godspeed: null, Mind: null }
        };
      }

      if (item.type === "base") {
        userMap[item.userCode].base = item;
        return;
      }

      const act = item.action;
      if (!act) return;

      if (item.type?.includes("MOS")) userMap[item.userCode][act].MOS = item;
      if (item.type?.includes("Godspeed")) userMap[item.userCode][act].Godspeed = item;
      if (item.type?.includes("Mind")) userMap[item.userCode][act].Mind = item;
    });

    // 生成HTML
    let html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <title>受试者问卷详情</title>
      <style>
        body{padding:30px; background:#f5f7fa; font-family:Arial}
        .user{background:white; padding:25px; margin:25px 0; border-radius:12px}
        .info{margin-bottom:20px; line-height:1.6}
        h3{color:#2d8cf0}
        table{width:100%; border-collapse:collapse; background:#fff}
        th,td{border:1px solid #ddd; padding:12px; text-align:center}
        th{background:#2d8cf0; color:white}
        .done{color:green; cursor:pointer}
        .none{color:#999}
        .answer{margin-top:8px; padding:10px; background:#f8f9fa; border-radius:6px; text-align:left; font-size:14px; display:none; white-space:pre-wrap}
      </style>
    </head>
    <body>
      <h1>📋 受试者问卷详情后台</h1>
    `;

    const actionTitles = ["动作一", "动作二", "动作三", "动作四"];
    const actions = ["action1", "action2", "action3", "action4"];

    for (let code in userMap) {
      const u = userMap[code];
      if (!u.base) continue;

      html += `<div class="user">`;
      html += `<h3>受试者编号：${code}</h3>`;
      html += `<div class="info">年龄：${u.base.age} &nbsp;&nbsp; 性别：${u.base.gender}<br>年级：${u.base.grade} &nbsp;&nbsp; 专业：${u.base.major}</div>`;

      html += `<table><tr><th>动作</th><th>MOS 问卷</th><th>Godspeed 问卷</th><th>Mind 问卷</th></tr>`;

      for (let i = 0; i < 4; i++) {
        const act = actions[i];
        html += `<tr><td><strong>${actionTitles[i]}</strong></td>`;

        // MOS
        if (u[act].MOS) {
          const ans = JSON.stringify(u[act].MOS, null, 2);
          html += `<td><div class="done" onclick="toggle('${code}-${act}-mos')">✅ 已答（点击查看）</div><div class="answer" id="${code}-${act}-mos">${ans}</div></td>`;
        } else {
          html += `<td class="none">未作答</td>`;
        }

        // Godspeed
        if (u[act].Godspeed) {
          const ans = JSON.stringify(u[act].Godspeed, null, 2);
          html += `<td><div class="done" onclick="toggle('${code}-${act}-god')">✅ 已答（点击查看）</div><div class="answer" id="${code}-${act}-god">${ans}</div></td>`;
        } else {
          html += `<td class="none">未作答</td>`;
        }

        // Mind
        if (u[act].Mind) {
          const ans = JSON.stringify(u[act].Mind, null, 2);
          html += `<td><div class="done" onclick="toggle('${code}-${act}-mind')">✅ 已答（点击查看）</div><div class="answer" id="${code}-${act}-mind">${ans}</div></td>`;
        } else {
          html += `<td class="none">未作答</td>`;
        }

        html += `</tr>`;
      }

      html += `</table></div><hr>`;
    }

    html += `
    <script>
      function toggle(id){
        const el = document.getElementById(id);
        el.style.display = el.style.display === 'block' ? 'none' : 'block';
      }
    </script>
    </body></html>`;

    res.send(html);
  } catch (err) {
    console.error(err);
    res.send("后台加载出错，请稍后再试");
  }
});

// 启动服务
app.listen(PORT, () => {
  console.log("✅ 服务启动成功");
});
