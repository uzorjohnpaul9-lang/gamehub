const games = {
    "GTA V": {
        rating: 4.8,
        compatibility: "medium",
        minRam: 4,
        recommendedRam: 8,
        minCpuLevel: 3,
        minGpuLevel: 3
    },
    "Need for Speed: Most Wanted": {
        rating: 4.6,
        compatibility: "easy",
        minRam: 2,
        recommendedRam: 4,
        minCpuLevel: 1,
        minGpuLevel: 1
    },
    "Tomb Raider (2013)": {
        rating: 4.7,
        compatibility: "easy",
        minRam: 2,
        recommendedRam: 4,
        minCpuLevel: 2,
        minGpuLevel: 2
    },
    "Far Cry 3": {
        rating: 4.2,
        compatibility: "easy",
        minRam: 2,
        recommendedRam: 4,
        minCpuLevel: 1,
        minGpuLevel: 1
    },
    "GTA IV": {
        rating: 4.5,
        compatibility: "medium",
        minRam: 2,
        recommendedRam: 4,
        minCpuLevel: 2,
        minGpuLevel: 2
    },
    "Far Cry 4": {
        rating: 4.3,
        compatibility: "medium",
        minRam: 4,
        recommendedRam: 8,
        minCpuLevel: 3,
        minGpuLevel: 3
    },
    "Mafia II": {
        rating: 4.1,
        compatibility: "easy",
        minRam: 2,
        recommendedRam: 4,
        minCpuLevel: 2,
        minGpuLevel: 2
    },
    "Sleeping Dogs": {
        rating: 4.4,
        compatibility: "easy",
        minRam: 2,
        recommendedRam: 4,
        minCpuLevel: 2,
        minGpuLevel: 2
    }
};

const cpuLevels = {
    "Pentium 4": 1,
    "Celeron G1840": 1,
    "Athlon 64 X2": 1,
    "A4-5300": 1,
    "A6-6400K": 1,
    "A8-7100": 1,
    "Core 2 Duo E8400": 1,

    "Core 2 Quad Q6600": 2,
    "Pentium G4560": 2,
    "Pentium Gold G6400": 2,
    "Athlon 3000G": 2,
    "A8-9600": 2,
    "A10-7860K": 2,
    "FX-4300": 2,
    "FX-6300": 2,
    "Core i3-2120": 2,
    "Core i3-3220": 2,
    "Core i3-4130": 2,
    "Core i3-6100": 2,
    "Core i3-7100": 2,

    "FX-8350": 3,
    "Ryzen 3 1200": 3,
    "Ryzen 3 2200G": 3,
    "Ryzen 3 3200G": 3,
    "Ryzen 3 3300X": 3,
    "Core i3-8100": 3,
    "Core i3-9100F": 3,
    "Core i3-10100F": 3,
    "Core i5-2300": 3,
    "Core i5-2400": 3,
    "Core i5-3470": 3,
    "Core i5-4460": 3,
    "Core i5-6500": 3,
    "Core i5-7400": 3,
    "Core i5-7600K": 3,

    "Core i5-8400": 4,
    "Core i5-9400F": 4,
    "Core i5-9600K": 4,
    "Core i5-10400F": 4,
    "Core i5-10600K": 4,
    "Core i5-11400F": 4,
    "Core i5-12400F": 4,
    "Core i7-2600": 4,
    "Core i7-3770": 4,
    "Core i7-4790K": 4,
    "Core i7-6700K": 4,
    "Core i7-7700K": 4,
    "Core i7-8700K": 4,
    "Core i7-10700K": 4,
    "Ryzen 5 1500X": 4,
    "Ryzen 5 1600": 4,
    "Ryzen 5 2600": 4,
    "Ryzen 5 3600": 4,
    "Ryzen 5 5600X": 4,
    "Ryzen 7 1700": 4,
    "Ryzen 7 2700X": 4,
    "Ryzen 7 3700X": 4,
    "Ryzen 7 5700X": 4,

    "Core i5-12600K": 5,
    "Core i5-13600K": 5,
    "Core i5-14600KF": 5,
    "Core i7-11700K": 5,
    "Core i7-12700K": 5,
    "Core i7-13700K": 5,
    "Core i7-14700K": 5,
    "Core i9-9900K": 5,
    "Core i9-10900K": 5,
    "Core i9-11900K": 5,
    "Core i9-12900K": 5,
    "Core i9-13900K": 5,
    "Core i9-14900K": 5,
    "Ryzen 5 7600X": 5,
    "Ryzen 7 5800X": 5,
    "Ryzen 7 5800X3D": 5,
    "Ryzen 7 7700X": 5,
    "Ryzen 7 7800X3D": 5,
    "Ryzen 7 9800X3D": 5,
    "Ryzen 9 3900X": 5,
    "Ryzen 9 5900X": 5,
    "Ryzen 9 5950X": 5,
    "Ryzen 9 7900X": 5,
    "Ryzen 9 7950X": 5,
    "Ryzen 9 9950X": 5
};

const gpuLevels = {
    "GT 710": 1,
    "GT 730": 1,
    "R5 230": 1,
    "HD Graphics 4000": 1,
    "UHD 630": 1,

    "GT 1030": 2,
    "GTX 650": 2,
    "GTX 750": 2,
    "GTX 750 Ti": 2,
    "HD 7770": 2,
    "R7 250": 2,
    "R7 260X": 2,
    "RX 550": 2,
    "Vega 8": 2,
    "Vega 11": 2,

    "GTX 660": 3,
    "GTX 950": 3,
    "GTX 960": 3,
    "GTX 1050": 3,
    "GTX 1050 Ti": 3,
    "GTX 1650": 3,
    "RX 460": 3,
    "RX 470": 3,
    "RX 560": 3,
    "RX 570": 3,
    "RX 6400": 3,
    "Arc A310": 2,
    "Arc A380": 3,

    "GTX 970": 4,
    "GTX 980": 4,
    "GTX 1060 3GB": 4,
    "GTX 1060 6GB": 4,
    "GTX 1070": 4,
    "GTX 1070 Ti": 4,
    "GTX 1660": 4,
    "GTX 1660 Super": 4,
    "GTX 1660 Ti": 4,
    "RTX 2060": 4,
    "RTX 3050": 4,
    "RX 480": 4,
    "RX 580": 4,
    "RX 590": 4,
    "RX 5500 XT": 4,
    "RX 5600 XT": 4,
    "RX 5700": 4,
    "RX 5700 XT": 4,
    "RX 6600": 4,
    "Arc A580": 4,

    "GTX 1080": 5,
    "GTX 1080 Ti": 5,
    "RTX 2070": 5,
    "RTX 2080": 5,
    "RTX 2080 Ti": 5,
    "RTX 3060": 5,
    "RTX 3060 Ti": 5,
    "RTX 3070": 5,
    "RTX 3070 Ti": 5,
    "RTX 3080": 5,
    "RTX 3080 Ti": 5,
    "RTX 3090": 5,
    "RTX 4060": 5,
    "RTX 4060 Ti": 5,
    "RTX 4070": 5,
    "RTX 4080": 5,
    "RTX 4090": 5,
    "RX 6500 XT": 3,
    "RX 6650 XT": 4,
    "RX 6700 XT": 5,
    "RX 6750 XT": 5,
    "RX 6800": 5,
    "RX 6800 XT": 5,
    "RX 6900 XT": 5,
    "RX 6950 XT": 5,
    "RX 7600": 5,
    "RX 7700 XT": 5,
    "RX 7800 XT": 5,
    "RX 7900 XT": 5,
    "RX 7900 XTX": 5,
    "Arc A750": 5,
    "Arc A770": 5
};

function getCpuLevel(cpu) {
    return cpuLevels[cpu] || 0;
}

function getGpuLevel(gpu) {
    return gpuLevels[gpu] || 0;
}

const searchbox = document.getElementById("gameSearch");
const gamesGrid = document.getElementById("gamesGrid");
const gameSelect = document.getElementById("gameSelect");

function renderGameOptions() {

    Object.keys(games).forEach(function (name) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        gameSelect.appendChild(option);
    });
}

function renderGameCards() {

    Object.keys(games).forEach(function (name) {
        const game = games[name];
        const badgeClass =
            game.compatibility === "easy" ? "easy" : "medium";
        const badgeSymbol =
            game.compatibility === "easy" ? "\u2714" : "\u26A0";
        const badgeLabel =
            game.compatibility === "easy" ? "Easy" : "Medium";

        const card = document.createElement("div");
        card.className = "game-card";
        card.innerHTML =
            "<h3>" + name + "</h3>" +
            "<p>Rating: " + game.rating + "/5</p>" +
            "<p class=\"" + badgeClass + "\">Compatibility: " +
            badgeSymbol + " " + badgeLabel + "</p>" +
            "<button class=\"view-game\" data-game=\"" + name +
            "\">View Game</button>";

        gamesGrid.appendChild(card);
    });
}

renderGameOptions();
renderGameCards();

const gameCards = document.querySelectorAll(".game-card");

searchbox.addEventListener("input", function () {

    const searchText = searchbox.value.toLowerCase();

    gameCards.forEach(function (card) {
        const gameName =
            card.querySelector("h3").textContent.toLowerCase();

        if (gameName.includes(searchText)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
});

document.getElementById("navCheckPC").addEventListener("click", function () {
    document.getElementById("checker")
        .scrollIntoView({ behavior: "smooth" });
});

document.getElementById("navBrowseGames").addEventListener("click", function () {
    document.getElementById("featured")
        .scrollIntoView({ behavior: "smooth" });
});

document.getElementById("checkPC").addEventListener("click", function () {

    const result = document.getElementById("result");

    const selectedGame =
        document.getElementById("gameSelect").value;

    const cpu =
        document.getElementById("cpuSelect").value;

    const ramInput =
        document.getElementById("ram").value;

    const gpu =
        document.getElementById("gpuSelect").value;

    if (selectedGame === "" || cpu === "" || ramInput === "" || gpu === "") {
        result.textContent =
            "Please enter all your PC specifications";
        return;
    }

    const game = games[selectedGame];
    const ram = Number(ramInput);

    const cpuLevel = getCpuLevel(cpu);
    const gpuLevel = getGpuLevel(gpu);

    let ramResult = "";
    let cpuResult = "";
    let gpuResult = "";

    if (ram < game.minRam) {
        ramResult = "\uD83D\uDD34 RAM: Below minimum";
    } else if (ram < game.recommendedRam) {
        ramResult = "\uD83D\uDFE1 RAM: Minimum";
    } else {
        ramResult = "\uD83D\uDFE2 RAM: Recommended";
    }

    if (cpuLevel === 0) {
        cpuResult = "\u2753 CPU: Not recognized";
    } else if (cpuLevel < game.minCpuLevel) {
        cpuResult = "\uD83D\uDD34 CPU: Below minimum";
    } else {
        cpuResult = "\uD83D\uDFE2 CPU: Meets minimum";
    }

    if (gpuLevel === 0) {
        gpuResult = "\u2753 GPU: Not recognized";
    } else if (gpuLevel < game.minGpuLevel) {
        gpuResult = "\uD83D\uDD34 GPU: Below minimum";
    } else {
        gpuResult = "\uD83D\uDFE2 GPU: Meets minimum";
    }

    let overallResult = "";
    let resultClass = "";

    if (cpuLevel === 0 || gpuLevel === 0) {
        overallResult = "\u2753 Hardware Not Fully Recognized";
        resultClass = "unknown-hardware";
    } else if (
        ram < game.minRam ||
        cpuLevel < game.minCpuLevel ||
        gpuLevel < game.minGpuLevel
    ) {
        overallResult = "\uD83D\uDD34 Not Recommended";
        resultClass = "not-recommended";
    } else if (ram < game.recommendedRam) {
        overallResult = "\uD83D\uDFE1 Playable on Low Settings";
        resultClass = "playable";
    } else {
        overallResult = "\uD83D\uDFE2 Good to Go";
        resultClass = "good";
    }

    let ramClass = "";
    let cpuClass = "";
    let gpuClass = "";

    if (ram < game.minRam) {
        ramClass = "not-recommended";
    } else if (ram < game.recommendedRam) {
        ramClass = "playable";
    } else {
        ramClass = "good";
    }

    if (cpuLevel < game.minCpuLevel) {
        cpuClass = "not-recommended";
    } else {
        cpuClass = "good";
    }

    if (gpuLevel < game.minGpuLevel) {
        gpuClass = "not-recommended";
    } else {
        gpuClass = "good";
    }

    result.innerHTML =
        "<strong class='" + resultClass + "'>" +
        overallResult +
        "</strong><br><br>" +
        "<span class='" + ramClass + "'>" + ramResult + "</span><br>" +
        "<span class='" + cpuClass + "'>" + cpuResult + "</span><br>" +
        "<span class='" + gpuClass + "'>" + gpuResult + "</span>";
});

gamesGrid.addEventListener("click", function (event) {

    const button = event.target.closest(".view-game");

    if (!button) return;

    const gameName = button.dataset.game;
    const game = games[gameName];
    const gameDetails = document.getElementById("gameDetails");

    gameDetails.style.display = "block";

    if (!game) {
        gameDetails.innerHTML =
            "<h3>" + gameName + "</h3>" +
            "<p>Details for this game are coming soon.</p>";
        return;
    }

    gameDetails.innerHTML =
        "<h3>" + gameName + "</h3>" +
        "<p>Rating: " + game.rating + "/5</p>" +
        "<p>Minimum RAM: " + game.minRam + " GB</p>" +
        "<p>Recommended RAM: " + game.recommendedRam + " GB</p>" +
        "<p>Minimum CPU Level: " + game.minCpuLevel + "</p>" +
        "<p>Minimum GPU Level: " + game.minGpuLevel + "</p>";
});
