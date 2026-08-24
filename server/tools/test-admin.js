process.env.ADMIN_KEY = "test-admin-key-123";
process.env.AUTH_SECRET = "test-secret";
process.env.DATABASE_URL = "";

const path = require("path");
const fs = require("fs");
const http = require("http");

const { start } = require("../src/index.js");

let failed = false;
function check(label, cond) {
    if (cond) {
        console.log("PASS: " + label);
    } else {
        console.log("FAIL: " + label);
        failed = true;
    }
}

function request(port, method, urlPath, body, headers) {
    return new Promise(function (resolve, reject) {
        const payload = body ? JSON.stringify(body) : null;
        const req = http.request({
            host: "127.0.0.1",
            port: port,
            method: method,
            path: urlPath,
            headers: Object.assign(
                payload
                    ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
                    : {},
                headers || {}
            )
        }, function (res) {
            let raw = "";
            res.on("data", function (c) { raw += c; });
            res.on("end", function () {
                let parsed = null;
                try { parsed = JSON.parse(raw); } catch (e) {
                    if (raw.indexOf("<html") === -1) parsed = null;
                }
                resolve({ status: res.statusCode, json: parsed, text: raw });
            });
        });
        req.on("error", reject);
        if (payload) req.write(payload);
        req.end();
    });
}

(async function () {
    const server = await new Promise(function (resolve) {
        const s = start();
        s.on("listening", function () { resolve(s); });
    });
    const port = server.address().port;

    try {
        const health = await request(port, "GET", "/api/health");
        check("health ok", health.json && health.json.ok === true);

        const prov = await request(port, "GET", "/api/auth/providers");
        check("providers lists google+passwordDb flags",
            prov.json &&
            typeof prov.json.google === "boolean" &&
            typeof prov.json.passwordDb === "boolean");

        const denied = await request(port, "GET", "/api/admin/drafts");
        check("admin drafts rejected without key", denied.status === 403);

        const wrongKey = await request(port, "GET", "/api/admin/drafts", null,
            { Authorization: "Bearer nope" });
        check("admin drafts rejected with wrong key", wrongKey.status === 403);

        const list = await request(port, "GET", "/api/admin/drafts", null,
            { Authorization: "Bearer test-admin-key-123" });
        check("admin drafts list with valid key", list.status === 200 && Array.isArray(list.json.drafts));

        const tmpAppId = "999999001";
        const draftsDir = path.join(__dirname, "..", "drafts");
        const draftPath = path.join(draftsDir, tmpAppId + ".json");
        const approvedPath = path.join(draftsDir, tmpAppId + ".approved.json");
        fs.writeFileSync(draftPath, JSON.stringify({
            steamAppId: Number(tmpAppId),
            title: "Test Draft Game",
            minRam: null, recRam: null,
            minCpu: null, recCpu: null,
            minGpu: null, recGpu: null,
            baseFps: null,
            status: "draft"
        }));

        const badApprove = await request(port, "POST", "/api/admin/drafts/" + tmpAppId,
            { action: "approve", fields: {} },
            { Authorization: "Bearer test-admin-key-123" });
        check("approve blocked when fields missing",
            badApprove.status === 422 &&
            badApprove.json.errors.some(function (e) { return e.indexOf("fill every requirement") !== -1; }));

        const goodApprove = await request(port, "POST", "/api/admin/drafts/" + tmpAppId,
            {
                action: "approve",
                fields: { minRam: 4, recRam: 8, minCpu: 10, recCpu: 26, minGpu: 8, recGpu: 13, baseFps: 60 }
            },
            { Authorization: "Bearer test-admin-key-123" });
        check("approve succeeds with complete fields",
            goodApprove.status === 200 && goodApprove.json.approved === true);
        check("approval persisted locally when db unconfigured",
            goodApprove.json.persistedToDb === false);

        check("approved file written and draft removed",
            fs.existsSync(approvedPath) && !fs.existsSync(draftPath));

        fs.unlinkSync(approvedPath);

        const adminPage = await request(port, "GET", "/admin/");
        check("admin page served at /admin/", adminPage.text.indexOf("Draft Review") !== -1);
    } catch (e) {
        console.log("FAIL: unexpected error - " + e.message);
        failed = true;
    }

    process.exitCode = failed ? 1 : 0;

    setTimeout(function () {
        console.log("Warning: graceful close timed out, forcing exit.");
        process.exit(process.exitCode);
    }, 3000).unref();

    server.close(function () {
        console.log(failed ? "\nSOME ADMIN TESTS FAILED" : "\nAll 9 admin tests passed.");
    });
})();
