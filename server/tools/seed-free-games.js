require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");

const db = require("../src/db.js");
const { freeGames } = require("../../data-freegames.js");

async function seed() {
    if (!db.isDbConfigured) {
        console.error("DATABASE_URL is not set. Add it to server/.env first.");
        process.exit(1);
    }

    const schema = fs.readFileSync(path.join(__dirname, "..", "src", "schema.sql"), "utf8");
    await db.query(schema);

    const titles = Object.keys(freeGames);
    let inserted = 0;

    for (const title of titles) {
        const g = freeGames[title];
        await db.query(
            "INSERT INTO games (steam_app_id, title, rating, compatibility, min_ram, rec_ram, min_cpu, min_gpu, rec_cpu, rec_gpu, base_fps, is_free, status) " +
            "VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,'live') " +
            "ON CONFLICT (title) DO UPDATE SET " +
            "steam_app_id = EXCLUDED.steam_app_id, rating = EXCLUDED.rating, compatibility = EXCLUDED.compatibility, " +
            "min_ram = EXCLUDED.min_ram, rec_ram = EXCLUDED.rec_ram, min_cpu = EXCLUDED.min_cpu, min_gpu = EXCLUDED.min_gpu, " +
            "rec_cpu = EXCLUDED.rec_cpu, rec_gpu = EXCLUDED.rec_gpu, base_fps = EXCLUDED.base_fps, is_free = true",
            [g.steamAppId, title, g.rating, g.compatibility,
                g.minRam, g.recRam, g.minCpu, g.minGpu,
                g.recCpu, g.recGpu, g.baseFps]
        );
        inserted++;
    }

    console.log("Seeded " + inserted + " free-to-play games.");
    const check = await db.query("SELECT COUNT(*) FROM games WHERE is_free");
    console.log("Free games in table: " + check.rows[0].count);
}

seed()
    .then(function () { process.exit(0); })
    .catch(function (err) {
        console.error("Seed failed: " + err.message);
        process.exit(1);
    });
