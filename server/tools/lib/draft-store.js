const fs = require("fs");
const path = require("path");

const DRAFTS_DIR = path.join(__dirname, "..", "..", "drafts");

function listDrafts() {
    if (!fs.existsSync(DRAFTS_DIR)) return [];
    return fs.readdirSync(DRAFTS_DIR)
        .filter(function (f) {
            return f.endsWith(".json") && !f.endsWith(".approved.json");
        })
        .map(function (f) {
            try {
                const raw = JSON.parse(
                    fs.readFileSync(path.join(DRAFTS_DIR, f), "utf8")
                );
                raw._file = f;
                return raw;
            } catch (e) {
                return { _file: f, title: "UNREADABLE DRAFT: " + f, status: "corrupt" };
            }
        });
}

function draftPath(appId) {
    return path.join(DRAFTS_DIR, appId + ".json");
}

function approvedPath(appId) {
    return path.join(DRAFTS_DIR, appId + ".approved.json");
}

function validateGameFields(g) {
    const errors = [];

    if (!g.title || !String(g.title).trim()) {
        errors.push("title is required");
    }

    function scoreOk(v) {
        return v === null || v === undefined ||
            (Number.isFinite(v) && v >= 0 && v <= 100);
    }
    ["minCpu", "minGpu", "recCpu", "recGpu"].forEach(function (f) {
        if (!scoreOk(g[f])) errors.push(f + " must be null or 0-100");
    });

    function ramOk(v) {
        return v === null || v === undefined ||
            (Number.isInteger(v) && v >= 1 && v <= 128);
    }
    ["minRam", "recRam"].forEach(function (f) {
        if (!ramOk(g[f])) errors.push(f + " must be null or 1-128 GB");
    });

    if (g.minRam != null && g.recRam != null && g.recRam < g.minRam) {
        errors.push("recRam cannot be lower than minRam");
    }
    if (g.minCpu != null && g.recCpu != null && g.recCpu < g.minCpu) {
        errors.push("recCpu cannot be lower than minCpu");
    }
    if (g.minGpu != null && g.recGpu != null && g.recGpu < g.minGpu) {
        errors.push("recGpu cannot be lower than minGpu");
    }

    if (g.baseFps != null &&
        (!Number.isFinite(g.baseFps) || g.baseFps < 30 || g.baseFps > 300)) {
        errors.push("baseFps must be 30-300");
    }

    const criticalMissing =
        g.minCpu == null || g.recCpu == null ||
        g.minGpu == null || g.recGpu == null ||
        g.minRam == null || g.recRam == null;

    if (criticalMissing) {
        errors.push("cannot approve: fill every requirement field first (min/rec CPU, GPU, RAM)");
    }

    return errors;
}

module.exports = {
    listDrafts: listDrafts,
    draftPath: draftPath,
    approvedPath: approvedPath,
    validateGameFields: validateGameFields
};
