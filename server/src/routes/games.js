const express = require("express");
const path = require("path");
const db = require("../db.js");
const bundledGames = require("../../../data-games.js");

const router = express.Router();

function toFrontendShape(row) {
    return {
        steamAppId: row.steam_app_id || null,
        title: row.title,
        rating: row.rating,
        compatibility: row.compatibility,
        minRam: row.min_ram,
        recRam: row.rec_ram,
        minCpu: row.min_cpu,
        minGpu: row.min_gpu,
        recCpu: row.rec_cpu,
        recGpu: row.rec_gpu,
        baseFps: row.base_fps,
        imageUrl: row.image_url || null,
        price: row.price || null,
        isFree: row.is_free
    };
}

function bundledList() {
    return Object.keys(bundledGames.games).map(function (title) {
        const g = bundledGames.games[title];
        return {
            steamAppId: null,
            title: title,
            rating: g.rating,
            compatibility: g.compatibility,
            minRam: g.minRam,
            recRam: g.recRam,
            minCpu: g.minCpu,
            minGpu: g.minGpu,
            recCpu: g.recCpu,
            recGpu: g.recGpu,
            baseFps: g.baseFps,
            imageUrl: null,
            price: null,
            isFree: false
        };
    });
}

router.get("/", async function (req, res) {
    if (!db.isDbConfigured) {
        return res.json({ source: "bundled", games: bundledList() });
    }
    try {
        const result = await db.query(
            "SELECT * FROM games WHERE status = 'live' ORDER BY title"
        );
        return res.json({
            source: "database",
            games: result.rows.map(toFrontendShape)
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to load games" });
    }
});

module.exports = router;
