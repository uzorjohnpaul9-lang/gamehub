const express = require("express");
const db = require("../db.js");
const bundledGames = require("../../../data-games.js");

const router = express.Router();

function slugify(title) {
    return String(title).toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function escapeHtml(text) {
    return String(text == null ? "" : text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

async function loadAllGames() {
    if (db.isDbConfigured) {
        try {
            const result = await db.query(
                "SELECT title, rating, min_ram, rec_ram, min_cpu, min_gpu, rec_cpu, rec_gpu, base_fps, steam_app_id FROM games WHERE status = 'live' ORDER BY title"
            );
            if (result.rows.length) {
                return result.rows.map(function (r) {
                    return {
                        title: r.title,
                        minRam: r.min_ram, recRam: r.rec_ram,
                        minCpu: r.min_cpu, minGpu: r.min_gpu,
                        recCpu: r.rec_cpu, recGpu: r.rec_gpu,
                        baseFps: r.base_fps, steamAppId: r.steam_app_id
                    };
                });
            }
        } catch (err) {
            console.error("SEO game load failed:", err.message);
        }
    }
    return Object.keys(bundledGames.games).map(function (title) {
        const g = bundledGames.games[title];
        return {
            title: title,
            minRam: g.minRam, recRam: g.recRam,
            minCpu: g.minCpu, minGpu: g.minGpu,
            recCpu: g.recCpu, recGpu: g.recGpu,
            baseFps: g.baseFps, steamAppId: null
        };
    });
}

function baseUrl(req) {
    return process.env.PUBLIC_BASE_URL ||
        (req.protocol + "://" + req.get("host"));
}

function reqRow(label, ram, cpu, gpu) {
    return "<tr><th>" + label + "</th><td>" +
        (ram != null ? ram + " GB RAM" : "\u2014") + "</td><td>" +
        (cpu != null ? "CPU tier " + cpu : "\u2014") + "</td><td>" +
        (gpu != null ? "GPU tier " + gpu : "\u2014") + "</td></tr>";
}

function renderGamePage(game, req, allTitles) {
    const url = baseUrl(req) + "/g/" + slugify(game.title);
    const description = "Can your PC run " + game.title + "? Minimum and recommended system requirements" +
        ", estimated FPS at 1080p, and an instant compatibility verdict on GameHub.";

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "VideoGame",
        name: game.title,
        url: url,
        gamePlatform: "PC",
        applicationCategory: "Game"
    };

    const others = allTitles.filter(function (t) { return t !== game.title; }).slice(0, 12);

    return "<!DOCTYPE html><html lang=\"en\"><head>" +
        "<meta charset=\"UTF-8\">" +
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
        "<title>Can I run " + escapeHtml(game.title) + " on PC? Requirements &amp; FPS estimate | GameHub</title>" +
        "<meta name=\"description\" content=\"" + escapeHtml(description) + "\">" +
        "<link rel=\"canonical\" href=\"" + url + "\">" +
        "<meta property=\"og:title\" content=\"" + escapeHtml(game.title) + " system requirements\">" +
        "<meta property=\"og:description\" content=\"" + escapeHtml(description) + "\">" +
        "<meta property=\"og:type\" content=\"website\">" +
        "<script type=\"application/ld+json\">" + JSON.stringify(jsonLd) + "</scr" + "ipt>" +
        "<link rel=\"stylesheet\" href=\"/style.css\">" +
        "</head><body>" +
        "<h1>Can I run " + escapeHtml(game.title) + "?</h1>" +
        "<p class=\"seo-lead\">Check the system requirements below, then get an instant verdict for your exact hardware.</p>" +
        "<table class=\"req-table\">" +
        "<tr><th></th><th>RAM</th><th>CPU</th><th>GPU</th></tr>" +
        reqRow("Minimum", game.minRam, game.minCpu, game.minGpu) +
        reqRow("Recommended", game.recRam, game.recCpu, game.recGpu) +
        "</table>" +
        (game.baseFps ?
            "<p>On recommended hardware expect roughly <strong>~" + game.baseFps +
            " FPS at 1080p</strong>.</p>" : "") +
        "<p><a class=\"cta-button\" href=\"/\">Check my PC against " + escapeHtml(game.title) + " \u2192</a></p>" +
        (game.steamAppId ?
            "<p><a href=\"https://store.steampowered.com/app/" + Number(game.steamAppId) +
            "\" rel=\"noopener\" target=\"_blank\">View on Steam</a></p>" : "") +
        "<h2>More games to check</h2><ul class=\"seo-links\">" +
        others.map(function (t) {
            return "<li><a href=\"/g/" + slugify(t) + "\">Can I run " + escapeHtml(t) + "?</a></li>";
        }).join("") +
        "</ul>" +
        "<footer><a href=\"/\">GameHub home</a></footer>" +
        "</body></html>";
}

router.get("/g/:slug", async function (req, res) {
    const games = await loadAllGames();
    const match = games.find(function (g) {
        return slugify(g.title) === req.params.slug;
    });
    if (!match) {
        return res.status(404).send("<h1>404</h1><p>No such game page.</p><a href='/'>Back to GameHub</a>");
    }
    res.set("Cache-Control", "public, max-age=600");
    return res.send(renderGamePage(
        match, req,
        games.map(function (g) { return g.title; })
    ));
});

router.get("/sitemap.xml", async function (req, res) {
    const games = await loadAllGames();
    const base = baseUrl(req);
    const urls = [base + "/"].concat(games.map(function (g) {
        return base + "/g/" + slugify(g.title);
    }));
    const xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
        "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">" +
        urls.map(function (u) {
            return "<url><loc>" + u + "</loc></url>";
        }).join("") +
        "</urlset>";
    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=3600");
    return res.send(xml);
});

router.get("/robots.txt", function (req, res) {
    res.set("Content-Type", "text/plain");
    return res.send("User-agent: *\nAllow: /\n\nSitemap: " + baseUrl(req) + "/sitemap.xml\n");
});

module.exports = { router: router, slugify: slugify };
