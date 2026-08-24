const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db.js");
const { signToken, requireAuth, requireDb } = require("../auth.js");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/register", requireDb, async function (req, res) {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!EMAIL_RE.test(email)) {
        return res.status(400).json({ error: "Please provide a valid email address" });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        const result = await db.query(
            "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
            [email, hash]
        );
        const user = result.rows[0];
        return res.status(201).json({
            token: signToken(user),
            user: { id: user.id, email: user.email }
        });
    } catch (err) {
        if (err.code === "23505") {
            return res.status(409).json({ error: "That email is already registered" });
        }
        console.error(err);
        return res.status(500).json({ error: "Registration failed" });
    }
});

router.post("/login", requireDb, async function (req, res) {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    try {
        const result = await db.query(
            "SELECT id, email, password_hash FROM users WHERE email = $1",
            [email]
        );
        if (!result.rows.length) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const user = result.rows[0];
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        return res.json({
            token: signToken(user),
            user: { id: user.id, email: user.email }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Login failed" });
    }
});

router.get("/me", requireDb, requireAuth, function (req, res) {
    res.json({ id: req.userId, email: req.userEmail });
});

module.exports = router;
