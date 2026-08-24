const express = require("express");
const db = require("../db.js");
const { validateModPayload } = require("../../../mods-core.js");
const { requireAdminKey } = require("./admin.js");

const router = express.Router();

function toFrontendShape(row) {
    return {
        id: row.id,
        gameTitle: row.game_title,
        name: row.name,
        author: row.author,
        version: row.version,
        url: row.url,
        description: row.description,
        ramAddGb: row.ram_add_gb,
        cpuMultiplier: row.cpu_multiplier,
        gpuMultiplier: row.gpu_multiplier,
        fpsMultiplier: row.fps_multiplier,
        sha256Checksum: row.sha256_checksum,
        fileSizeMb: row.file_size_mb,
        vtStatus: row.vt_status,
        vtReportUrl: row.vt_report_url,
        lastScannedAt: row.last_scanned_at
    };
}

router.get("/", async function (req, res) {
    if (!db.isDbConfigured) {
        return res.status(503).json({ error: "Mods hub needs the database" });
    }
    try {
        const gameFilter = req.query.game;
        const params = [];
        let where = "status = 'live'";
        if (gameFilter) {
            params.push(String(gameFilter));
            where += " AND game_title = $1";
        }
        const result = await db.query(
            "SELECT * FROM mods WHERE " + where + " ORDER BY game_title, name",
            params
        );
        return res.json({
            source: "database",
            mods: result.rows.map(toFrontendShape)
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to load mods" });
    }
});

router.post("/", requireAdminKey, async function (req, res) {
    const { errors, mod } = validateModPayload(req.body || {});
    if (errors.length) {
        return res.status(422).json({ errors: errors });
    }

    try {
        const exists = await db.query(
            "SELECT 1 FROM games WHERE title = $1",
            [mod.gameTitle]
        );
        if (!exists.rows.length) {
            return res.status(422).json({
                errors: ["gameTitle '" + mod.gameTitle + "' is not in the games catalog"]
            });
        }

        const result = await db.query(
            "INSERT INTO mods (game_title, name, author, version, url, description, ram_add_gb, cpu_multiplier, gpu_multiplier, fps_multiplier, sha256_checksum, file_size_mb, vt_status, vt_report_url, last_scanned_at) " +
            "VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) " +
            "ON CONFLICT (game_title, name) DO UPDATE SET " +
            "author = EXCLUDED.author, version = EXCLUDED.version, url = EXCLUDED.url, description = EXCLUDED.description, " +
            "ram_add_gb = EXCLUDED.ram_add_gb, cpu_multiplier = EXCLUDED.cpu_multiplier, gpu_multiplier = EXCLUDED.gpu_multiplier, " +
            "fps_multiplier = EXCLUDED.fps_multiplier, sha256_checksum = EXCLUDED.sha256_checksum, file_size_mb = EXCLUDED.file_size_mb, " +
            "vt_status = EXCLUDED.vt_status, vt_report_url = EXCLUDED.vt_report_url, last_scanned_at = EXCLUDED.last_scanned_at, updated_at = now() " +
            "RETURNING id",
            [mod.gameTitle, mod.name, mod.author, mod.version, mod.url, mod.description,
                mod.ramAddGb, mod.cpuMultiplier, mod.gpuMultiplier, mod.fpsMultiplier,
                mod.sha256Checksum, mod.fileSizeMb, mod.vtStatus, mod.vtReportUrl,
                mod.vtStatus === "pending" ? null : new Date()]
        );
        return res.status(201).json({ saved: true, id: result.rows[0].id, mod: mod });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to save mod" });
    }
});

router.delete("/:id", requireAdminKey, async function (req, res) {
    try {
        const result = await db.query(
            "DELETE FROM mods WHERE id = $1 RETURNING id",
            [req.params.id]
        );
        if (!result.rows.length) {
            return res.status(404).json({ error: "Mod not found" });
        }
        return res.json({ deleted: result.rows[0].id });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to delete mod" });
    }
});

module.exports = router;
