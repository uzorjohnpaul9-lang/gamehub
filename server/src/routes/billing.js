const express = require("express");
const db = require("../db.js");
const { requireAuth, requireDb } = require("../auth.js");
const { requireAdminKey } = require("./admin.js");

const router = express.Router();

router.post("/checkout", requireDb, requireAuth, function (req, res) {
    if (process.env.PLUS_ENABLED !== "true") {
        return res.status(503).json({
            error: "Payments are not active yet",
            note: "GameHub Plus launches once the site reaches stable traffic. You will keep any founding-member perks granted before then."
        });
    }

    return res.status(501).json({
        error: "Payment provider not wired yet",
        note: "Stripe (international) and Paystack (Nigeria) integration is planned. This endpoint will create a real checkout session."
    });
});

router.post("/grant-plus", requireAdminKey, async function (req, res) {
    if (!db.isDbConfigured) {
        return res.status(503).json({ error: "Needs database" });
    }
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) {
        return res.status(400).json({ error: "email is required" });
    }
    try {
        const result = await db.query(
            "UPDATE users SET plan = 'plus' WHERE email = $1 RETURNING id, email, plan",
            [email]
        );
        if (!result.rows.length) {
            return res.status(404).json({ error: "No user with that email" });
        }
        return res.json({ granted: true, user: result.rows[0] });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Grant failed" });
    }
});

module.exports = router;
