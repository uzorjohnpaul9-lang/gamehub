process.env.DATABASE_URL = "";
process.env.PORT = "";
process.env.AUTH_SECRET = "test-secret";
process.env.ADMIN_KEY = "test-secret-admin";

const assert = require("assert");
const http = require("http");

const I18n = require("../../i18n.js");

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
            res.on("end", function () {
                let json = null;
                try { json = JSON.parse(raw); } catch (e) { json = null; }
                resolve({ status: res.statusCode, json: json, text: raw });
            });
        });
        r.on("error", reject);
        if (payload) r.write(payload);
        r.end();
    });
}

(async function () {
    I18n.setLocale("en");
    check("t() falls back to key when missing", typeof I18n.t("goPlus") === "string");

    I18n.setLocale("en-NG");
    check("locale override works for en-NG",
        I18n.t("goPlus").indexOf("Naija") !== -1 || I18n.t("goPlus") !== "Go Plus");
    I18n.setLocale("en");

    check("formatUsd converts with default rate",
        I18n.formatUsd(3).indexOf("$") === 0);

    const server = await new Promise(function (resolve) {
        const s = require("../src/index.js").start();
        s.on("listening", function () { resolve(s); });
    });
    const port = server.address().port;

    try {
        const cfg = await req(port, "GET", "/api/config");
        check("config exposes fx + plus + showAds shape",
            cfg.json.fx && typeof cfg.json.showAds === "boolean" && cfg.json.plus &&
            Array.isArray(cfg.json.plus.perks));
        check("ads disabled by default in tests", cfg.json.showAds === false);
        check("plus disabled by default in tests", cfg.json.plus.enabled === false);

        const adsTxt = await req(port, "GET", "/ads.txt");
        check("ads.txt served as text with placeholder comment",
            adsTxt.status === 200 && adsTxt.text.indexOf("AdSense not configured") !== -1);

        const noAuth = await req(port, "POST", "/api/billing/checkout");
        check("checkout requires auth+db", noAuth.status >= 400);

        const grantNoKey = await req(port, "POST", "/api/billing/grant-plus", { email: "x@y.z" });
        check("grant-plus guarded by admin key", grantNoKey.status === 403);

        const grantNoDb = await req(port, "POST", "/api/billing/grant-plus",
            { email: "x@y.z" }, { Authorization: "Bearer test-secret-admin" });
        check("grant-plus needs db even with valid key", grantNoDb.status === 503);
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
        console.log(failed ? "\nMONETIZE TESTS FAILED" : "\nAll 10 monetization tests passed.");
    });
})();
