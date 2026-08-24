const games = {
    "GTA V": {
        rating: 4.8,
        compatibility: "medium",
        minRam: 4,
        recRam: 8,
        minCpu: 11,
        minGpu: 8,
        recCpu: 26,
        recGpu: 13,
        baseFps: 60
    },
    "Need for Speed: Most Wanted": {
        rating: 4.6,
        compatibility: "easy",
        minRam: 2,
        recRam: 4,
        minCpu: 4,
        minGpu: 3,
        recCpu: 8,
        recGpu: 6,
        baseFps: 110
    },
    "Tomb Raider (2013)": {
        rating: 4.7,
        compatibility: "easy",
        minRam: 2,
        recRam: 4,
        minCpu: 5,
        minGpu: 6,
        recCpu: 18,
        recGpu: 15,
        baseFps: 90
    },
    "Far Cry 3": {
        rating: 4.2,
        compatibility: "easy",
        minRam: 2,
        recRam: 4,
        minCpu: 6,
        minGpu: 7,
        recCpu: 18,
        recGpu: 15,
        baseFps: 85
    },
    "GTA IV": {
        rating: 4.5,
        compatibility: "medium",
        minRam: 2,
        recRam: 4,
        minCpu: 6,
        minGpu: 7,
        recCpu: 13,
        recGpu: 11,
        baseFps: 55
    },
    "Far Cry 4": {
        rating: 4.3,
        compatibility: "medium",
        minRam: 4,
        recRam: 8,
        minCpu: 18,
        minGpu: 12,
        recCpu: 26,
        recGpu: 30,
        baseFps: 65
    },
    "Mafia II": {
        rating: 4.1,
        compatibility: "easy",
        minRam: 2,
        recRam: 4,
        minCpu: 6,
        minGpu: 6,
        recCpu: 13,
        recGpu: 12,
        baseFps: 75
    },
    "Sleeping Dogs": {
        rating: 4.4,
        compatibility: "easy",
        minRam: 2,
        recRam: 4,
        minCpu: 7,
        minGpu: 8,
        recCpu: 18,
        recGpu: 12,
        baseFps: 80
    }
};

if (typeof module !== "undefined") {
    module.exports = { games: games };
}
