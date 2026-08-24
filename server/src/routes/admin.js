const express = require("express");
const fs = require("fs");
const db = require("../db.js");
const store = require("../../tools/lib/draft-store.js");

const router = express.Router();

function requireAdminKey(req, res, next) {
    const expected = process.env.ADMIN_KEY;
    if (!expected) {
        return res.status(503).json({ error: "Admin disabled - set ADMIN_KEY in server/.env" });
    }
    const header = req.headers.authorization || "";
    const key = header.startsWith("Bearer ") ? header.slice(7) : req.query.key;
    if (key !== expected) {
        return res.status(403).json({ error: "Invalid admin key" });
    }
    next();
}

router.get("/drafts", requireAdminKey, function (req, res) {
    res.json({ drafts: store.listDrafts() });
});

router.post("/drafts/:appId", requireAdminKey, function (req, res) {
    const appId = String(req.params.appId);
    if (!/^\d+$/.test(appId)) {
        return res.status(400).json({ errors: ["appId must be numeric"] });
    }

    const sourcePath = store.draftPath(appId);
    if (!fs.existsSync(sourcePath)) {
        return res.status(404).json({ errors: ["Draft not found for app " + appId] });
    }

    let draft;
    try {
        draft = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
    } catch (e) {
        return res.status(500).json({ errors: ["Draft file is not valid JSON"] });
    }

    const action = req.body.action || "save";

    if (action === "save") {
        Object.assign(draft, req.body.fields || {});
        fs.writeFileSync(sourcePath, JSON.stringify(draft, null, 4));
        return res.json({ saved: true, draft: draft });
    }

    if (action === "approve") {
        Object.assign(draft, req.body.fields || {});

        const errors = store.validateGameFields(draft);
        if (errors.length) {
            return res.status(422).json({ errors: errors });
        }

        if (db.isDbConfigured) {
            db.query(
                "INSERT INTO games (steam_app_id, title, rating, compatibility, min_ram, rec_ram, min_cpu, min_gpu, rec_cpu, rec_gpu, base_fps, image_url, price, is_free, status) " +
                "VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'live') " +
                "ON CONFLICT (title) DO UPDATE SET " +
                "steam_app_id = EXCLUDED.steam_app_id, rating = EXCLUDED.rating, compatibility = EXCLUDED.compatibility, " +
                "min_ram = EXCLUDED.min_ram, rec_ram = EXCLUDED.rec_ram, min_cpu = EXCLUDED.min_cpu, min_gpu = EXCLUDED.min_gpu, " +
                "rec_cpu = EXCLUDED.rec_cpu, rec_gpu = EXCLUDED.rec_gpu, base_fps = EXCLUDED.base_fps, image_url = EXCLUDED.image_url, " +
                "price = EXCLUDED.price, is_free = EXCLUDED.is_free, status = 'live', updated_at = now()",
                [draft.steamAppId, draft.title, draft.rating, draft.compatibility,
                    draft.minRam, draft.recRam, draft.minCpu, draft.minGpu,
                    draft.recCpu, draft.recGpu, draft.baseFps,
                    draft.imageUrl || null, draft.price || null,
                    Boolean(draft.isFree)]
            ).catch(function (err) {
                console.error("Approve DB write failed:", err.message);
            });
        }

        fs.writeFileSync(store.approvedPath(appId), JSON.stringify(draft, null, 4));
        fs.unlinkSync(sourcePath);

        return res.json({
            approved: true,
            persistedToDb: db.isDbConfigured,
            title: draft.title
        });
    }

    return res.status(400).json({ errors: ["Unknown action: " + action] });
});

module.exports = router;
