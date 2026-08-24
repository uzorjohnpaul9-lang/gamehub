require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const path = require("path");
const express = require("express");
const db = require("./db.js");

const authRoutes = require("./routes/auth.js");
const gamesRoutes = require("./routes/games.js");
const rigsRoutes = require("./routes/rigs.js");
const adminRoutes = require("./routes/admin.js");
const oauthRoutes = require("./routes/oauth.js");
const giveawaysRoutes = require("./routes/giveaways.js");
const modsRoutes = require("./routes/mods.js");

const app = express();
app.use(express.json());

app.get("/api/health", function (req, res) {
    res.json({
        ok: true,
        db: db.isDbConfigured ? "configured" : "not-configured",
        time: new Date().toISOString()
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/auth", oauthRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api/rigs", rigsRoutes);
app.use("/api/admin", adminRoutes.router);
app.use("/api/giveaways", giveawaysRoutes);
app.use("/api/mods", modsRoutes);

app.use("/admin", express.static(path.join(__dirname, "..", "public"), { index: "admin.html" }));
app.use(express.static(path.join(__dirname, "..", "..")));

app.use(function (req, res) {
    if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "Not found" });
    }
    return res.sendFile(path.join(__dirname, "..", "..", "index.html"));
});

function start(port) {
    const server = app.listen(port, function () {
        const actual = server.address().port;
        console.log("GameHub server running on http://localhost:" + actual);
        console.log("Database: " + (db.isDbConfigured ? "connected" : "NOT configured - auth disabled, serving bundled games"));
    });
    return server;
}

if (require.main === module) {
    start(process.env.PORT || 3000);
}

module.exports = { app: app, start: start };
