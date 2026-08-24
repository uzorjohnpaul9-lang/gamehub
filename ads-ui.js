(function () {

    const AD_SLOTS = [
        { id: "ad-top", label: "advertisement", insertAfter: "accountBox" },
        { id: "ad-mid", label: "advertisement", insertBefore: "featured" },
        { id: "ad-bottom", label: "advertisement", insertBefore: "modsHub" }
    ];

    function renderSlots() {
        if (!window.GameHubI18n || !window.GameHubI18n.getConfig().showAds) return;

        const client = window.GameHubI18n.getConfig().adsClient;
        if (document.getElementById("adsense-loader") && !client) return;

        AD_SLOTS.forEach(function (slot) {
            if (document.getElementById(slot.id)) return;

            const box = document.createElement("div");
            box.className = "ad-slot";
            box.id = slot.id;
            box.setAttribute("aria-label", slot.label);
            box.dataset.adSlot = slot.id;
            box.innerHTML = client ?
                "<ins class='adsbygoogle' data-ad-client='" + client +
                "' data-ad-format='auto' data-full-width-responsive='true'></ins>" :
                "<span class='ad-placeholder'>Ad space</span>";

            const anchor = document.getElementById(slot.insertAfter);
            if (anchor) {
                anchor.parentNode.insertBefore(box, anchor.nextSibling);
                return;
            }
            const before = document.getElementById(slot.insertBefore);
            if (before) {
                before.parentNode.insertBefore(box, before);
            }
        });

        if (client) {
            if (!document.getElementById("adsense-loader")) {
                const script = document.createElement("script");
                script.id = "adsense-loader";
                script.async = true;
                script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
                    encodeURIComponent(client);
                script.crossOrigin = "anonymous";
                document.head.appendChild(script);
            }
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                return;
            }
        }
    }

    fetch("/api/config")
        .then(function (r) { return r.json(); })
        .then(function (cfg) {
            if (window.GameHubI18n) window.GameHubI18n.applyConfig(cfg);
            renderSlots();
            document.dispatchEvent(new CustomEvent("gamehub:config"));
        })
        .catch(function () {
            document.dispatchEvent(new CustomEvent("gamehub:config"));
        });

    window.GameHubAds = { renderSlots: renderSlots };

})();
