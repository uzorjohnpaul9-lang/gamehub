(function () {

    window.GAMEHUB_AFFILIATES = {
        fanaticalPartner: "",
        kinguinPartnerId: "",
        instantGamingTag: "",
        gmgTrackingId: ""
    };

    function searchParams(params) {
        return Object.keys(params)
            .map(function (k) {
                return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
            })
            .join("&");
    }

    function buildStoreLinks(gameTitle) {
        const aff = window.GAMEHUB_AFFILIATES;
        const q = gameTitle;

        return [
            {
                store: "Fanatical",
                url: "https://www.fanatical.com/en/search?search=" + encodeURIComponent(q) +
                    (aff.fanaticalPartner ? "&partner=" + encodeURIComponent(aff.fanaticalPartner) : "")
            },
            {
                store: "Kinguin",
                url: "https://www.kinguin.net/category/" + encodeURIComponent(q) +
                    "?promo=" + encodeURIComponent(aff.kinguinPartnerId || "")
            },
            {
                store: "Instant Gaming",
                url: "https://www.instant-gaming.com/en/igames/search/?q=" + encodeURIComponent(q) +
                    (aff.instantGamingTag ? "&igr=" + encodeURIComponent(aff.instantGamingTag) : "")
            },
            {
                store: "GreenManGaming",
                url: "https://www.greenmangaming.com/search/?q=" + encodeURIComponent(q) +
                    (aff.gmgTrackingId ? "?" + searchParams({ noredirect: 1, utm_source: aff.gmgTrackingId }) : "")
            }
        ];
    }

    function renderStoreLinks(gameTitle) {
        return buildStoreLinks(gameTitle).map(function (link) {
            return "<a class='store-link' target='_blank' rel='sponsored noopener noreferrer' href='" +
                encodeURI(link.url) + "'>" + link.store + "</a>";
        }).join("");
    }

    window.GameHubAffiliate = {
        buildStoreLinks: buildStoreLinks,
        renderStoreLinks: renderStoreLinks
    };

})();
