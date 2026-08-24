const express = require("express");
const db = require("../db.js");

const router = express.Router();

const CACHE_TTL_MS = 60 * 60 * 1000;
let cache = { data: null, fetchedAt: 0 };

const GIVEAWAY_API =
    process.env.GIVEAWAY_API_URL || "https://www.gamerpower.com/api/giveaways";
const GIVEAWAY_PLATFORM = process.env.GIVEAWAY_PLATFORM || "pc";

function normalizeGiveaway(g) {
    return {
        id: g.id,
        title: g.title,
        worth: g.worth || "Free",
        platform: g.platforms,
        end: g.end_date,
        image: g.image,
        openGiveawayUrl: g.open_giveaway_url || g.gamerpower_url ||
            (g.id ? "https://www.gamerpower.com/open/" + g.id : null),
        instructions: g.instructions ? String(g.instructions).slice(0, 300) : ""
    };
}

async function fetchLive() {
    const res = await fetch(GIVEAWAY_API + "?platform=" + GIVEAWAY_PLATFORM + "&sort-by=popularity", {
        headers: { Accept: "application/json" }
    });
    if (!res.ok) {
        throw new Error("Giveaway API responded " + res.status);
    }
    const list = await res.json();
    if (!Array.isArray(list)) {
        throw new Error("Unexpected giveaway payload");
    }
    return list.slice(0, 12).map(normalizeGiveaway);
}

router.get("/", async function (req, res) {
    const fresh = cache.data &&
        (Date.now() - cache.fetchedAt) < CACHE_TTL_MS;

    if (fresh) {
        return res.json({ source: "cache", giveaways: cache.data });
    }

    try {
        const data = await fetchLive();
        cache = { data: data, fetchedAt: Date.now() };
        return res.json({ source: "live", giveaways: data });
    } catch (err) {
        console.error("Giveaway fetch failed:", err.message);
        if (cache.data) {
            return res.json({ source: "stale-cache", giveaways: cache.data });
        }
        return res.json({
            source: "unavailable",
            giveaways: [],
            note: "Could not reach giveaway provider - try again later"
        });
    }
});

module.exports = router;
