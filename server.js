const express = require("express");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "results.json");

/* =========================================
   中间件
========================================= */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// 静态资源
app.use(express.static(__dirname));

/* =========================================
   首页路由（修复 Cannot GET /）
========================================= */

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/index.html", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/action1.html", (req, res) => {
    res.sendFile(path.join(__dirname, "action1.html"));
});

// 后面有 action2/3/4 时取消注释即可
/*
app.get("/action2.html", (req, res) => {
    res.sendFile(path.join(__dirname, "action2.html"));
});

app.get("/action3.html", (req, res) => {
    res.sendFile(path.join(__dirname, "action3.html"));
});

app.get("/action4.html", (req, res) => {
    res.sendFile(path.join(__dirname, "action4.html"));
});
*/

/* =========================================
   读取 results.json
========================================= */

function readResults() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, "[]");
        }

        const raw = fs.readFileSync(DATA_FILE, "utf8");

        return JSON.parse(raw || "[]");
    } catch (err) {
        console.error("读取 results.json 失败", err);
        return [];
    }
}

/* =========================================
   写入 results.json
========================================= */

function writeResults(data) {
    try {
        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify(data, null, 2),
            "utf8"
        );
    } catch (err) {
        console.error("写入 results.json 失败", err);
    }
}

/* =========================================
   计算平均分
========================================= */

function calcAvg(data, prefix, count) {
    let sum = 0;
    let valid = 0;

    for (let i = 1; i <= count; i++) {
        const value = Number(data[`${prefix}${i}`]);

        if (!isNaN(value)) {
            sum += value;
            valid++;
        }
    }

    if (valid === 0) return "";

    return Number((sum / valid).toFixed(2));
}

/* =========================================
   提交问卷
========================================= */

app.post("/submit", (req, res) => {
    try {
        const body = req.body;

        const results = readResults();

        const newRecord = {
            id: Date.now().toString(),

            submitTime: new Date().toLocaleString("zh-CN"),

            // 基本信息
            userCode: body.userCode || "未知",
            grade: body.grade || "",
            major: body.major || "",
            gender: body.gender || "",
            age: body.age || "",

            // 动作
            action: body.action || "",

            // 问卷类型
            type: body.type || "",

            // 平均分
            mosAvg: calcAvg(body, "mos", 17),
            godAvg: calcAvg(body, "god", 24),
            mindAvg: calcAvg(body, "mind", 20),

            // 原始数据
            raw: body
        };

        results.push(newRecord);

        writeResults(results);

        console.log("新问卷提交：", newRecord.userCode);

        res.json({
            success: true,
            message: "提交成功"
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: "提交失败"
        });
    }
});

/* =========================================
   获取后台数据
========================================= */

app.get("/api/results", (req, res) => {
    try {
        const results = readResults();

        const grouped = {};

        results.forEach(item => {
            const userCode = item.userCode || "未知";

            if (!grouped[userCode]) {
                grouped[userCode] = {
                    userCode,
                    grade: item.grade || "",
                    major: item.major || "",
                    gender: item.gender || "",
                    age: item.age || "",
                    records: []
                };
            }

            grouped[userCode].records.push(item);
        });

        res.json(Object.values(grouped));

    } catch (err) {
        console.error(err);

        res.status(500).json([]);
    }
});

/* =========================================
   删除受试者
========================================= */

app.delete("/api/delete/:userCode", (req, res) => {
    try {
        const userCode = req.params.userCode;

        const results = readResults();

        const filtered = results.filter(
            item => item.userCode !== userCode
        );

        writeResults(filtered);

        res.json({
            success: true,
            message: "删除成功"
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false
        });
    }
});

/* =========================================
   导出 Excel
========================================= */

app.get("/export", (req, res) => {
    try {
        const results = readResults();

        const excelData = results.map(item => ({
            受试者ID: item.userCode,
            年级: item.grade,
            专业: item.major,
            性别: item.gender,
            年龄: item.age,
            动作: item.action,
            MOS平均分: item.mosAvg,
            Godspeed平均分: item.godAvg,
            Mind平均分: item.mindAvg,
            提交时间: item.submitTime
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "问卷数据"
        );

        const buffer = XLSX.write(workbook, {
            type: "buffer",
            bookType: "xlsx"
        });

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=results.xlsx"
        );

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.send(buffer);

    } catch (err) {
        console.error(err);

        res.status(500).send("导出失败");
    }
});

/* =========================================
   后台页面
========================================= */

app.get("/admin", (req, res) => {

    res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">

<title>问卷后台管理</title>

<style>

body{
    margin:0;
    padding:30px;
    background:#f5f7fa;
    font-family:
    "PingFang SC",
    "Microsoft YaHei",
    sans-serif;
}

h1{
    text-align:center;
    margin-bottom:20px;
}

.top{
    text-align:center;
    margin-bottom:30px;
}

.btn{
    background:#2d8cf0;
    color:white;
    border:none;
    padding:10px 16px;
    border-radius:8px;
    cursor:pointer;
    text-decoration:none;
    font-size:14px;
}

.card{
    background:white;
    border-radius:14px;
    padding:20px;
    margin-bottom:25px;
    box-shadow:0 2px 10px rgba(0,0,0,0.08);
}

.info{
    line-height:1.9;
    margin-bottom:15px;
}

table{
    width:100%;
    border-collapse:collapse;
    margin-top:15px;
}

th,td{
    border:1px solid #ddd;
    padding:10px;
    text-align:center;
}

th{
    background:#f0f4f8;
}

.delete-btn{
    margin-top:18px;
    background:#e74c3c;
    color:white;
    border:none;
    padding:10px 16px;
    border-radius:8px;
    cursor:pointer;
}

.empty{
    color:#999;
}

</style>
</head>

<body>

<h1>问卷后台管理</h1>

<div class="top">
    <a class="btn" href="/export">
        导出 Excel
    </a>
</div>

<div id="app"></div>

<script>

async function loadData(){

    const res = await fetch("/api/results");

    const users = await res.json();

    const app = document.getElementById("app");

    if(users.length === 0){

        app.innerHTML =
        "<p style='text-align:center;color:#999;'>暂无数据</p>";

        return;
    }

    app.innerHTML = users.map(user => {

        const actions = [
            "action1",
            "action2",
            "action3",
            "action4"
        ];

        function getRecord(action){

            return user.records.find(
                r => r.action === action
            );
        }

        return \`

<div class="card">

<div class="info">

<strong>受试者ID：</strong>
\${user.userCode}

<br>

<strong>年级：</strong>
\${user.grade || "-"}

　

<strong>专业：</strong>
\${user.major || "-"}

　

<strong>性别：</strong>
\${user.gender || "-"}

　

<strong>年龄：</strong>
\${user.age || "-"}

</div>

<table>

<thead>
<tr>
<th>问卷 / 动作</th>
<th>Action1</th>
<th>Action2</th>
<th>Action3</th>
<th>Action4</th>
</tr>
</thead>

<tbody>

<tr>

<th>MOS</th>

\${actions.map(action => {

const r = getRecord(action);

return \`<td>\${r ? r.mosAvg : "<span class='empty'>未完成</span>"}</td>\`;

}).join("")}

</tr>

<tr>

<th>Godspeed</th>

\${actions.map(action => {

const r = getRecord(action);

return \`<td>\${r ? r.godAvg : "<span class='empty'>未完成</span>"}</td>\`;

}).join("")}

</tr>

<tr>

<th>Mind</th>

\${actions.map(action => {

const r = getRecord(action);

return \`<td>\${r ? r.mindAvg : "<span class='empty'>未完成</span>"}</td>\`;

}).join("")}

</tr>

</tbody>

</table>

<button
class="delete-btn"
onclick="deleteUser('\${user.userCode}')"
>
删除该受试者
</button>

</div>

\`;

    }).join("");
}

async function deleteUser(userCode){

    const ok = confirm(
        "确定删除受试者 " +
        userCode +
        " 的全部数据吗？"
    );

    if(!ok) return;

    await fetch(
        "/api/delete/" +
        encodeURIComponent(userCode),
        {
            method:"DELETE"
        }
    );

    loadData();
}

loadData();

</script>

</body>
</html>
    `);
});

/* =========================================
   启动服务器
========================================= */

app.listen(PORT, () => {
    console.log("服务器运行中：http://localhost:" + PORT);
});
