function decodeEntities(text) {
    return String(text)
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, "\"")
        .replace(/&#39;/gi, "'");
}

function stripHtml(html) {
    return decodeEntities(String(html))
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]*>/g, " ")
        .replace(/[ \t]+/g, " ");
}

function normalizeName(text) {
    return String(text)
        .toLowerCase()
        .replace(/[\u00AE\u00A9\u2122]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function safeIncludes(haystack, needle, fromIndex) {
    const idx = haystack.indexOf(needle, fromIndex || 0);
    if (idx === -1) return -1;
    const end = idx + needle.length;
    const nextChar = haystack.charAt(end);
    if (/[0-9]/.test(nextChar)) {
        return safeIncludes(haystack, needle, idx + 1);
    }
    return idx;
}

function buildMatcher(dictionary) {
    const entries = Object.keys(dictionary).map(function (canonical) {
        return {
            canonical: canonical,
            normFull: normalizeName(canonical),
            normShort: normalizeName(canonical.replace(
                /^(?:intel\s+|amd\s+)?(?:(?:core|radeon|geforce|ryzen|athlon|pentium|celeron)\s+)?/i,
                ""
            ))
        };
    });
    entries.sort(function (a, b) { return b.normFull.length - a.normFull.length; });

    return function match(sectionText) {
        const hay = normalizeName(sectionText);
        let best = null;

        entries.forEach(function (entry) {
            let pos = safeIncludes(hay, entry.normFull, 0);
            let viaShort = false;
            const shortOk = entry.normShort.length >= 4 &&
                /[a-z]/.test(entry.normShort);
            if (pos === -1 && shortOk && entry.normShort !== entry.normFull) {
                pos = safeIncludes(hay, entry.normShort, 0);
                viaShort = true;
            }
            if (pos === -1) return;
            if (!best ||
                pos < best.pos ||
                (pos === best.pos && entry.normFull.length > best.entry.normFull.length)) {
                best = {
                    pos: pos,
                    entry: entry,
                    confidence: viaShort ? "model-only" : "exact"
                };
            }
        });

        if (!best) return { name: null, confidence: "none" };
        return { name: best.entry.canonical, confidence: best.confidence };
    };
}

function splitRequirementSections(text) {
    const lower = text.toLowerCase();
    const minIdx = lower.indexOf("minimum:");
    const recIdx = lower.indexOf("recommended:");

    let minimum = "";
    let recommended = "";

    if (minIdx !== -1 && recIdx !== -1 && recIdx > minIdx) {
        minimum = text.slice(minIdx + 8, recIdx);
        recommended = text.slice(recIdx + 12);
    } else if (recIdx !== -1) {
        recommended = text.slice(recIdx + 12);
    } else if (minIdx !== -1) {
        minimum = text.slice(minIdx + 8);
    } else {
        recommended = text;
    }

    return { minimum: minimum, recommended: recommended };
}

function extractRam(sectionText) {
    const patterns = [
        /(\d{1,3})\s*(?:gb|gigabytes?)\s*(?:of\s*)?(?:ram|memory)/i,
        /(?:memory|ram)\s*:?\s*(\d{1,3})\s*(?:gb|gigabyte)/i
    ];
    for (let i = 0; i < patterns.length; i++) {
        const m = sectionText.match(patterns[i]);
        if (m) {
            const gb = parseInt(m[1], 10);
            if (gb >= 1 && gb <= 128) return gb;
        }
    }
    return null;
}

function createParser(cpus, gpus) {
    const matchCpu = buildMatcher(cpus);
    const matchGpu = buildMatcher(gpus);

    return function parseRequirements(pcRequirements) {
        const text = stripHtml(
            typeof pcRequirements === "string"
                ? pcRequirements
                : [pcRequirements.minimum, pcRequirements.recommended]
                    .filter(Boolean).join("\n")
        );
        const sections = splitRequirementSections(text);

        function handle(matchResult) {
            return {
                name: matchResult.name,
                confidence: matchResult.confidence
            };
        }

        const result = {
            min: {
                ram: extractRam(sections.minimum),
                cpu: handle(matchCpu(sections.minimum)),
                gpu: handle(matchGpu(sections.minimum))
            },
            rec: {
                ram: extractRam(sections.recommended),
                cpu: handle(matchCpu(sections.recommended)),
                gpu: handle(matchGpu(sections.recommended))
            },
            warnings: []
        };

        if (!result.min.cpu.name) result.warnings.push("Minimum CPU not recognized \u2014 manual entry needed");
        if (!result.min.gpu.name) result.warnings.push("Minimum GPU not recognized \u2014 manual entry needed");
        if (result.min.ram === null) result.warnings.push("Minimum RAM not found \u2014 manual entry needed");
        if (!result.rec.cpu.name) result.warnings.push("Recommended CPU not recognized \u2014 manual entry needed");
        if (!result.rec.gpu.name) result.warnings.push("Recommended GPU not recognized \u2014 manual entry needed");
        if (result.rec.ram === null) result.warnings.push("Recommended RAM not found \u2014 manual entry needed");

        return result;
    };
}

if (typeof module !== "undefined") {
    module.exports = {
        createParser: createParser,
        stripHtml: stripHtml,
        normalizeName: normalizeName,
        splitRequirementSections: splitRequirementSections,
        extractRam: extractRam
    };
}
