(function (root, factory) {
    if (typeof module !== "undefined" && module.exports) {
        module.exports = factory();
    } else {
        root.ModsCore = factory();
    }
})(typeof self !== "undefined" ? self : this, function () {

    function validateModPayload(body) {
        const errors = [];

        if (!body.gameTitle || !String(body.gameTitle).trim()) {
            errors.push("gameTitle is required");
        }
        if (!body.name || !String(body.name).trim()) {
            errors.push("name is required");
        }

        const ramAdd = Number(body.ramAddGb || 0);
        if (!Number.isInteger(ramAdd) || ramAdd < 0 || ramAdd > 64) {
            errors.push("ramAddGb must be an integer 0-64");
        }

        const cpuMult = Number(body.cpuMultiplier || 1);
        if (!(cpuMult >= 1 && cpuMult <= 4)) {
            errors.push("cpuMultiplier must be 1.0-4.0");
        }

        const gpuMult = Number(body.gpuMultiplier || 1);
        if (!(gpuMult >= 1 && gpuMult <= 4)) {
            errors.push("gpuMultiplier must be 1.0-4.0");
        }

        const fpsMult = Number(body.fpsMultiplier === undefined ? 1 : body.fpsMultiplier);
        if (!(fpsMult > 0.05 && fpsMult <= 1)) {
            errors.push("fpsMultiplier must be 0.05-1.0");
        }

        if (body.url && !/^https?:\/\//i.test(String(body.url))) {
            errors.push("url must start with http(s)://");
        }

        const vtStatus = body.vtStatus || "pending";
        if (["pending", "clean", "flagged"].indexOf(vtStatus) === -1) {
            errors.push("vtStatus must be pending | clean | flagged");
        }

        if (body.sha256Checksum &&
            !/^[a-f0-9]{64}$/i.test(String(body.sha256Checksum).trim())) {
            errors.push("sha256Checksum must be a 64-character hex string");
        }

        const mod = {
            gameTitle: String(body.gameTitle || "").trim(),
            name: String(body.name || "").trim(),
            author: body.author ? String(body.author).trim() : null,
            version: body.version ? String(body.version).trim() : null,
            url: body.url ? String(body.url).trim() : null,
            description: body.description ? String(body.description).slice(0, 2000) : null,
            ramAddGb: ramAdd,
            cpuMultiplier: cpuMult,
            gpuMultiplier: gpuMult,
            fpsMultiplier: fpsMult,
            sha256Checksum: body.sha256Checksum ? String(body.sha256Checksum).trim().toLowerCase() : null,
            fileSizeMb: body.fileSizeMb != null ? Number(body.fileSizeMb) : null,
            vtStatus: vtStatus,
            vtReportUrl: body.vtReportUrl ? String(body.vtReportUrl).trim() : null
        };

        return { errors: errors, mod: mod };
    }

    function applyModToGame(game, mod) {
        return {
            rating: game.rating,
            compatibility: game.compatibility,
            minRam: game.minRam != null ? game.minRam + (mod.ramAddGb || 0) : null,
            recRam: game.recRam != null ? game.recRam + (mod.ramAddGb || 0) : null,
            minCpu: game.minCpu != null ? Math.round(game.minCpu * (mod.cpuMultiplier || 1) * 10) / 10 : null,
            recCpu: game.recCpu != null ? Math.round(game.recCpu * (mod.cpuMultiplier || 1) * 10) / 10 : null,
            minGpu: game.minGpu != null ? Math.round(game.minGpu * (mod.gpuMultiplier || 1) * 10) / 10 : null,
            recGpu: game.recGpu != null ? Math.round(game.recGpu * (mod.gpuMultiplier || 1) * 10) / 10 : null,
            baseFps: game.baseFps != null ?
                Math.max(5, Math.round(game.baseFps * (mod.fpsMultiplier || 1))) : null
        };
    }

    function describeImpact(mod) {
        const parts = [];
        if (mod.cpuMultiplier > 1) parts.push("CPU +" + Math.round((mod.cpuMultiplier - 1) * 100) + "%");
        if (mod.gpuMultiplier > 1) parts.push("GPU +" + Math.round((mod.gpuMultiplier - 1) * 100) + "%");
        if (mod.ramAddGb > 0) parts.push("RAM +" + mod.ramAddGb + " GB");
        if (mod.fpsMultiplier < 1) parts.push("FPS \u00d7" + mod.fpsMultiplier.toFixed(2));
        return parts.length ? parts.join(", ") : "negligible performance impact";
    }

    return {
        validateModPayload: validateModPayload,
        applyModToGame: applyModToGame,
        describeImpact: describeImpact
    };
});
