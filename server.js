const express = require("express");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "results.json");

app.use(express.json({ limit: "10mb" }));
app.use(express.static(__dirname));

function readResults() {
    if (!fs.existsSync(DATA_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, "utf8") || "[]");
    } catch {
        return [];
    }
}

function writeResults(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function avg(data, prefix, count) {
    let sum = 0;
    let n = 0;

    for (let i = 1; i <= count; i++) {
        const v = Number(data[`${prefix}${i}`]);
        if (!isNaN(v)) {
            sum += v;
            n++;
        }
    }

    return n ? Number((sum / n).toFixed(2)) : "";
}

function normalizeRecord(data) {
    return {
        id: Date.now().toString(),
        submitTime: new Date().toLocaleString("zh-CN"),
        userCode: data.userCode || data.id || "未知",

        grade: data.grade || data年级 || data.userGrade || "",
        major: data.major || data专业 || data.userMajor || "",
        gender: data.gender || data性别 || data.userGender || "",
        age: data.age || data年龄 || data.userAge || "",

        action: data.action || "unknown",
        type: data.type || "",

        mosAvg: avg(data, "mos", 17),
        godAvg: avg(data, "god", 24),
        mindAvg: avg(data, "mind", 20),

        raw: data
    };
}

app.post("/submit", (req, res) => {
    try {
        const results = readResults();
        const record = normalizeRecord(req.body);

        results.push(record);
        writeResults(results);

        res.json({
            success: true,
            message: "提交成功",
            record
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "保存失败"
        });
    }
});

app.get("/api/results", (req, res) => {
    const results = readResults();

    const users = {};

    results.forEach(r => {
        const userCode = r.userCode || "未知";

        if (!users[userCode]) {
            users[userCode] = {
                userCode,
                grade: r.grade || "",
                major: r.major || "",
                gender: r.gender || "",
                age: r.age || "",
                records: []
            };
        }

        users[userCode].records.push(r);
    });

    res.json(Object.values(users));
});

app.delete("/api/delete/:userCode", (req, res) => {
    const userCode = req.params.userCode;
    const results = readResults();

    const newResults = results.filter(r => r.userCode !== userCode);
    writeResults(newResults);

    res.json({
        success: true,
        message: `已删除受试者 ${userCode}`
    });
});

app.get("/export", (req, res) => {
    const results = readResults();

    const rows = results.map(r => ({
        受试者ID: r.userCode,
        年级: r.grade,
        专业: r.major,
        性别: r.gender,
        年龄: r.age,
        动作: r.action,
        类型: r.type,
        MOS平均分: r.mosAvg,
        Godspeed平均分: r.godAvg,
        Mind平均分: r.mindAvg,
        提交时间: r.submitTime,
        原始数据: JSON.stringify(r.raw)
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "问卷结果");

    const buffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx"
    });

    res.setHeader("Content-Disposition", "attachment; filename=results.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
});

app.get("/admin", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>问卷后台管理</title>
<style>
body {
    font-family: Arial, "Microsoft YaHei", sans-serif;
    background: #f5f7fa;
    padding: 30px;
}
h1 {
    text-align: center;
}
.top {
    text-align: center;
    margin-bottom: 25px;
}
button, a.btn {
    border: none;
    background: #2d8cf0;
    color: white;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
    text-decoration: none;
    font-size: 14px;
}
.delete {
    background: #e74c3c;
}
.card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 25px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.info {
    margin-bottom: 15px;
    line-height: 1.8;
}
table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
}
th, td {
    border: 1px solid #ddd;
    padding: 10px;
    text-align: center;
}
th {
    background: #f0f4f8;
}
.empty {
    color: #999;
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
async function loadData() {
    const res = await fetch("/api/results");
    const users = await res.json();

    const app = document.getElementById("app");

    if (!users.length) {
        app.innerHTML = "<p style='text-align:center;color:#999;'>暂无数据</p>";
        return;
    }

    app.innerHTML = users.map(user => {
        const actions = ["action1", "action2", "action3", "action4"];
        const rows = ["MOS", "Godspeed", "Mind"];

        function getScore(action, type) {
            const r = user.records.find(x => x.action === action);
            if (!r) return "<span class='empty'>未完成</span>";

            if (type === "MOS") return r.mosAvg || "-";
            if (type === "Godspeed") return r.godAvg || "-";
            if (type === "Mind") return r.mindAvg || "-";
        }

        return \`
            <div class="card">
                <div class="info">
                    <strong>受试者ID：</strong>\${user.userCode}<br>
                    <strong>年级：</strong>\${user.grade || "-"}　
                    <strong>专业：</strong>\${user.major || "-"}　
                    <strong>性别：</strong>\${user.gender || "-"}　
                    <strong>年龄：</strong>\${user.age || "-"}
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>问卷 / 动作</th>
                            <th>Action 1</th>
                            <th>Action 2</th>
                            <th>Action 3</th>
                            <th>Action 4</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${rows.map(row => \`
                            <tr>
                                <th>\${row}</th>
                                \${actions.map(action => \`<td>\${getScore(action, row)}</td>\`).join("")}
                            </tr>
                        \`).join("")}
                    </tbody>
                </table>

                <br>
                <button class="delete" onclick="deleteUser('\${user.userCode}')">删除该受试者数据</button>
            </div>
        \`;
    }).join("");
}

async function deleteUser(userCode) {
    if (!confirm("确定要删除受试者 " + userCode + " 的全部数据吗？")) return;

    await fetch("/api/delete/" + encodeURIComponent(userCode), {
        method: "DELETE"
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
