const express = require('express');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'results.json');

// 初始化文件
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', { mode: 0o666 });
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
app.get('/angry.mp4', (req, res) => {
  res.sendFile(path.join(__dirname, 'angry.mp4'));
});

// ================== 用户初始化 ==================
app.post('/initUser', (req, res) => {
  try {
    let list = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    const { userCode } = req.body;
    const exist = list.some(x => x.userCode === userCode && x.type === 'base');
    if (!exist) {
      list.push({ ...req.body, type: 'base', serverTime: new Date().toLocaleString() });
      fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), { mode: 0o666 });
    }
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: true });
  }
});

// ================== 提交接口 ==================
app.post('/submit', (req, res) => {
  try {
    let arr = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    arr.push({ ...req.body, serverTime: new Date().toLocaleString() });
    fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), { mode: 0o666 });
    res.json({ status: 'ok' });
  } catch (e) {
    res.json({ status: 'ok' });
  }
});

// ================== 防崩溃后台 ==================
app.get('/admin', (req, res) => {
  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>问卷后台</title>
    <style>
      body { padding: 20px; font-family: Arial; background: #f5f7fa; }
      .btn { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-bottom: 20px; }
      .card { background: white; padding: 20px; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }
      th { background: #007bff; color: white; }
      .ok { color: #00b42a; font-weight: bold; }
      .no { color: #ff4d4f; }
    </style>
  </head>
  <body>
    <h1>📊 问卷后台</h1>
    <button class="btn" onclick="location.href='/export'">导出 Excel</button>
  `;

  try {
    const rawStr = fs.readFileSync(DATA_FILE, 'utf8') || '[]';
    const raw = JSON.parse(rawStr);
    html += `<p>✅ 读取数据成功，共 ${raw.length} 条记录</p>`;

    const users = {};
    const actionText = {
      action1: "机器人动作一",
      action2: "机器人动作二",
      action3: "机器人动作三",
      action4: "机器人动作四"
    };

    // 第一步：收集所有用户基础信息
    raw.forEach(item => {
      if (item.type === 'base' && item.userCode) {
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
    });

    // 第二步：收集所有问卷数据
    raw.forEach(item => {
      if (item.userCode && item.action) {
        // 如果用户没初始化，自动创建一个
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
        // 识别问卷类型
        if (Object.keys(item).some(k => k.startsWith('mos'))) {
          users[item.userCode].actions[ac].MOS = true;
        }
        if (Object.keys(item).some(k => k.startsWith('god'))) {
          users[item.userCode].actions[ac].Godspeed = true;
        }
        if (Object.keys(item).some(k => k.startsWith('mind'))) {
          users[item.userCode].actions[ac].Mind = true;
        }
      }
    });

    // 第三步：渲染表格
    for (let code in users) {
      const u = users[code];
      html += `
      <div class="card">
        <h3>编号：${code}</h3>
        <p>年龄：${u.info.age || "未填"} 性别：${u.info.gender || "未填"} 年级：${u.info.grade || "未填"} 专业：${u.info.major || "未填"}</p>
        <table>
          <thead>
            <tr>
              <th>动作</th>
              <th>MOS 问卷</th>
              <th>Godspeed 问卷</th>
              <th>Mind 问卷</th>
            </tr>
          </thead>
          <tbody>
      `;

      for (let a in actionText) {
        const status = u.actions[a];
        html += `
        <tr>
          <td>${actionText[a]}</td>
          <td class="${status.MOS ? 'ok' : 'no'}">${status.MOS ? '✅ 已完成' : '❌ 未答'}</td>
          <td class="${status.Godspeed ? 'ok' : 'no'}">${status.Godspeed ? '✅ 已完成' : '❌ 未答'}</td>
          <td class="${status.Mind ? 'ok' : 'no'}">${status.Mind ? '✅ 已完成' : '❌ 未答'}</td>
        </tr>
        `;
      }

      html += `
          </tbody>
        </table>
      </div>
      <hr>
      `;
    }

  } catch (e) {
    html += `
    <div class="card">
      <h3>❌ 读取数据失败</h3>
      <p>错误信息：${e.message}</p>
      <p>原始数据内容：<pre>${fs.readFileSync(DATA_FILE, 'utf8')}</pre></p>
    </div>
    `;
  }

  html += `</body></html>`;
  res.send(html);
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
    res.status(500).send("导出失败：" + e.message);
  }
});

// ================== 启动服务 ==================
app.listen(PORT, '0.0.0.0', () => {
  console.log("服务已启动");
});
