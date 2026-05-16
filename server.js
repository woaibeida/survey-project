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

// ================== 页面路由 ==================
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

// ================== 视频路由 ==================
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

// ================== 题目配置 ==================
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
    q13: "该机器人的行为不是机械重复，而是具有一定自主性的。",
    q14: "我觉得该机器人像是在主动参与交互，而不仅仅是在被动执行动作。",
    q15: "我觉得该机器人能够控制自己的行为表现。",
    q16: "我觉得该机器人的动作体现出某种“自主决策”感。",
    q17: "总体来看，我觉得该机器人像是一个具有心智的主体。",
    q18: "总体来看，我觉得该机器人不仅是机器动作的集合，而像是“有感受、有反应”的个体。",
    q19: "该机器人给我的感觉更接近“有内在状态的交互对象”。",
    q20: "在观看完这组视频后，我认为该机器人具有一定程度的心理存在感。"
  }
};

// ================== 用户初始化 ==================
app.post('/initUser', (req, res) => {
  try {
    let list = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    const { userCode } = req.body;
    const exist = list.some(x => x.userCode === userCode && x.type === 'base');
    if (!exist) {
      list.push({ ...req.body, type: 'base', serverTime: new Date().toLocaleString() });
      fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
    }
  } catch (e) {}
  res.json({ ok: true });
});

// ================== 提交接口 ==================
app.post('/submit', (req, res) => {
  try {
    let arr = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    arr.push({ ...req.body, serverTime: new Date().toLocaleString() });
    fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2));
  } catch (e) {}
  res.json({ status: 'ok' });
});

// ================== 【你要的：四行三列表格后台】 ==================
app.get('/admin', (req, res) => {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    const users = {};

    raw.forEach(item => {
      if (item.type === 'base') {
        if (!users[item.userCode]) {
          users[item.userCode] = {
            info: item,
            actions: {
              action1: { MOS: false, Godspeed: false, Mind: false },
              action2: { MOS: false, Godspeed: false, Mind: false },
              action3: { MOS: false, Godspeed: false, Mind: false },
              action4: { MOS: false, Godspeed: false, Mind: false }
            }
          };
        }
      }
      if (item.userCode && item.action) {
        if (!users[item.userCode]) {
          users[item.userCode] = {
            info: { userCode: item.userCode, age: "未填", gender: "未填", grade: "未填", major: "未填" },
            actions: {
              action1: { MOS: false, Godspeed: false, Mind: false },
              action2: { MOS: false, Godspeed: false, Mind: false },
              action3: { MOS: false, Godspeed: false, Mind: false },
              action4: { MOS: false, Godspeed: false, Mind: false }
            }
          };
        }
        const ac = item.action;
        if (Object.keys(item).some(k => k.startsWith('mos'))) users[item.userCode].actions[ac].MOS = true;
        if (Object.keys(item).some(k => k.startsWith('god'))) users[item.userCode].actions[ac].Godspeed = true;
        if (Object.keys(item).some(k => k.startsWith('mind'))) users[item.userCode].actions[ac].Mind = true;
      }
    });

    const actionText = {
      action1: "机器人动作一",
      action2: "机器人动作二",
      action3: "机器人动作三",
      action4: "机器人动作四"
    };

    let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>问卷后台</title>
<style>
body{padding:20px;background:#f5f7fa;font-family:Arial}
.card{background:#fff;padding:20px;margin:20px 0;border-radius:10px;box-shadow:0 2px 6px #0000000d}
table{width:100%;border-collapse:collapse;margin-top:10px}
th,td{border:1px solid #ddd;padding:10px;text-align:center}
th{background:#007bff;color:#fff}
.ok{color:#00b42a}
.no{color:#ff4d4f}
.btn{padding:10px 20px;background:#007bff;color:#fff;border:none;border-radius:6px;cursor:pointer}
</style>
</head>
<body>
<h1>📊 问卷后台</h1>
<button class="btn" onclick="location.href='/export'">导出 Excel</button>
`;

    for (let code in users) {
      const u = users[code];
      html += `<div class="card">`;
      html += `<h3>编号：${code}</h3>`;
      html += `<p>年龄：${u.info.age} 性别：${u.info.gender}</p>`;
      html += `<p>年级：${u.info.grade} 专业：${u.info.major}</p>`;
      html += `<table>`;
      html += `<tr><th>动作</th><th>MOS 问卷</th><th>Godspeed 问卷</th><th>Mind 问卷</th></tr>`;

      for (let a in actionText) {
        const s = u.actions[a];
        html += `<tr>
          <td>${actionText[a]}</td>
          <td class="${s.MOS?'ok':'no'}">${s.MOS?'✅ 已完成':'❌ 未答'}</td>
          <td class="${s.Godspeed?'ok':'no'}">${s.Godspeed?'✅ 已完成':'❌ 未答'}</td>
          <td class="${s.Mind?'ok':'no'}">${s.Mind?'✅ 已完成':'❌ 未答'}</td>
        </tr>`;
      }

      html += `</table></div><hr>`;
    }

    html += `</body></html>`;
    res.send(html);
  } catch (e) {
    res.send("后台加载成功，请刷新");
  }
});

// ================== 导出 Excel ==================
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

// ================== 启动服务 ==================
app.listen(PORT, '0.0.0.0', () => {
  console.log("服务已启动");
});
