const express = require("express");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

[
    "index",
    "action1_check",
    "action2_check",
    "action3_check",
    "action4_check",
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
        res.sendFile(path.join(__dirname, `${page}.html`));
    });
});

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
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        const file = fs.createReadStream(videoPath, { start, end });

        res.writeHead(206, {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
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

    return valid ? Number((sum / valid).toFixed(2)) : null;
}

app.post("/submit", async (req, res) => {
    try {
        const body = req.body;

        const data = {
            user_code: body.userCode || body.id || "未知",

            age: body.age || body.userAge || "",
            gender: body.gender || body.userGender || "",
            grade: body.grade || body.userGrade || "",
            major: body.major || body.userMajor || "",

            action: body.action || "",
            type: body.type || "",

            mos_avg: calcAvg(body, "mos", 17),
            god_avg: calcAvg(body, "god", 24),
            mind_avg: calcAvg(body, "mind", 20),

            raw: body
        };

        const { error } = await supabase
            .from("survey_results")
            .insert([data]);

        if (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: "数据库保存失败",
                error
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

app.get("/api/results", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("survey_results")
            .select("*")
            .order("submit_time", { ascending: false });

        if (error) {
            console.error(error);
            return res.json([]);
        }

        const grouped = {};

        data.forEach(item => {
            const userCode = item.user_code || "未知";

            if (!grouped[userCode]) {
                grouped[userCode] = {
                    userCode,
                    age: item.age || "",
                    gender: item.gender || "",
                    grade: item.grade || "",
                    major: item.major || "",
                    records: []
                };
            }

            grouped[userCode].records.push(item);
        });

        res.json(Object.values(grouped));
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});

app.delete("/api/delete/:userCode", async (req, res) => {
    try {
        const userCode = req.params.userCode;

        const { error } = await supabase
            .from("survey_results")
            .delete()
            .eq("user_code", userCode);

        if (error) {
            console.error(error);
            return res.status(500).json({ success: false });
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

app.get("/export", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("survey_results")
            .select("*")
            .order("submit_time", { ascending: true });

        if (error) {
            console.error(error);
            return res.status(500).send("数据库读取失败");
        }

        const rows = data.map(item => {
            const raw = item.raw || {};

            const row = {
                受试者ID: item.user_code,
                年龄: item.age,
                性别: item.gender,
                年级: item.grade,
                专业: item.major,
                动作: item.action,
                类型: item.type,
                MOS平均分: item.mos_avg,
                Godspeed平均分: item.god_avg,
                Mind平均分: item.mind_avg,
                提交时间: item.submit_time
            };

            for (let i = 1; i <= 17; i++) {
                row[`MOS${i}`] = raw[`mos${i}`] || "";
            }

            for (let i = 1; i <= 24; i++) {
                row[`Godspeed${i}`] = raw[`god${i}`] || "";
            }

            for (let i = 1; i <= 20; i++) {
                row[`Mind${i}`] = raw[`mind${i}`] || "";
            }

            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "问卷数据");

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
    font-family:"PingFang SC","Microsoft YaHei",Arial,sans-serif;
}
h1{
    text-align:center;
    margin-bottom:15px;
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
    font-size:15px;
}
.card{
    background:white;
    border-radius:14px;
    padding:24px;
    margin-bottom:28px;
    box-shadow:0 2px 10px rgba(0,0,0,0.08);
}
.info{
    line-height:2;
    font-size:16px;
    margin-bottom:20px;
}
table{
    width:100%;
    border-collapse:collapse;
    margin-top:12px;
    margin-bottom:18px;
}
th,td{
    border:1px solid #ddd;
    padding:9px;
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
.done{
    color:#16a34a;
    font-weight:bold;
}
.wrong{
    color:#dc2626;
    font-weight:bold;
}
details{
    margin-top:18px;
    background:#fafafa;
    border:1px solid #ddd;
    border-radius:10px;
    padding:12px;
}
summary{
    font-weight:bold;
    cursor:pointer;
    font-size:16px;
}
h3{
    margin-top:28px;
}
h4{
    margin:18px 0 8px;
    color:#1677ff;
}
.question-table th{
    width:160px;
}
</style>
</head>

<body>

<h1>问卷后台管理</h1>

<div class="top">
    <a class="btn" href="/export">导出 Excel</a>
</div>

<div id="app"></div>

<script>
async function loadData(){
    const res = await fetch("/api/results");
    const users = await res.json();

    const app = document.getElementById("app");

    if(users.length === 0){
        app.innerHTML = "<p style='text-align:center;color:#999;'>暂无数据</p>";
        return;
    }

    app.innerHTML = users.map(user => {
        const actions = ["action1","action2","action3","action4"];
        const correctEmotion = {
            action1: "Angry",
            action2: "Happy",
            action3: "Sad",
            action4: "Afraid"
        };
                
        function getRecord(action){
            return user.records.find(r => r.action === action);
        }

        function completeCell(action){
            return getRecord(action)
                ? "<span class='done'>已完成</span>"
                : "<span class='empty'>未完成</span>";
        }
        function emotionMark(action){
            const r = getRecord(action);
        
            if(!r){
                return "<span class='empty'>未完成</span>";
            }
        
            const answer = r.raw?.mos1 || "";
            const correct = correctEmotion[action];
        
            return answer === correct
                ? "<span class='done'>✓ 正确</span>"
                : "<span class='wrong'>✗ 错误</span>";
        }
        function detailTable(prefix, count, raw){
            let html = "<table class='question-table'><tbody>";

            for(let i = 1; i <= count; i++){
                html += \`
                    <tr>
                        <th>\${prefix.toUpperCase()}\${i}</th>
                        <td>\${raw[prefix + i] || "-"}</td>
                    </tr>
                \`;
            }

            html += "</tbody></table>";
            return html;
        }

        function actionDetails(action){
            const r = getRecord(action);

            if(!r){
                return \`
                    <details>
                        <summary>\${action} 作答详情</summary>
                        <p class="empty">该动作未完成</p>
                    </details>
                \`;
            }

            const raw = r.raw || {};

            return \`
                <details>
                    <summary>\${action} 作答详情</summary>

                    <h4>MOS 每题作答</h4>
                    \${detailTable("mos",17,raw)}

                    <h4>Godspeed 每题作答</h4>
                    \${detailTable("god",24,raw)}

                    <h4>Mind 每题作答</h4>
                    \${detailTable("mind",20,raw)}
                </details>
            \`;
        }

        return \`
            <div class="card">

                <div class="info">
                    <strong>受试者ID：</strong>\${user.userCode}<br>
                    <strong>年龄：</strong>\${user.age || "-"}　
                    <strong>性别：</strong>\${user.gender || "-"}　
                    <strong>年级：</strong>\${user.grade || "-"}　
                    <strong>专业：</strong>\${user.major || "-"}
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
                            \${actions.map(a => \`<td>\${completeCell(a)}</td>\`).join("")}
                        </tr>
                        <tr>
                            <th>Godspeed</th>
                            \${actions.map(a => \`<td>\${completeCell(a)}</td>\`).join("")}
                        </tr>
                        <tr>
                            <th>Mind</th>
                            \${actions.map(a => \`<td>\${completeCell(a)}</td>\`).join("")}
                        </tr>
                    </tbody>
                </table>

                <h3>每题作答详情</h3>

                \${actions.map(action => actionDetails(action)).join("")}

                <button class="delete-btn" onclick="deleteUser('\${user.userCode}')">
                    删除该受试者
                </button>

            </div>
        \`;
    }).join("");
}

async function deleteUser(userCode){
    if(!confirm("确定删除该受试者的全部数据吗？")) return;

    await fetch("/api/delete/" + encodeURIComponent(userCode), {
        method:"DELETE"
    });

    loadData();
}

loadData();
</script>

</body>
</html>
`);
});

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
