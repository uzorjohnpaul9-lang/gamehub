(function (root, factory) {
    if (typeof module !== "undefined" && module.exports) {
        module.exports = factory();
    } else {
        root.GameHubI18n = factory();
    }
})(typeof self !== "undefined" ? self : this, function () {

    let config = {
        fx: { usdToNgn: 1500 },
        showAds: false,
        plus: { enabled: false, priceUsd: 3, perks: [] }
    };

    const STRINGS = {
        en: {
            checkTitle: "Check Your PC",
            freeGames: "Play Free Now",
            giveaways: "Live Giveaways",
            modsHub: "Mods Hub",
            goPlus: "Go Plus",
            perMonth: "/month"
        },
        "en-NG": {
            goPlus: "Go Plus \u2014 Naija price"
        }
    };

    let locale = "en";
    try {
        locale = localStorage.getItem("gh-locale") ||
            (navigator.language || "en");
        if (STRINGS[locale] === undefined) locale = "en";
    } catch (e) {
        locale = "en";
    }

    function t(key) {
        const dict = STRINGS[locale] || {};
        return dict[key] !== undefined ? dict[key] :
            (STRINGS.en[key] !== undefined ? STRINGS.en[key] : key);
    }

    function formatUsd(usd) {
        const ngn = Math.round((usd * (config.fx.usdToNgn || 1500)) / 100) * 100;
        if (locale.indexOf("NG") !== -1) {
            return "\u20a6" + ngn.toLocaleString("en-NG");
        }
        return "$" + usd.toFixed(2);
    }

    function setLocale(next) {
        if (STRINGS[next]) {
            locale = next;
            try { localStorage.setItem("gh-locale", next); } catch (e) { return; }
        }
    }

    function applyConfig(serverConfig) {
        if (!serverConfig) return;
        config = serverConfig;
    }

    function getConfig() {
        return config;
    }

    return {
        t: t,
        formatUsd: formatUsd,
        setLocale: setLocale,
        applyConfig: applyConfig,
        getConfig: getConfig
    };
});
