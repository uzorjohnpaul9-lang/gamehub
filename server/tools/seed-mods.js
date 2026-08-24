require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");

const db = require("../src/db.js");
const { validateModPayload } = require("../../mods-core.js");

const demoMods = [
    {
        gameTitle: "GTA V",
        name: "NaturalVision Evolved",
        author: "Razed Modding Team",
        version: "latest public build",
        url: "https://nve.mod",
        description: "Photorealistic graphics overhaul: new lighting, weather, and world textures.",
        ramAddGb: 2,
        cpuMultiplier: 1.15,
        gpuMultiplier: 1.5,
        fpsMultiplier: 0.65,
        vtStatus: "clean"
    },
    {
        gameTitle: "GTA V",
        name: "FiveM (multiplayer client)",
        author: "Cfx.re Team",
        version: "current",
        url: "https://fivem.net",
        description: "Community multiplayer platform with custom servers. Heavier on CPU due to server scripting.",
        ramAddGb: 4,
        cpuMultiplier: 1.3,
        gpuMultiplier: 1.05,
        fpsMultiplier: 0.85,
        vtStatus: "clean"
    },
    {
        gameTitle: "Far Cry 4",
        name: "Ultra HD Texture Overhaul",
        author: "community",
        version: "1.0",
        description: "Replaces environment and character textures with 4K variants.",
        ramAddGb: 2,
        cpuMultiplier: 1.0,
        gpuMultiplier: 1.4,
        fpsMultiplier: 0.75,
        vtStatus: "pending"
    },
    {
        gameTitle: "Grand Theft Auto IV",
        name: "iCEnhancer",
        author: "IceEnhancer team",
        version: "legacy",
        description: "Classic ENB-style visual enhancement. Notoriously heavy for its era.",
        ramAddGb: 1,
        cpuMultiplier: 1.2,
        gpuMultiplier: 1.6,
        fpsMultiplier: 0.6,
        vtStatus: "pending"
    }
];

async function seed() {
    if (!db.isDbConfigured) {
        console.error("DATABASE_URL is not set.");
        process.exit(1);
    }

    const schema = fs.readFileSync(path.join(__dirname, "..", "src", "schema.sql"), "utf8");
    await db.query(schema);

    let saved = 0;
    for (const m of demoMods) {
        const { errors, mod } = validateModPayload(m);
        if (errors.length) {
            console.error("Skipping invalid mod '" + m.name + "':", errors.join(" | "));
            continue;
        }
        await db.query(
            "INSERT INTO mods (game_title, name, author, version, url, description, ram_add_gb, cpu_multiplier, gpu_multiplier, fps_multiplier, vt_status) " +
            "VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) " +
            "ON CONFLICT (game_title, name) DO UPDATE SET " +
            "author = EXCLUDED.author, version = EXCLUDED.version, url = EXCLUDED.url, description = EXCLUDED.description, " +
            "ram_add_gb = EXCLUDED.ram_add_gb, cpu_multiplier = EXCLUDED.cpu_multiplier, gpu_multiplier = EXCLUDED.gpu_multiplier, " +
            "fps_multiplier = EXCLUDED.fps_multiplier, vt_status = EXCLUDED.vt_status, updated_at = now()",
            [mod.gameTitle, mod.name, mod.author, mod.version, mod.url, mod.description,
                mod.ramAddGb, mod.cpuMultiplier, mod.gpuMultiplier, mod.fpsMultiplier, mod.vtStatus]
        );
        saved++;
    }

    console.log("Seeded " + saved + " mods.");
    const check = await db.query("SELECT COUNT(*) FROM mods");
    console.log("Mods table now has " + check.rows[0].count + " rows.");
}

seed()
    .then(function () { process.exit(0); })
    .catch(function (err) {
        console.error("Seed failed: " + err.message);
        process.exit(1);
    });
