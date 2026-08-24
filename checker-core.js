const TIER_META = {
    unplayable: { label: "\uD83D\uDD34 Won't Run Well", cls: "not-recommended" },
    low: { label: "\uD83D\uDFE1 Low Settings", cls: "playable" },
    medium: { label: "\uD83D\uDFE1 Medium Settings", cls: "playable" },
    high: { label: "\uD83D\uDFE2 High Settings", cls: "good" },
    ultra: { label: "\uD83D\uDFE2 Ultra Settings", cls: "good" }
};

function roundTo5(n) {
    return Math.round(n / 5) * 5;
}

function computeVerdict(game, rig) {
    const cpuRatio = rig.cpuScore / game.recCpu;
    const gpuRatio = rig.gpuScore / game.recGpu;
    let margin = Math.min(cpuRatio, gpuRatio);

    const ramBelowMin = rig.ram < game.minRam;
    const ramBelowRec = rig.ram < game.recRam;
    const cpuBelowMin = rig.cpuScore < game.minCpu;
    const gpuBelowMin = rig.gpuScore < game.minGpu;
    const meetsMin = !ramBelowMin && !cpuBelowMin && !gpuBelowMin;

    if (ramBelowRec) {
        margin = Math.min(margin, 0.99);
    }

    let tier;
    if (!meetsMin) {
        tier = "unplayable";
    } else if (margin >= 2.6) {
        tier = "ultra";
    } else if (margin >= 1.6) {
        tier = "high";
    } else if (margin >= 1) {
        tier = "medium";
    } else {
        tier = "low";
    }

    let fpsLow = null;
    let fpsHigh = null;

    if (meetsMin) {
        const effective = Math.min(gpuRatio, cpuRatio * 1.2);
        const fps = Math.max(15, Math.min(game.baseFps * Math.pow(effective, 0.9), 300));
        fpsLow = roundTo5(fps * 0.75);
        fpsHigh = roundTo5(fps * 1.2);
        if (fpsLow < 15) fpsLow = 15;
    }

    return {
        meetsMin: meetsMin,
        ramBelowRec: ramBelowRec,
        ramBelowMin: ramBelowMin,
        cpuBelowMin: cpuBelowMin,
        gpuBelowMin: gpuBelowMin,
        margin: margin,
        tier: tier,
        tierLabel: TIER_META[tier].label,
        tierClass: TIER_META[tier].cls,
        fpsLow: fpsLow,
        fpsHigh: fpsHigh
    };
}

function findUpgrades(game, rig, cpus, gpus) {
    const tips = [];

    if (rig.ram < game.minRam) {
        tips.push("Add RAM \u2014 you need at least " + game.minRam + " GB (you have " + rig.ram + " GB)");
    } else if (rig.ram < game.recRam) {
        tips.push("More RAM helps \u2014 recommended is " + game.recRam + " GB");
    }

    if (rig.cpuScore < game.recCpu) {
        const options = Object.keys(cpus)
            .filter(function (name) { return cpus[name] >= game.recCpu; })
            .sort(function (a, b) { return cpus[a] - cpus[b]; })
            .slice(0, 2);
        if (options.length) {
            tips.push("Stronger CPU would help: " + options.join(" or "));
        }
    }

    if (rig.gpuScore < game.recGpu) {
        const options = Object.keys(gpus)
            .filter(function (name) { return gpus[name] >= game.recGpu; })
            .sort(function (a, b) { return gpus[a] - gpus[b]; })
            .slice(0, 2);
        if (options.length) {
            tips.push("Stronger GPU would help: " + options.join(" or "));
        }
    }

    return tips;
}

if (typeof module !== "undefined") {
    module.exports = {
        computeVerdict: computeVerdict,
        findUpgrades: findUpgrades,
        TIER_META: TIER_META
    };
}
