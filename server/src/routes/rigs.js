const express = require("express");
const db = require("../db.js");
const hardware = require("../../../data-hardware.js");
const { buildMatcher } = require("../../tools/lib/parse-requirements.js");
const { requireAuth, requireDb } = require("../auth.js");

const router = express.Router();

const matchCpu = buildMatcher(hardware.cpus);
const matchGpu = buildMatcher(hardware.gpus);

function resolveHardwareName(input, matcher, catalog) {
    const raw = String(input || "").trim();
    if (!raw) return null;
    if (Object.prototype.hasOwnProperty.call(catalog, raw)) return raw;
    const match = matcher(raw);
    return match.confidence === "none" ? null : match.name;
}

function validateRig(body) {
    const name = String(body.name || "My PC").trim().slice(0, 60) || "My PC";
    const cpu = resolveHardwareName(body.cpu, matchCpu, hardware.cpus);
    const gpu = resolveHardwareName(body.gpu, matchGpu, hardware.gpus);
    const ram = Number(body.ram);

    if (!cpu) return { error: "Unknown CPU: " + body.cpu };
    if (!gpu) return { error: "Unknown GPU: " + body.gpu };
    if (!Number.isInteger(ram) || ram < 1 || ram > 128) {
        return { error: "RAM must be a whole number of GB between 1 and 128" };
    }
    return { name: name, cpu: cpu, gpu: gpu, ram: ram };
}

router.get("/", requireDb, requireAuth, async function (req, res) {
    try {
        const result = await db.query(
            "SELECT id, name, cpu, gpu, ram, created_at, updated_at FROM rigs WHERE user_id = $1 ORDER BY created_at",
            [req.userId]
        );
        return res.json({ rigs: result.rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to load rigs" });
    }
});

router.post("/", requireDb, requireAuth, async function (req, res) {
    const check = validateRig(req.body);
    if (check.error) {
        return res.status(400).json({ error: check.error });
    }

    try {
        const result = await db.query(
            "INSERT INTO rigs (user_id, name, cpu, gpu, ram) VALUES ($1, $2, $3, $4, $5) " +
            "ON CONFLICT (user_id, name) DO UPDATE SET cpu = EXCLUDED.cpu, gpu = EXCLUDED.gpu, ram = EXCLUDED.ram, updated_at = now() " +
            "RETURNING id, name, cpu, gpu, ram",
            [req.userId, check.name, check.cpu, check.gpu, check.ram]
        );
        return res.status(201).json({ rig: result.rows[0] });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to save rig" });
    }
});

router.delete("/:id", requireDb, requireAuth, async function (req, res) {
    try {
        const result = await db.query(
            "DELETE FROM rigs WHERE id = $1 AND user_id = $2 RETURNING id",
            [req.params.id, req.userId]
        );
        if (!result.rows.length) {
            return res.status(404).json({ error: "Rig not found" });
        }
        return res.json({ deleted: result.rows[0].id });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to delete rig" });
    }
});

module.exports = router;
