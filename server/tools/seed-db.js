require("dotenv").config();

const db = require("../src/db.js");
const bundled = require("../../data-games.js");

async function seed() {
    if (!db.isDbConfigured) {
        console.error("DATABASE_URL is not set. Add it to server/.env first.");
        process.exit(1);
    }

    const titles = Object.keys(bundled.games);
    let inserted = 0;

    for (const title of titles) {
        const g = bundled.games[title];
        await db.query(
            "INSERT INTO games (title, rating, compatibility, min_ram, rec_ram, min_cpu, min_gpu, rec_cpu, rec_gpu, base_fps) " +
            "VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) " +
            "ON CONFLICT (title) DO UPDATE SET " +
            "rating = EXCLUDED.rating, compatibility = EXCLUDED.compatibility, " +
            "min_ram = EXCLUDED.min_ram, rec_ram = EXCLUDED.rec_ram, " +
            "min_cpu = EXCLUDED.min_cpu, min_gpu = EXCLUDED.min_gpu, " +
            "rec_cpu = EXCLUDED.rec_cpu, rec_gpu = EXCLUDED.rec_gpu, base_fps = EXCLUDED.base_fps",
            [title, g.rating, g.compatibility, g.minRam, g.recRam,
                g.minCpu, g.minGpu, g.recCpu, g.recGpu, g.baseFps]
        );
        inserted++;
    }

    console.log("Seeded " + inserted + " games.");
    const check = await db.query("SELECT COUNT(*) FROM games");
    console.log("Games table now has " + check.rows[0].count + " rows.");
}

seed()
    .then(function () { process.exit(0); })
    .catch(function (err) {
        console.error("Seed failed: " + err.message);
        process.exit(1);
    });
