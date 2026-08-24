const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("../db.js");
const { signToken } = require("../auth.js");

const router = express.Router();

function googleConfigured() {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function redirectUri(req) {
    const base = process.env.PUBLIC_BASE_URL ||
        (req.protocol + "://" + req.get("host"));
    return base + "/api/auth/google/callback";
}

function parseCookies(req) {
    const header = req.headers.cookie || "";
    const out = {};
    header.split(";").forEach(function (part) {
        const idx = part.indexOf("=");
        if (idx > -1) {
            out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
        }
    });
    return out;
}

router.get("/providers", function (req, res) {
    res.json({
        google: googleConfigured(),
        passwordDb: db.isDbConfigured
    });
});

router.get("/google", function (req, res) {
    if (!googleConfigured()) {
        return res.status(503).json({ error: "Google sign-in is not configured on this server" });
    }
    const state = crypto.randomBytes(16).toString("hex");
    res.cookie("gh_oauth_state", state, { httpOnly: true, maxAge: 10 * 60 * 1000 });
    const url = "https://accounts.google.com/o/oauth2/v2/auth?" +
        "client_id=" + encodeURIComponent(process.env.GOOGLE_CLIENT_ID) +
        "&redirect_uri=" + encodeURIComponent(redirectUri(req)) +
        "&response_type=code" +
        "&scope=" + encodeURIComponent("openid email profile") +
        "&state=" + encodeURIComponent(state);
    res.redirect(url);
});

router.get("/google/callback", async function (req, res) {
    if (!googleConfigured()) {
        return res.status(503).send("Google sign-in is not configured");
    }

    const code = req.query.code;
    const state = req.query.state;
    const cookies = parseCookies(req);
    if (!code || !state || state !== cookies.gh_oauth_state) {
        return res.status(400).send("OAuth state mismatch - try signing in again");
    }
    res.clearCookie("gh_oauth_state");

    let tokens;
    try {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code: String(code),
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: redirectUri(req),
                grant_type: "authorization_code"
            })
        });
        tokens = await tokenRes.json();
    } catch (e) {
        return res.status(502).send("Could not reach Google");
    }

    if (!tokens.id_token) {
        return res.status(401).send("Google did not return an identity token");
    }

    let claims;
    try {
        claims = JSON.parse(
            Buffer.from(tokens.id_token.split(".")[1], "base64url").toString("utf8")
        );
    } catch (e) {
        return res.status(401).send("Invalid identity token from Google");
    }

    if (!claims.email || claims.aud !== process.env.GOOGLE_CLIENT_ID) {
        return res.status(401).send("Identity token rejected");
    }

    try {
        const email = String(claims.email).toLowerCase();
        const sub = String(claims.sub);

        const existing = await db.query(
            "SELECT id, email FROM users WHERE oauth_sub = $1 OR email = $2",
            [sub, email]
        );

        let user;
        if (existing.rows.length) {
            user = existing.rows[0];
            await db.query(
                "UPDATE users SET oauth_sub = $1 WHERE id = $2 AND oauth_sub IS NULL",
                [sub, user.id]
            );
        } else {
            const randomPassword = crypto.randomBytes(24).toString("hex");
            const hash = await bcrypt.hash(randomPassword, 10);
            const inserted = await db.query(
                "INSERT INTO users (email, password_hash, provider, oauth_sub) VALUES ($1,$2,'google',$3) RETURNING id, email",
                [email, hash, sub]
            );
            user = inserted.rows[0];
        }

        const jwt = signToken(user);
        return res.redirect("/auth.html#token=" + encodeURIComponent(jwt));
    } catch (err) {
        console.error(err);
        return res.status(500).send("Sign-in failed");
    }
});

module.exports = router;
