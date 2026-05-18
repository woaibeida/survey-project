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

        const actions = [
            "action1",
            "action2",
            "action3",
            "action4"
        ];

        function getRecord(action){
            return user.records.find(r => r.action === action);
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

                            \${actions.map(a => \`
                                <td>
                                    \${getRecord(a)
                                        ? "<span class='done'>已完成</span>"
                                        : "<span class='empty'>未完成</span>"
                                    }
                                </td>
                            \`).join("")}
                        </tr>

                        <tr>
                            <th>Godspeed</th>

                            \${actions.map(a => \`
                                <td>
                                    \${getRecord(a)
                                        ? "<span class='done'>已完成</span>"
                                        : "<span class='empty'>未完成</span>"
                                    }
                                </td>
                            \`).join("")}
                        </tr>

                        <tr>
                            <th>Mind</th>

                            \${actions.map(a => \`
                                <td>
                                    \${getRecord(a)
                                        ? "<span class='done'>已完成</span>"
                                        : "<span class='empty'>未完成</span>"
                                    }
                                </td>
                            \`).join("")}
                        </tr>

                    </tbody>

                </table>

                <h3>每题作答详情</h3>

                \${actions.map(action => actionDetails(action)).join("")}

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

    if(!confirm("确定删除该受试者的全部数据吗？")){
        return;
    }

    await fetch(
        "/api/delete/" + encodeURIComponent(userCode),
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
