const gamesGrid = document.getElementById("gamesGrid");
const gameSelect = document.getElementById("gameSelect");
const cpuInput = document.getElementById("cpuInput");
const gpuInput = document.getElementById("gpuInput");
const ramSelect = document.getElementById("ram");
const cpuDatalist = document.getElementById("cpuList");
const gpuDatalist = document.getElementById("gpuList");
const resultBox = document.getElementById("result");
const rigResultsBox = document.getElementById("rigResults");

const RIG_KEY = "gamehub-rig";

Object.keys(cpus).forEach(function (name) {
    const option = document.createElement("option");
    option.value = name;
    cpuDatalist.appendChild(option);
});

Object.keys(gpus).forEach(function (name) {
    const option = document.createElement("option");
    option.value = name;
    gpuDatalist.appendChild(option);
});

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

async function loadGamesFromApi() {
    try {
        const base = window.GAMEHUB_API_URL || "";
        const res = await fetch(base + "/api/games", {
            headers: { Accept: "application/json" }
        });
        if (!res.ok) return;
        const payload = await res.json();
        const list = Array.isArray(payload) ? payload : payload.games;
        if (!Array.isArray(list) || !list.length) return;

        Object.keys(games).forEach(function (key) { delete games[key]; });

        list.forEach(function (g) {
            if (!g || !g.title || typeof g.recCpu !== "number") return;
            games[g.title] = {
                rating: g.rating || 4,
                compatibility: g.compatibility || "medium",
                minRam: g.minRam,
                recRam: g.recRam,
                minCpu: g.minCpu,
                minGpu: g.minGpu,
                recCpu: g.recCpu,
                recGpu: g.recGpu,
                baseFps: g.baseFps || 50,
                imageUrl: g.imageUrl || null
            };
        });
    } catch (e) {
        return;
    }
}

async function init() {
    await loadGamesFromApi();

    renderGameOptions();
    renderGameCards();

    const gameCards = document.querySelectorAll(".game-card");

    document.getElementById("gameSearch").addEventListener("input", function () {
        const searchText = this.value.toLowerCase();

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

    renderRigResults();
}

init();

document.getElementById("navCheckPC").addEventListener("click", function () {
    document.getElementById("checker")
        .scrollIntoView({ behavior: "smooth" });
});

document.getElementById("navBrowseGames").addEventListener("click", function () {
    document.getElementById("featured")
        .scrollIntoView({ behavior: "smooth" });
});

function saveRig(rig) {
    try {
        localStorage.setItem(RIG_KEY, JSON.stringify({
            cpu: rig.cpuName,
            gpu: rig.gpuName,
            ram: rig.ram
        }));
    } catch (e) {
        return;
    }
}

function loadRig() {
    try {
        const raw = localStorage.getItem(RIG_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function restoreRigInputs() {
    const rig = loadRig();
    if (!rig) return;
    if (rig.cpu && cpus[rig.cpu]) cpuInput.value = rig.cpu;
    if (rig.gpu && gpus[rig.gpu]) gpuInput.value = rig.gpu;
    if (rig.ram) ramSelect.value = String(rig.ram);
}

restoreRigInputs();

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function buildRig() {
    const cpuName = cpuInput.value.trim();
    const gpuName = gpuInput.value.trim();
    const ramValue = ramSelect.value;

    if (!cpuName || !gpuName || !ramValue) return null;

    if (!cpus[cpuName] || !gpus[gpuName]) return null;

    return {
        cpuName: cpuName,
        gpuName: gpuName,
        ram: Number(ramValue),
        cpuScore: cpus[cpuName],
        gpuScore: gpus[gpuName]
    };
}

document.getElementById("checkPC").addEventListener("click", function () {

    const selectedGame = gameSelect.value;

    if (!selectedGame || !cpuInput.value.trim() ||
        !gpuInput.value.trim() || !ramSelect.value) {
        resultBox.textContent =
            "Please enter all your PC specifications";
        return;
    }

    if (!cpus[cpuInput.value.trim()] && !gpus[gpuInput.value.trim()]) {
        resultBox.textContent =
            "We couldn't find that CPU or GPU. Pick one from the suggestions.";
        return;
    }

    if (!cpus[cpuInput.value.trim()]) {
        resultBox.textContent =
            "We couldn't find that CPU. Pick one from the suggestions.";
        return;
    }

    if (!gpus[gpuInput.value.trim()]) {
        resultBox.textContent =
            "We couldn't find that GPU. Pick one from the suggestions.";
        return;
    }

    const game = games[selectedGame];
    const rig = buildRig();

    saveRig(rig);

    const verdict = computeVerdict(game, rig);
    const tips = findUpgrades(game, rig, cpus, gpus);

    let html =
        "<strong class='" + verdict.tierClass + "'>" +
        escapeHtml(verdict.tierLabel) + " \u2014 " +
        escapeHtml(selectedGame) +
        "</strong><br><br>";

    if (verdict.meetsMin) {
        html +=
            "<span>Estimated FPS at 1080p: <strong>" +
            verdict.fpsLow + "\u2013" + verdict.fpsHigh +
            "</strong></span><br>";
    }

    html +=
        "<span class='" +
        (verdict.ramBelowMin ? "not-recommended" :
            verdict.ramBelowRec ? "playable" : "good") + "'>" +
        (verdict.ramBelowMin ? "\uD83D\uDD34" :
            verdict.ramBelowRec ? "\uD83D\uDFE1" : "\uD83D\uDFE2") +
        " RAM: " + rig.ram + " GB (min " + game.minRam +
        " / rec " + game.recRam + ")</span><br>" +

        "<span class='" +
        (verdict.cpuBelowMin ? "not-recommended" : "good") + "'>" +
        (verdict.cpuBelowMin ? "\uD83D\uDD34 CPU: Below minimum \u2014 " :
            "\uD83D\uDFE2 CPU: OK \u2014 ") +
        escapeHtml(rig.cpuName) + "</span><br>" +

        "<span class='" +
        (verdict.gpuBelowMin ? "not-recommended" : "good") + "'>" +
        (verdict.gpuBelowMin ? "\uD83D\uDD34 GPU: Below minimum \u2014 " :
            "\uD83D\uDFE2 GPU: OK \u2014 ") +
        escapeHtml(rig.gpuName) + "</span>";

    if (tips.length) {
        html += "<div class='upgrade-tips'><strong>Upgrade ideas:</strong><ul>" +
            tips.map(function (tip) {
                return "<li>" + escapeHtml(tip) + "</li>";
            }).join("") +
            "</ul></div>";
    }

    resultBox.innerHTML = html;

    renderRigResults();
});

function renderRigResults() {
    const rig = loadRig();
    const savedCpu = rig && cpus[rig.cpu] ? rig.cpu : null;
    const savedGpu = rig && gpus[rig.gpu] ? rig.gpu : null;

    if (!savedCpu || !savedGpu) {
        rigResultsBox.innerHTML =
            "<p class='muted'>Check any game above and your full results will appear here.</p>";
        return;
    }

    const rigData = {
        cpuScore: cpus[savedCpu],
        gpuScore: gpus[savedGpu],
        ram: rig.ram
    };

    const rows = Object.keys(games)
        .map(function (name) {
            return {
                name: name,
                game: games[name],
                verdict: computeVerdict(games[name], rigData),
                tips: findUpgrades(games[name], rigData, cpus, gpus)
            };
        })
        .sort(function (a, b) {
            const rank = { ultra: 0, high: 1, medium: 2, low: 3, unplayable: 4 };
            if (rank[a.verdict.tier] !== rank[b.verdict.tier]) {
                return rank[a.verdict.tier] - rank[b.verdict.tier];
            }
            return (b.verdict.fpsHigh || 0) - (a.verdict.fpsHigh || 0);
        });

    let html =
        "<p class='rig-summary'>Your PC: <strong>" +
        escapeHtml(savedCpu) + "</strong> + <strong>" +
        escapeHtml(savedGpu) + "</strong>, " +
        (savedRigRam(rig)) + " GB RAM</p><div class='rig-grid'>";

    rows.forEach(function (row) {
        const v = row.verdict;
        html +=
            "<div class='rig-card'>" +
            "<h4>" + escapeHtml(row.name) + "</h4>" +
            "<span class='tier-chip " + v.tierClass + "'>" +
            escapeHtml(v.tierLabel) + "</span>";

        if (v.meetsMin) {
            html +=
                "<p class='fps-line'>" + v.fpsLow + "\u2013" +
                v.fpsHigh + " FPS</p>";
        } else {
            html +=
                "<p class='fps-line muted'>Below minimum specs</p>";
        }

        if (row.tips.length) {
            html +=
                "<p class='rig-tip'>" + escapeHtml(row.tips[0]) + "</p>";
        }

        html += "</div>";
    });

    html += "</div>";
    rigResultsBox.innerHTML = html;
}

function savedRigRam(rig) {
    return rig && rig.ram ? rig.ram : "?";
}

gamesGrid.addEventListener("click", function (event) {

    const button = event.target.closest(".view-game");

    if (!button) return;

    const gameName = button.dataset.game;
    const game = games[gameName];
    const gameDetails = document.getElementById("gameDetails");

    gameDetails.style.display = "block";

    if (!game) {
        gameDetails.innerHTML =
            "<h3>" + escapeHtml(gameName) + "</h3>" +
            "<p>Details for this game are coming soon.</p>";
        return;
    }

    gameDetails.innerHTML =
        "<h3>" + escapeHtml(gameName) + "</h3>" +
        "<p>Rating: " + game.rating + "/5</p>" +
        "<p><strong>Minimum:</strong> " + game.minRam + " GB RAM, CPU level " +
        game.minCpu + ", GPU level " + game.minGpu + "</p>" +
        "<p><strong>Recommended:</strong> " + game.recRam + " GB RAM, CPU level " +
        game.recCpu + ", GPU level " + game.recGpu + "</p>" +
        "<p><strong>Reference performance:</strong> ~" + game.baseFps +
        " FPS at 1080p on recommended hardware</p>";
});
