const express = require("express");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");

const { createClient } = require("@supabase/supabase-js");

const app = express();

const PORT = process.env.PORT || 3000;

/* =========================================
   Supabase
========================================= */

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =========================================
   中间件
========================================= */

app.use(express.json({ limit: "10mb" }));

app.use(express.urlencoded({
    extended: true
}));

app.use(express.static(__dirname));

/* =========================================
   首页
========================================= */

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

/* =========================================
   页面路由
========================================= */

[
    "index",
    "action1",
    "action2",
    "action3",
    "action4",
    "MOS",
    "Mind",
    "Godspeed",
    "MOS_answer",
    "Mind_answer",
    "Godspeed_answer"
].forEach(page => {

    app.get(`/${page}.html`, (req, res) => {

        res.sendFile(
            path.join(__dirname, `${page}.html`)
        );
    });
});

/* =========================================
   视频路由
========================================= */

app.get("/angry.mp4", (req, res) => {

    const videoPath = path.join(__dirname, "angry.mp4");

    if (!fs.existsSync(videoPath)) {
        return res.status(404).send("Video not found");
    }

    const stat = fs.statSync(videoPath);

    const fileSize = stat.size;

    const range = req.headers.range;

    res.setHeader("Accept-Ranges", "bytes");

    res.setHeader("Content-Type", "video/mp4");

    if (range) {

        const parts = range.replace(/bytes=/, "").split("-");

        const start = parseInt(parts[0], 10);

        const end = parts[1]
            ? parseInt(parts[1], 10)
            : fileSize - 1;

        const chunkSize = end - start + 1;

        const file = fs.createReadStream(videoPath, {
            start,
            end
        });

        res.writeHead(206, {
            "Content-Range":
                `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunkSize,
            "Content-Type": "video/mp4"
        });

        file.pipe(res);

    } else {

        res.writeHead(200, {
            "Content-Length": fileSize,
            "Content-Type": "video/mp4"
        });

        fs.createReadStream(videoPath).pipe(res);
    }
});

/* =========================================
   计算平均分
========================================= */

function calcAvg(data, prefix, count) {

    let sum = 0;

    let valid = 0;

    for (let i = 1; i <= count; i++) {

        const value = Number(
            data[`${prefix}${i}`]
        );

        if (!isNaN(value)) {

            sum += value;

            valid++;
        }
    }

    return valid
        ? Number((sum / valid).toFixed(2))
        : null;
}

/* =========================================
   提交问卷
========================================= */

app.post("/submit", async (req, res) => {

    try {

        const body = req.body;

        const data = {

            user_code:
                body.userCode ||
                body.id ||
                "未知",

            age:
                body.age ||
                body.userAge ||
                "",

            gender:
                body.gender ||
                body.userGender ||
                "",

            grade:
                body.grade ||
                body.userGrade ||
                "",

            major:
                body.major ||
                body.userMajor ||
                "",

            action:
                body.action || "",

            type:
                body.type || "",

            mos_avg:
                calcAvg(body, "mos", 17),

            god_avg:
                calcAvg(body, "god", 24),

            mind_avg:
                calcAvg(body, "mind", 20),

            raw: body
        };

        const { error } = await supabase
            .from("survey_results")
            .insert([data]);

        if (error) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: "数据库保存失败"
            });
        }

        res.json({
            success: true,
            message: "提交成功"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "服务器错误"
        });
    }
});

/* =========================================
   获取后台数据
========================================= */

app.get("/api/results", async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("survey_results")
            .select("*")
            .order("submit_time", {
                ascending: false
            });

        if (error) {

            console.error(error);

            return res.json([]);
        }

        const grouped = {};

        data.forEach(item => {

            const userCode =
                item.user_code || "未知";

            if (!grouped[userCode]) {

                grouped[userCode] = {

                    userCode,

                    age: item.age,

                    gender: item.gender,

                    grade: item.grade,

                    major: item.major,

                    records: []
                };
            }

            grouped[userCode]
                .records
                .push(item);
        });

        res.json(
            Object.values(grouped)
        );

    } catch (err) {

        console.error(err);

        res.json([]);
    }
});

/* =========================================
   删除受试者
========================================= */

app.delete(
    "/api/delete/:userCode",
    async (req, res) => {

        try {

            const userCode =
                req.params.userCode;

            const { error } = await supabase
                .from("survey_results")
                .delete()
                .eq("user_code", userCode);

            if (error) {

                console.error(error);

                return res.status(500).json({
                    success: false
                });
            }

            res.json({
                success: true
            });

        } catch (err) {

            console.error(err);

            res.status(500).json({
                success: false
            });
        }
    }
);

/* =========================================
   导出 Excel
========================================= */

app.get("/export", async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("survey_results")
            .select("*");

        if (error) {

            return res.status(500)
                .send("数据库读取失败");
        }

        const rows = data.map(item => ({

            受试者ID:
                item.user_code,

            年龄:
                item.age,

            性别:
                item.gender,

            年级:
                item.grade,

            专业:
                item.major,

            动作:
                item.action,

            类型:
                item.type,

            MOS平均分:
                item.mos_avg,

            Godspeed平均分:
                item.god_avg,

            Mind平均分:
                item.mind_avg,

            提交时间:
                item.submit_time
        }));

        const worksheet =
            XLSX.utils.json_to_sheet(rows);

        const workbook =
            XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "问卷数据"
        );

        const buffer = XLSX.write(
            workbook,
            {
                type: "buffer",
                bookType: "xlsx"
            }
        );

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
}

.top{
    text-align:center;
    margin-bottom:30px;
}

.btn{
    background:#1677ff;
    color:white;
    padding:10px 18px;
    border:none;
    border-radius:8px;
    text-decoration:none;
}

.card{
    background:white;
    border-radius:14px;
    padding:20px;
    margin-bottom:25px;
    box-shadow:
    0 2px 10px rgba(0,0,0,0.08);
}

.info{
    line-height:2;
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

<a
class="btn"
href="/export"
>
导出 Excel
</a>

</div>

<div id="app"></div>

<script>

async function loadData(){

    const res =
        await fetch("/api/results");

    const users =
        await res.json();

    const app =
        document.getElementById("app");

    if(users.length === 0){

        app.innerHTML =
        "<p style='text-align:center;color:#999;'>暂无数据</p>";

        return;
    }

    app.innerHTML =
    users.map(user => {

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

        function cell(action,key){

            const r =
                getRecord(action);

            if(!r)
                return "<span class='empty'>未完成</span>";

            return r[key] || "-";
        }

        return \`

<div class="card">

<div class="info">

<strong>受试者ID：</strong>
\${user.userCode}

<br>

<strong>年龄：</strong>
\${user.age || "-"}

　

<strong>性别：</strong>
\${user.gender || "-"}

　

<strong>年级：</strong>
\${user.grade || "-"}

　

<strong>专业：</strong>
\${user.major || "-"}

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

\${actions.map(a =>
\`<td>\${cell(a,"mos_avg")}</td>\`
).join("")}

</tr>

<tr>

<th>Godspeed</th>

\${actions.map(a =>
\`<td>\${cell(a,"god_avg")}</td>\`
).join("")}

</tr>

<tr>

<th>Mind</th>

\${actions.map(a =>
\`<td>\${cell(a,"mind_avg")}</td>\`
).join("")}

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

    const ok =
        confirm(
        "确定删除该受试者吗？"
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
   启动
========================================= */

app.listen(PORT, () => {

    console.log(
        "Server running on port " + PORT
    );
});
