process.env.DATABASE_URL = "";
process.env.PORT = "";
process.env.AUTH_SECRET = "test-secret";

const path = require("path");
const assert = require("assert");
const http = require("http");

const { freeGames } = require("../../data-freegames.js");
const { start } = require("../src/index.js");
const checker = require("../../checker-core.js");

let failed = false;
function check(label, cond) {
    console.log((cond ? "PASS: " : "FAIL: ") + label);
    if (!cond) failed = true;
}

function get(port, urlPath) {
    return new Promise(function (resolve, reject) {
        http.get({ host: "127.0.0.1", port: port, path: urlPath }, function (res) {
            let raw = "";
            res.on("data", function (c) { raw += c; });
            res.on("end", function () {
                resolve({ status: res.statusCode, json: JSON.parse(raw) });
            });
        }).on("error", reject);
    });
}

(async function () {
    const titles = Object.keys(freeGames);
    check("12 free-to-play games curated", titles.length === 12);

    let sane = true;
    titles.forEach(function (t) {
        const g = freeGames[t];
        if (!(g.minCpu <= g.recCpu && g.minGpu <= g.recGpu && g.minRam <= g.recRam)) sane = false;
        [g.minCpu, g.recCpu, g.minGpu, g.recGpu].forEach(function (v) {
            if (v === undefined || v < 0 || v > 100) sane = false;
        });
        if (!g.steamAppId || !(g.baseFps >= 30 && g.baseFps <= 300)) sane = false;
    });
    check("all entries pass score sanity (min<=rec, ranges valid)", sane);

    const potatoRig = { cpuScore: 5, gpuScore: 4, ram: 4 };
    const beastRig = { cpuScore: 90, gpuScore: 80, ram: 32 };

    const brawlVerdictPotato = checker.computeVerdict(freeGames["Brawlhalla"], potatoRig);
    check("Brawlhalla playable even on a potato",
        brawlVerdictPotato.meetsMin && brawlVerdictPotato.tier !== "unplayable");

    const finalsVerdictPotato = checker.computeVerdict(freeGames["THE FINALS"], potatoRig);
    check("THE FINALS flagged below minimum on a potato", !finalsVerdictPotato.meetsMin);

    const cs2Beast = checker.computeVerdict(freeGames["Counter-Strike 2"], beastRig);
    check("CS2 hits high/ultra tier on a strong rig",
        cs2Beast.tier === "high" || cs2Beast.tier === "ultra");

    const server = await new Promise(function (resolve) {
        const s = start();
        s.on("listening", function () { resolve(s); });
    });
    const port = server.address().port;

    try {
        const gw1 = await get(port, "/api/giveaways");
        check("giveaways endpoint returns list shape",
            gw1.status === 200 && Array.isArray(gw1.json.giveaways));
        if (gw1.json.source === "live") {
            const gw2 = await get(port, "/api/giveaways");
            check("second call served from cache", gw2.json.source === "cache");
            if (gw1.json.giveaways.length) {
                const first = gw1.json.giveaways[0];
                check("giveaway items normalized (title+claim url)",
                    typeof first.title === "string" && first.openGiveawayUrl !== undefined);
            }
        } else {
            console.log("SKIP: giveaway provider unreachable (" + gw1.json.source + ")");
        }

        const games = await get(port, "/api/games");
        const bundledHasIsFree = games.json.games.every(function (g) {
            return typeof g.isFree === "boolean";
        });
        check("games payload exposes isFree flag", bundledHasIsFree);
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
        console.log(failed ? "\nFREE-HUB TESTS FAILED" : "\nAll 8 free-hub tests passed.");
    });
})();
