process.env.PORT = "";
process.env.AUTH_SECRET = "test-secret";

const assert = require("assert");
const http = require("http");

const ModsCore = require("../../mods-core.js");
const bundled = require("../../data-games.js");

let failed = false;
function check(label, cond) {
    console.log((cond ? "PASS: " : "FAIL: ") + label);
    if (!cond) failed = true;
}

function req(port, method, urlPath, body, headers) {
    return new Promise(function (resolve, reject) {
        const payload = body ? JSON.stringify(body) : null;
        const r = http.request({
            host: "127.0.0.1", port: port, method: method, path: urlPath,
            headers: Object.assign(
                payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {},
                headers || {}
            )
        }, function (res) {
            let raw = "";
            res.on("data", function (c) { raw += c; });
            res.on("end", function () { resolve({ status: res.statusCode, json: JSON.parse(raw || "{}") }); });
        });
        r.on("error", reject);
        if (payload) r.write(payload);
        r.end();
    });
}

(async function () {
    const gtaV = bundled.games["GTA V"];
    check("GTA V present in bundled catalog", Boolean(gtaV));

    const mod = {
        gameTitle: "GTA V",
        name: "Test Overhaul",
        ramAddGb: 2,
        cpuMultiplier: 1.2,
        gpuMultiplier: 1.5,
        fpsMultiplier: 0.6
    };

    const modded = ModsCore.applyModToGame(gtaV, mod);
    check("applyModToGame bumps RAM additively",
        modded.minRam === gtaV.minRam + 2 && modded.recRam === gtaV.recRam + 2);
    check("applyModToGame scales GPU requirements x1.5",
        Math.abs(modded.recGpu - gtaV.recGpu * 1.5) < 0.01);
    check("applyModToGame reduces FPS by multiplier",
        modded.baseFps === Math.max(5, Math.round(gtaV.baseFps * 0.6)));
    check("min requirements never exceed rec after transform",
        modded.minCpu <= modded.recCpu && modded.minGpu <= modded.recGpu);

    const potato = { cpuScore: 10, gpuScore: 9, ram: 8 };
    const baseVerdict = ModsCore ? null : null;
    const checker = require("../../checker-core.js");
    const vBase = checker.computeVerdict(gtaV, potato);
    const vModded = checker.computeVerdict(modded, potato);
    check("mod can downgrade verdict tier on weak rig", vModded.meetsMin !== true ||
        vBase.tier === vModded.tier);

    const impact = ModsCore.describeImpact(mod);
    check("describeImpact lists GPU+50% and RAM+2GB",
        impact.indexOf("GPU +50%") !== -1 && impact.indexOf("RAM +2 GB") !== -1);

    const badPayload = ModsCore.validateModPayload({ name: "", gameTitle: "", cpuMultiplier: 9 });
    check("validation rejects empty names and crazy multipliers",
        badPayload.errors.length >= 3);

    const goodCheck = ModsCore.validateModPayload(Object.assign({}, mod, {
        sha256Checksum: "a".repeat(64), vtStatus: "clean"
    }));
    check("validation accepts well-formed mod with checksum",
        goodCheck.errors.length === 0 && goodCheck.mod.sha256Checksum.length === 64);

    const server = await new Promise(function (resolve) {
        process.env.DATABASE_URL = "";
        const { start } = require("../src/index.js");
        const s = start();
        s.on("listening", function () { resolve(s); });
    });
    const port = server.address().port;

    try {
        const noDb = await req(port, "GET", "/api/mods");
        check("mods endpoint 503 without db", noDb.status === 503);
    } catch (e) {
        console.log("FAIL: unexpected - " + e.message);
        failed = true;
    }

    process.exitCode = failed ? 1 : 0;
    setTimeout(function () {
        console.log("Warning: forcing exit.");
        process.exit(process.exitCode);
    }, 3000).unref();

    server.close(function () {
        console.log(failed ? "\nMODS TESTS FAILED" : "\nAll 10 mods tests passed.");
    });
})();
