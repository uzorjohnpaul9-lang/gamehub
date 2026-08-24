const assert = require("assert");
const path = require("path");

process.env.PORT = "";
process.env.DATABASE_URL = "";

const { start } = require(path.join(__dirname, "..", "src", "index.js"));

let passed = 0;
let failed = false;

async function test(name, fn) {
    await fn();
    passed++;
    console.log("PASS:", name);
}

async function req(base, pathname, options) {
    options = options || {};
    options.headers = Object.assign(
        { connection: "close" },
        options.headers || {}
    );
    return fetch(base + pathname, options);
}

const server = start(0);
const port = server.address().port;
const base = "http://127.0.0.1:" + port;

(async function run() {
    try {
        let res = await req(base, "/api/health");
        let body = await res.json();
        await test("health reports ok without db", async () => {
            assert.strictEqual(res.status, 200);
            assert.strictEqual(body.ok, true);
            assert.strictEqual(body.db, "not-configured");
        });

        res = await req(base, "/api/games");
        body = await res.json();
        await test("games endpoint serves bundled fallback", async () => {
            assert.strictEqual(res.status, 200);
            assert.strictEqual(body.source, "bundled");
            assert.ok(body.games.length >= 8);
            const gtaV = body.games.find(function (g) { return g.title === "GTA V"; });
            assert.ok(gtaV && gtaV.recCpu === 26);
        });

        res = await req(base, "/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "a@b.com", password: "secret123" })
        });
        await test("auth returns 503 when db unconfigured", async () => {
            assert.strictEqual(res.status, 503);
        });

        res = await req(base, "/");
        const html = await res.text();
        await test("static frontend served at root", async () => {
            assert.strictEqual(res.status, 200);
            assert.ok(html.includes("Welcome to GameHub"));
            assert.ok(html.includes("script.js"));
        });

        res = await req(base, "/api/nonexistent");
        await test("api 404 is json", async () => {
            assert.strictEqual(res.status, 404);
            body = await res.json();
            assert.strictEqual(body.error, "Not found");
        });

        console.log("\nAll " + passed + " API tests passed.");
    } catch (err) {
        failed = true;
        console.error("FAIL:", err.message);
    }

    process.exitCode = failed ? 1 : 0;

    setTimeout(function () {
        console.log("Warning: graceful close timed out, forcing exit.");
        process.exit(process.exitCode);
    }, 3000).unref();

    server.close(function () {
        console.log("Server closed - exiting naturally.");
    });
})();
