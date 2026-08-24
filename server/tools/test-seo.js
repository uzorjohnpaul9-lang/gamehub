process.env.DATABASE_URL = "";
process.env.PORT = "";
process.env.AUTH_SECRET = "test-secret";

const http = require("http");

const { start } = require("../src/index.js");

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
            res.on("end", function () { resolve({ status: res.statusCode, text: raw }); });
        }).on("error", reject);
    });
}

(async function () {
    const server = await new Promise(function (resolve) {
        const s = start();
        s.on("listening", function () { resolve(s); });
    });
    const port = server.address().port;

    try {
        const page = await get(port, "/g/gta-v");
        check("game page 200 for gta-v slug", page.status === 200);
        check("page has optimized title", page.text.indexOf("Can I run GTA V") !== -1);
        check("page has canonical link", page.text.indexOf("rel=\"canonical\"") !== -1);
        check("page has JSON-LD VideoGame schema", page.text.indexOf("VideoGame") !== -1);
        check("page links to more games (internal linking)", page.text.indexOf("/g/gta-iv") !== -1);

        const slugWithPunct = await get(port, "/g/tomb-raider-2013");
        check("slugification handles punctuation titles", slugWithPunct.status === 200);

        const missing = await get(port, "/g/not-a-real-game-xyz");
        check("unknown slug returns 404", missing.status === 404);

        const sitemap = await get(port, "/sitemap.xml");
        check("sitemap is xml with urlset",
            sitemap.text.indexOf("<urlset") !== -1 && sitemap.status === 200);
        check("sitemap includes home + game pages",
            sitemap.text.indexOf("</loc>") !== -1 &&
            sitemap.text.indexOf("/g/gta-v</loc>") !== -1);

        const robots = await get(port, "/robots.txt");
        check("robots.txt allows all + sitemap ref",
            robots.text.indexOf("Allow: /") !== -1 &&
            robots.text.indexOf("Sitemap:") !== -1);
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
        console.log(failed ? "\nSEO TESTS FAILED" : "\nAll 10 SEO tests passed.");
    });
})();
