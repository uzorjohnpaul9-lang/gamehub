const games = {
    "GTA V": {
        minRam: 4,
        recommendedRam: 8,
        minCpuLevel: 3,
        minGpuLevel: 3
    },

    "Far Cry 3": {
        minRam: 2,
        recommendedRam: 4,
        minCpuLevel: 1,
        minGpuLevel: 1
    },

    "Tomb Raider": {
        minRam: 2,
        recommendedRam: 4,
        minCpuLevel: 1,
        minGpuLevel: 1
    },

    "Need for Speed: Most Wanted": {
        minRam: 2,
        recommendedRam: 4,
        minCpuLevel: 1,
        minGpuLevel: 1
    },

    "GTA IV": {
        minRam: 2,
        recommendedRam: 4,
        minCpuLevel: 2,
        minGpuLevel: 2
    },

    "Far Cry 4": {
        minRam: 4,
        recommendedRam: 8,
        minCpuLevel: 3,
        minGpuLevel: 3
    },

    "Mafia II": {
        minRam: 2,
        recommendedRam: 4,
        minCpuLevel: 2,
        minGpuLevel: 2
    },

    "Sleeping Dogs": {
        minRam: 2,
        recommendedRam: 4,
        minCpuLevel: 2,
        minGpuLevel: 2
    },

    "Tomb Raider (2013)": {
        minRam: 2,
        recommendedRam: 4,
        minCpuLevel: 2,
        minGpuLevel: 2
    }

};


const searchbox = document.getElementById("gameSearch");
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


function getCpuLevel(cpu) {

    cpu = cpu.toLowerCase();

    if (cpu.includes("a8-7100")) {
        return 1;
    }

    if (cpu.includes("core 2 duo")) {
        return 1;
    }

    if (cpu.includes("i5")) {
        return 3;
    }

    if (cpu.includes("i7")) {
        return 4;
    }

    if (cpu.includes("ryzen 5")) {
        return 4;
    }

    if (cpu.includes("ryzen 7")) {
        return 4;
    }

    if (cpu.includes("ryzen 3")) {
        return 2;
    }

    if (cpu.includes("i3")) {
        return 2;
    }

    if (cpu.includes("ryzen 9")) {
        return 5;
    }

    if (cpu.includes("i9")) {
        return 5;
    }

    return 0;
}

function getGpuLevel(gpu) {

    gpu = gpu.toLowerCase();

    if (gpu.includes("radeon r5")) {
        return 1;
    }

    if (gpu.includes("gtx 1030")) {
        return 2;
    }

    if (gpu.includes("gtx 750")) {
        return 2;
    }

    if (gpu.includes("gtx 1050")) {
        return 3;
    }

    if (gpu.includes("gtx 1060")) {
        return 4;
    }

    if (gpu.includes("gtx 1660")) {
        return 4;
    }

    if (gpu.includes("rtx 2060")) {
        return 5;
    }

    if (gpu.includes("rtx 3060")) {
        return 5;
    }

    if (gpu.includes("rtx 4060")) {
        return 5;
    }

    if (gpu.includes("gtx 750 ti")) {
        return 2;
    }

    if (gpu.includes("gtx 1070")) {
        return 4;
    }

    if (gpu.includes("gtx 1080")) {
        return 4;
    }

    return 0;
}

const ramField = document.getElementById("ram");

ramField.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");
});

const checkButton = document.getElementById("checkPC");

checkButton.addEventListener("click", function () {

    const selectedGame =
        document.getElementById("gameSelect").value;

    const game = games[selectedGame];

    const cpu =
        document.getElementById("cpuSelect").value;

    const ramInput =
        document.getElementById("ram").value;

        if (!/^\d+$/.test(ramInput)) {
        result.textContent =
            "Please enter RAM using numbers only";
        return;
    }

    const ram = Number(ramInput);

    const gpu =
        document.getElementById("gpuSelect").value;

    const result =
        document.getElementById("result");


    if (selectedGame === "" || cpu === "" || ramInput === "" || gpu === "") {
        result.textContent =
            "Please enter all your PC specifications";
        return;
    }


    const cpuLevel = getCpuLevel(cpu);
const gpuLevel = getGpuLevel(gpu);

let ramResult = "";
let cpuResult = "";
let gpuResult = "";

if (ram < game.minRam) {
    ramResult = "🔴 RAM: Below minimum";
} else if (ram < game.recommendedRam) {
    ramResult = "🟡 RAM: Minimum";
} else {
    ramResult = "🟢 RAM: Recommended";
}

if (cpuLevel === 0) {
    cpuResult = "❓ CPU: Not recognized";
} else if (cpuLevel < game.minCpuLevel) {
    cpuResult = "🔴 CPU: Below minimum";
} else {
    cpuResult = "🟢 CPU: Meets minimum";
}

if (gpuLevel === 0) {
    gpuResult = "❓ GPU: Not recognized";
} else if (gpuLevel < game.minGpuLevel) {
    gpuResult = "🔴 GPU: Below minimum";
} else {
    gpuResult = "🟢 GPU: Meets minimum";
}

let overallResult = "";

if (cpuLevel === 0 || gpuLevel === 0) {
    overallResult = "❓ Hardware Not Fully Recognized";
}else if (
    ram < game.minRam ||
    cpuLevel < game.minCpuLevel ||
    gpuLevel < game.minGpuLevel
) {
    overallResult = "🔴 Not Recommended";
} else if (ram < game.recommendedRam) {
    overallResult = "🟡 Playable on Low Settings";
} else {
    overallResult = "🟢 Good to Go";
}

let resultClass = "";

if (overallResult.includes("Not Recommended")) {
    resultClass = "not-recommended";
} else if (overallResult.includes("Playable")) {
    resultClass = "playable";
} else {
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

const viewButtons =
document.querySelectorAll(".view-game");

viewButtons.forEach(function(button){
    button.addEventListener("click", function(){
        const gameName = this.dataset.game;

        const gameDetails = document.getElementById("gameDetails");
const game = games[gameName];

gameDetails.style.display = "block";

gameDetails.innerHTML = `
    <h3>${gameName}</h3>
    <p>Minimum RAM: ${game.minRam} GB</p>
    <p>Recommended RAM: ${game.recommendedRam} GB</p>
    <p>Minimum CPU Level: ${game.minCpuLevel}</p>
    <p>Minimum GPU Level: ${game.minGpuLevel}</p>
`;
    });
});