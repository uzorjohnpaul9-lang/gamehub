const express = require("express");
const db = require("../db.js");

const router = express.Router();

router.get("/", function (req, res) {
    const showAds = process.env.SHOW_ADS === "true";
    const plusEnabled = process.env.PLUS_ENABLED === "true";

    res.json({
        showAds: showAds,
        adsClient: showAds ? (process.env.ADSENSE_CLIENT_ID || null) : null,
        fx: {
            usdToNgn: Number(process.env.NGN_PER_USD || 1500)
        },
        plus: {
            enabled: plusEnabled && db.isDbConfigured,
            priceUsd: Number(process.env.PLUS_PRICE_USD || 3),
            perks: [
                "No ads, forever",
                "Unlimited saved rigs in the cloud",
                "Price-drop alerts on your wishlist",
                "Support independent development"
            ]
        }
    });
});

module.exports = router;
