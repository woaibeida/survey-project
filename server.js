const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 全局内存数据库 真实存数据
let DB = [];

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
app.get('/MOS.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'MOS.html'));
});
app.get('/Godspeed.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Godspeed.html'));
});
app.get('/Mind.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Mind.html'));
});

// 视频路由
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

// 受试者建档接口 真实存入内存
app.post('/initUser', (req, res) => {
  const { userCode, age, gender, grade, major } = req.body;
  const exist = DB.some(item => item.userCode === userCode && item.type === "base");
  if(!exist){
    DB.push({
      userCode,
      age,
      gender,
      grade,
      major,
      type:"base",
      serverTime: new Date(Date.now() + 8*3600000).toLocaleString()
    });
  }
  res.send({ok:true});
});

// 问卷提交接口 真正存入数据 不再报错
app.post('/submit', (req, res) => {
  const cnTime = new Date(Date.now() + 8*3600000).toLocaleString();
  DB.push({ ...req.body, serverTime: cnTime });
  res.send({ status: 'ok' });
});

// 后台管理页 完全保留你原版所有样式、展开详情、表格布局
app.get('/admin', (req, res) => {
  const raw = DB;
  const groups = {};

  const actionName = {
    action1: "机器人动作一",
    action2: "机器人动作二",
    action3: "机器人动作三",
    action4: "机器人动作四"
  };

  raw.forEach(item => {
    const code = item.userCode || '未知';
    if (!groups[code]) {
      groups[code] = {
        base: { age: '', gender: '', grade: '', major: '' },
        actions: {
          action1: { MOS: null, Godspeed: null, Mind: null },
          action2: { MOS: null, Godspeed: null, Mind: null },
          action3: { MOS: null, Godspeed: null, Mind: null },
          action4: { MOS: null, Godspeed: null, Mind: null }
        }
      };
    }

    if(item.type === "base"){
      groups[code].base.age = item.age;
      groups[code].base.gender = item.gender;
      groups[code].base.grade = item.grade;
      groups[code].base.major = item.major;
    }

    const action = item.action;
    if(action && actionName[action]){
      if(item.type?.includes("三合一")){
        const mosData = {}, godData = {}, mindData = {};
        for(let key in item){
          if(key.startsWith("mos")) mosData[key] = item[key];
          if(key.startsWith("god")) godData[key] = item[key];
          if(key.startsWith("mind")) mindData[key] = item[key];
        }
        groups[code].actions[action].MOS = { ...item, ...mosData, type: "MOS问卷" };
        groups[code].actions[action].Godspeed = { ...item, ...godData, type: "Godspeed问卷" };
        groups[code].actions[action].Mind = { ...item, ...mindData, type: "Mind问卷" };
      }
      else if (item.type?.includes('MOS')) groups[code].actions[action].MOS = item;
      else if (item.type?.includes('Godspeed')) groups[code].actions[action].Godspeed = item;
      else if (item.type?.includes('Mind')) groups[code].actions[action].Mind = item;
    }
  });

  let html = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>问卷完整数据后台</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif}
      body{padding:20px;background:#f6f8fa}
      .user-card{background:white;padding:20px;margin:20px 0;border-radius:10px;box-shadow:0 1px 3px #00000015}
      h3{color:#2d8cf0;margin-bottom:15px}
      .user-info{background:#e8f4ff;padding:12px;border-radius:8px;margin-bottom:15px;line-height:1.6}
      .survey-table{width:100%;border-collapse:collapse;margin-bottom:15px}
      .survey-table th,.survey-table td{border:1px solid #ddd;padding:10px;text-align:center;vertical-align:top}
      .survey-table th{background:#2d8cf0;color:white;font-weight:600}
      .survey-table tr:nth-child(even){background:#f9f9f9}
      .cell-toggle{cursor:pointer}
      .cell-done{color:#00b42a;font-weight:500}
      .cell-none{color:#999}
      .detail-content{display:none;background:#f0f7ff;padding:12px;border-radius:6px;margin-top:8px;text-align:left;white-space:pre-wrap;font-size:13px}
      .detail-content.show{display:block}
      .delBtn{background:#ff4444;color:white;padding:8px 14px;border:none;border-radius:6px;cursor:pointer}
    </style>
  </head>
  <body>
    <h1>📊 问卷完整数据后台</h1>
  `;

  for (let code in groups) {
    const u = groups[code];
    const base = u.base;
    const actions = u.actions;

    html += `<div class="user-card">`;
    html += `<h3>受试者编码：${code}</h3>`;
    
    html += `<div class="user-info">`;
    html += `年龄：${base.age} &nbsp;&nbsp; 性别：${base.gender}<br>`;
    html += `年级：${base.grade}<br>专业：${base.major}`;
    html += `</div>`;

    html += `<table class="survey-table">`;
    html += `<thead><tr>`;
    html += `<th style="width:20%">动作名称</th>`;
    html += `<th style="width:26.66%">MOS问卷</th>`;
    html += `<th style="width:26.66%">Godspeed问卷</th>`;
    html += `<th style="width:26.66%">Mind问卷</th>`;
    html += `</tr></thead>`;
    html += `<tbody>`;

    for(let actionKey in actionName){
      const actionLabel = actionName[actionKey];
      const surveyData = actions[actionKey];
      html += `<tr>`;
      html += `<td><strong>${actionLabel}</strong></td>`;

      if(surveyData.MOS){
        const mosStr = JSON.stringify(surveyData.MOS, null, 2);
        html += `<td class="cell-toggle" onclick="toggleDetail('${code}-${actionKey}-mos')">`;
        html += `<span class="cell-done">✅ 已完成（点击展开/收起答案）</span>`;
        html += `<div class="detail-content" id="${code}-${actionKey}-mos">${mosStr}</div>`;
        html += `</td>`;
      }else{
        html += `<td class="cell-none">未答</td>`;
      }

      if(surveyData.Godspeed){
        const godStr = JSON.stringify(surveyData.Godspeed, null, 2);
        html += `<td class="cell-toggle" onclick="toggleDetail('${code}-${actionKey}-god')">`;
        html += `<span class="cell-done">✅ 已完成（点击展开/收起答案）</span>`;
        html += `<div class="detail-content" id="${code}-${actionKey}-god">${godStr}</div>`;
        html += `</td>`;
      }else{
        html += `<td class="cell-none">未答</td>`;
      }

      if(surveyData.Mind){
        const mindStr = JSON.stringify(surveyData.Mind, null, 2);
        html += `<td class="cell-toggle" onclick="toggleDetail('${code}-${actionKey}-mind')">`;
        html += `<span class="cell-done">✅ 已完成（点击展开/收起答案）</span>`;
        html += `<div class="detail-content" id="${code}-${actionKey}-mind">${mindStr}</div>`;
        html += `</td>`;
      }else{
        html += `<td class="cell-none">未答</td>`;
      }

      html += `</tr>`;
    }

    html += `</tbody></table>`;
    html += `<button class="delBtn" onclick="del('${code}')">🗑️ 删除该受试者所有数据</button>`;
    html += `</div><hr>`;
  }

  html += `
  <script>
    function toggleDetail(id){
      const el = document.getElementById(id);
      el.classList.toggle('show');
    }
    function del(code){
      if(!confirm('确定要删除【'+code+'】的所有问卷数据吗？\\n此操作不可恢复！')) return
      location.href='/delete?code='+code
    }
  </script>
  </body></html>`;

  res.send(html);
});

// 删除接口 内存删除
app.get('/delete', (req, res) => {
  const code = req.query.code;
  DB = DB.filter(item => item.userCode !== code);
  res.redirect('/admin');
});

app.listen(PORT, () => {
  console.log("======================================");
  console.log("✅ 启动成功！");
  console.log("📱 问卷首页：http://localhost:3000/index.html");
  console.log("👤 数据后台：http://localhost:3000/admin");
  console.log("======================================");
});
