const express = require('express');
const { kv } = require('@vercel/kv');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 页面路由（修复404）
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});
app.get('/index.html', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});
app.get('/action1.html', (req, res) => {
  res.sendFile('action1.html', { root: __dirname });
});
app.get('/MOS.html', (req, res) => {
  res.sendFile('MOS.html', { root: __dirname });
});
app.get('/Godspeed.html', (req, res) => {
  res.sendFile('Godspeed.html', { root: __dirname });
});
app.get('/Mind.html', (req, res) => {
  res.sendFile('Mind.html', { root: __dirname });
});
app.get('/angry.mp4', (req, res) => {
  res.sendFile('angry.mp4', { root: __dirname });
});

// 用户初始化（写入KV数据库）
app.post('/initUser', async (req, res) => {
  try {
    await kv.lpush('survey_data', JSON.stringify({ ...req.body, type: 'base', serverTime: new Date().toLocaleString() }));
  } catch (e) {}
  res.json({ ok: true });
});

// 提交问卷（写入KV数据库）
app.post('/submit', async (req, res) => {
  try {
    await kv.lpush('survey_data', JSON.stringify({ ...req.body, serverTime: new Date().toLocaleString() }));
  } catch (e) {}
  res.json({ status: 'ok' });
});

// 后台（读取KV数据，显示完整列表）
app.get('/admin', async (req, res) => {
  try {
    const rawData = await kv.lrange('survey_data', 0, -1);
    const data = rawData.map(item => JSON.parse(item));
    res.send(`
    <html>
      <head><meta charset="utf-8"><title>问卷后台（KV版）</title></head>
      <body>
        <h1>问卷后台（持久化数据）</h1>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      </body>
    </html>
    `);
  } catch (e) {
    res.send("后台加载失败：" + e.message);
  }
});

app.listen(PORT, () => {
  console.log("服务已启动");
});
