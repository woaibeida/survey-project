const express = require('express');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'results.json');

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// 根路由自动跳转到问卷首页（解决 Cannot GET /）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 题目内容映射
const questionMap = {
  MOS: {
    q1: "你认为该视频表达的主要情绪是什么？",
    q2: "你对自己刚才的判断有多确定？",
    q3: "我能够清楚感受到该视频想表达的情绪。",
    q4: "该视频中的情绪表达是明确的，不容易与其他情绪混淆。",
    q5: "该视频中的情绪表达看起来是自然的。",
    q6: "该视频中的动作变化符合日常交互中对该情绪的直观感受。",
    q7: "该视频中的情绪表达具有足够的表现力。",
    q8: "该视频中的情绪强度是清晰可感知的。",
    q9: "该视频中的情绪表达不会显得过弱或不足。",
    q10: "视频中的动作与所表达的情绪是一致的。",
    q11: "该视频中的运动节奏、姿态变化和交互方式能够支持该情绪的表达。",
    q12: "该视频中的情绪表达强度是合适的。",
    q13: "该视频中的情绪表达不会显得过于夸张。",
    q14: "该视频中的情绪表达不会显得过于平淡。",
    q15: "总体来看，该视频的情绪表达效果较好。",
    q16: "该视频中的情绪表达能够增强交互体验。",
    q17: "如果在真实人机交互中出现这种表达，我会觉得它是合适且可接受的。"
  },
  Godspeed: {
    q1: "该机器人看起来更像一个具有情感的主体，而不仅仅是一个执行动作的机器。",
    q2: "该机器人的表达方式让我感觉它更接近人的情绪表达。",
    q3: "该机器人的行为给我一种“像人在表达情绪”的感觉。",
    q4: "与普通机械动作相比，该机器人的行为更像是带有个体特征的表达。",
    q5: "该机器人的行为看起来是生动的，而不是呆板的。",
    q6: "该机器人看起来像是在与人进行真实互动。",
    q7: "该机器人的动作表现出一定的活力和变化感。",
    q8: "该机器人给我的感觉更像是“有反应的个体”，而不是静态机械体。",
    q9: "这种表达方式让我感觉舒适。",
    q10: "我愿意与采用这种表达方式的机器人进行交互。",
    q11: "该机器人的表达方式让我觉得亲和。",
    q12: "该机器人的表现整体上是讨人喜欢的。",
    q13: "该机器人的行为看起来是合理的。",
    q14: "该机器人似乎能够根据场景做出合适的表达。",
    q15: "该机器人的动作让我感觉它能够理解当前交互情境。",
    q16: "该机器人的行为表现出一定的智能性，而不是简单重复。",
    q17: "在这种表达方式下，我会感到安全。",
    q18: "该机器人的行为不会让我感到被威胁。",
    q19: "与该机器人进行交互时，我不会感到不安。",
    q20: "即使在表达较强烈情绪时，该机器人也不会让我感到危险。",
    q21: "总体来看，该机器人给我的整体印象是积极的。",
    q22: "总体来看，该机器人适合作为一个可交互的情感表达主体。",
    q23: "该机器人的整体表达方式增强了我对交互过程的接受度。",
    q24: "我认为该机器人具备较好的整体交互感知表现。"
  },
  Mind: {
    q1: "我觉得该机器人能够表达自己的情绪状态。",
    q2: "我觉得该机器人像是能够感受到快乐、悲伤、害怕或愤怒等情绪。",
    q3: "我觉得该机器人的行为反映了其内部的情感变化。",
    q4: "我觉得该机器人并不是单纯执行动作，而是在“体验”某种情绪。",
    q5: "我觉得该机器人能够对交互过程产生情感反应。",
    q6: "我觉得该机器人像是会在不同情境下产生不同感受。",
    q7: "我觉得该机器人具有某种“情感上的存在感”。",
    q8: "我觉得该机器人表现得像是能够被外界事件所影响。",
    q9: "我觉得该机器人的行为是有意图的。",
    q10: "我觉得该机器人的动作是在根据情境主动做出反应。",
    q11: "我觉得该机器人的行为具有一定目的性。",
    q12: "我觉得该机器人能够根据交互场景调整自己的表达方式。",
    q13: "我觉得该机器人的行为不是机械重复，而是具有一定自主性的。",
    q14: "我觉得该机器人像是在主动参与交互，而不仅仅是在被动执行动作。",
    q15: "我觉得该机器人能够控制自己的行为表现。",
    q16: "我觉得该机器人的动作体现出某种“自主决策”感。",
    q17: "总体来看，我觉得该机器人像是一个具有心智的主体。",
    q18: "总体来看，我觉得该机器人不仅是机器动作的集合，而像是“有感受、有反应”的个体。",
    q19: "该机器人给我的感觉更接近“有内在状态的交互对象”。",
    q20: "在观看完这组视频后，我认为该机器人具有一定程度的心理存在感。"
  }
};

// 动作名称映射
const actionName = {
  action1: "机器人动作一",
  action2: "机器人动作二",
  action3: "机器人动作三",
  action4: "机器人动作四"
};

// 受试者建档接口
app.post('/initUser', (req, res) => {
  const { userCode, age, gender, grade, major } = req.body;
  let list = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  const exist = list.some(item => item.userCode === userCode);
  if(!exist){
    list.push({
      userCode,
      age,
      gender,
      grade,
      major,
      type:"base",
      serverTime: new Date(Date.now() + 8*3600000).toLocaleString()
    });
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
  }
  res.send({ok:true});
});

// 后台管理页
app.get('/admin', (req, res) => {
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const groups = {};

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
        // MOS 只保留 mos 题目
        const mosData = {};
        for(let key in item){ if(key.startsWith("mos")) mosData[key] = item[key]; }
        groups[code].actions[action].MOS = {
          userCode: item.userCode, action: item.action, type: "MOS问卷", serverTime: item.serverTime, ...mosData
        };

        // Godspeed 只保留 god 题目
        const godData = {};
        for(let key in item){ if(key.startsWith("god")) godData[key] = item[key]; }
        groups[code].actions[action].Godspeed = {
          userCode: item.userCode, action: item.action, type: "Godspeed问卷", serverTime: item.serverTime, ...godData
        };

        // Mind 只保留 mind 题目
        const mindData = {};
        for(let key in item){ if(key.startsWith("mind")) mindData[key] = item[key]; }
        groups[code].actions[action].Mind = {
          userCode: item.userCode, action: item.action, type: "Mind问卷", serverTime: item.serverTime, ...mindData
        };
      } else if (item.type?.includes('MOS')) {
        groups[code].actions[action].MOS = item;
      } else if (item.type?.includes('Godspeed')) {
        groups[code].actions[action].Godspeed = item;
      } else if (item.type?.includes('Mind')) {
        groups[code].actions[action].Mind = item;
      }
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
    <button style="padding:10px 20px; background:#2d8cf0; color:white; border:none; border-radius:6px; cursor:pointer; margin-bottom:20px;" onclick="window.location.href='/export'">📥 导出所有作答数据为Excel</button>
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

      // MOS
      if(surveyData.MOS){
        const s = JSON.stringify(surveyData.MOS, null, 2);
        html += `<td class="cell-toggle" onclick="toggleDetail('${code}-${actionKey}-mos')">`;
        html += `<span class="cell-done">✅ 已完成</span>`;
        html += `<div class="detail-content" id="${code}-${actionKey}-mos">${s}</div>`;
        html += `</td>`;
      }else{
        html += `<td class="cell-none">未答</td>`;
      }

      // Godspeed
      if(surveyData.Godspeed){
        const s = JSON.stringify(surveyData.Godspeed, null, 2);
        html += `<td class="cell-toggle" onclick="toggleDetail('${code}-${actionKey}-god')">`;
        html += `<span class="cell-done">✅ 已完成</span>`;
        html += `<div class="detail-content" id="${code}-${actionKey}-god">${s}</div>`;
        html += `</td>`;
      }else{
        html += `<td class="cell-none">未答</td>`;
      }

      // Mind
      if(surveyData.Mind){
        const s = JSON.stringify(surveyData.Mind, null, 2);
        html += `<td class="cell-toggle" onclick="toggleDetail('${code}-${actionKey}-mind')">`;
        html += `<span class="cell-done">✅ 已完成</span>`;
        html += `<div class="detail-content" id="${code}-${actionKey}-mind">${s}</div>`;
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
    function toggleDetail(id){ document.getElementById(id).classList.toggle('show'); }
    function del(code){ if(!confirm('确定删除【'+code+'】所有数据？')) return; location.href='/delete?code='+code; }
  </script>
  </body></html>`;

  res.send(html);
});

// ====================== 导出 Excel（修复版，不会崩溃）======================
app.get('/export', (req, res) => {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const userBase = {};
    const excelData = [];

    raw.forEach(item => {
      if(item.type === "base"){
        userBase[item.userCode] = {
          age: item.age, gender: item.gender, grade: item.grade, major: item.major
        };
      }
    });

    raw.forEach(item => {
      const code = item.userCode || '未知';
      const base = userBase[code] || {};
      const actionLabel = actionName[item.action] || '未知动作';

      // MOS
      if(item.type?.includes('MOS') || item.type?.includes('三合一')){
        for(let key in item){
          if(key.startsWith('mos')){
            const qNum = key.replace('mos','');
            excelData.push({
              '受试者编码': code,
              '年龄': base.age,
              '性别': base.gender,
              '年级': base.grade,
              '专业': base.major,
              '动作': actionLabel,
              '问卷': 'MOS',
              '题号': 'MOS'+qNum,
              '题目': questionMap.MOS['q'+qNum] || '题目'+qNum,
              '答案': item[key],
              '时间': item.serverTime
            });
          }
        }
      }

      // Godspeed
      if(item.type?.includes('Godspeed') || item.type?.includes('三合一')){
        for(let key in item){
          if(key.startsWith('god')){
            const qNum = key.replace('god','');
            excelData.push({
              '受试者编码': code,
              '年龄': base.age,
              '性别': base.gender,
              '年级': base.grade,
              '专业': base.major,
              '动作': actionLabel,
              '问卷': 'Godspeed',
              '题号': 'Godspeed'+qNum,
              '题目': questionMap.Godspeed['q'+qNum] || '题目'+qNum,
              '答案': item[key],
              '时间': item.serverTime
            });
          }
        }
      }

      // Mind
      if(item.type?.includes('Mind') || item.type?.includes('三合一')){
        for(let key in item){
          if(key.startsWith('mind')){
            const qNum = key.replace('mind','');
            excelData.push({
              '受试者编码': code,
              '年龄': base.age,
              '性别': base.gender,
              '年级': base.grade,
              '专业': base.major,
              '动作': actionLabel,
              '问卷': 'Mind',
              '题号': 'Mind'+qNum,
              '题目': questionMap.Mind['q'+qNum] || '题目'+qNum,
              '答案': item[key],
              '时间': item.serverTime
            });
          }
        }
      }
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "数据");

    const buf = XLSX.write(wb, { type:'buffer', bookType:'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="survey.xlsx"');
    res.send(buf);

  } catch (e) {
    console.error(e);
    res.status(500).send("导出失败："+e.message);
  }
});

// 删除
app.get('/delete', (req, res) => {
  const code = req.query.code;
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const filtered = raw.filter(item => item.userCode !== code);
  fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2));
  res.redirect('/admin');
});

// 提交
app.post('/submit', (req, res) => {
  const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  d.push({ ...req.body, serverTime: new Date(Date.now() + 8*3600000).toLocaleString() });
  fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
  res.send({ status: 'ok' });
});

// 监听 0.0.0.0 适配 Vercel
app.listen(PORT, '0.0.0.0', () => {
  console.log("✅ 服务启动成功");
});
