const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "..");
const hardware = require(path.join(root, "data-hardware.js"));
const { createParser } = require("./lib/parse-requirements.js");

const STEAM_CENTS_FACTOR = 100;

function estimateBaseFps(recGpuScore) {
    return Math.max(30, Math.min(165, Math.round(40 + recGpuScore * 1.2)));
}

function formatPrice(priceOverview, isFree) {
    if (isFree) return "Free";
    if (!priceOverview) return null;
    return (priceOverview.final / STEAM_CENTS_FACTOR).toFixed(2) +
        " " + (priceOverview.currency || "USD");
}

async function fetchAppDetails(appId) {
    const url = "https://store.steampowered.com/api/appdetails?appids=" +
        appId + "&l=english";
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
        throw new Error("Steam responded with HTTP " + res.status);
    }
    const payload = await res.json();
    const entry = payload && payload[String(appId)];
    if (!entry || !entry.success || !entry.data) {
        throw new Error("No Steam data found for app " + appId);
    }
    return entry.data;
}

async function importGame(appId) {
    const data = await fetchAppDetails(appId);

    if (data.type !== "game") {
        console.log("Warning: Steam lists this as type '" + data.type + "', not 'game'. Continuing anyway.");
    }

    const parseRequirements = createParser(hardware.cpus, hardware.gpus);
    const parsed = parseRequirements(data.pc_requirements || {});

    const recCpuName = parsed.rec.cpu.name;
    const recGpuName = parsed.rec.gpu.name;
    const baseFps = estimateBaseFps(
        recGpuName ? hardware.gpus[recGpuName] : 10
    );

    const draft = {
        steamAppId: Number(appId),
        title: data.name,
        status: "draft",
        importedAt: new Date().toISOString(),
        source: { store: "steam", appId: Number(appId) },
        rating: 4.0,
        compatibility: "medium",
        minRam: parsed.min.ram,
        recRam: parsed.rec.ram,
        minCpu: parsed.min.cpu.name ? hardware.cpus[parsed.min.cpu.name] : null,
        minGpu: parsed.min.gpu.name ? hardware.gpus[parsed.min.gpu.name] : null,
        recCpu: recCpuName ? hardware.cpus[recCpuName] : null,
        recGpu: recGpuName ? hardware.gpus[recGpuName] : null,
        baseFps: baseFps,
        fpsSource: "heuristic",
        imageUrl: data.header_image || null,
        price: formatPrice(data.price_overview, Boolean(data.is_free)),
        isFree: Boolean(data.is_free),
        parsedNames: {
            minCpu: parsed.min.cpu,
            minGpu: parsed.min.gpu,
            recCpu: parsed.rec.cpu,
            recGpu: parsed.rec.gpu
        },
        warnings: parsed.warnings
    };

    return draft;
}

function saveDraft(draft) {
    const draftsDir = path.join(__dirname, "..", "drafts");
    if (!fs.existsSync(draftsDir)) {
        fs.mkdirSync(draftsDir, { recursive: true });
    }
    const file = path.join(draftsDir, draft.steamAppId + ".json");
    fs.writeFileSync(file, JSON.stringify(draft, null, 4));
    return file;
}

function printSummary(draft, file) {
    console.log("\n=== Draft imported ===");
    console.log("Title:     " + draft.title + "  (" + draft.price + ")");
    console.log("Saved to:  " + file);
    console.log("");
    console.log("Scores     min -> rec");
    console.log("  RAM:     " + draft.minRam + " GB -> " + draft.recRam + " GB");
    console.log("  CPU:     " + draft.minCpu + " -> " + draft.recCpu +
        "  [" + (draft.parsedNames.recCpu.confidence) + "]");
    console.log("  GPU:     " + draft.minGpu + " -> " + draft.recGpu +
        "  [" + (draft.parsedNames.recGpu.confidence) + "]");
    console.log("  baseFps: " + draft.baseFps + " (heuristic - review me)");
    console.log("");

    if (draft.warnings.length) {
        console.log("Warnings:");
        draft.warnings.forEach(function (w) {
            console.log("  ! " + w);
        });
        console.log("");
    }
    console.log("Next: review the JSON values, then approve via the admin review page once Phase 2 backend is wired.");
}

async function main() {
    const appId = process.argv[2];

    if (!appId || !/^\d+$/.test(appId)) {
        console.log("Usage: node tools/import-game.js <steamAppId>");
        console.log("Example: node tools/import-game.js 271590");
        process.exit(1);
    }

    try {
        const draft = await importGame(appId);
        const file = saveDraft(draft);
        printSummary(draft, file);
    } catch (err) {
        console.error("Import failed: " + err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { importGame: importGame, estimateBaseFps: estimateBaseFps };
