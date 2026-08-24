const assert = require("assert");
const path = require("path");
const hardware = require(path.join(__dirname, "..", "..", "data-hardware.js"));
const { createParser, stripHtml, extractRam, splitRequirementSections } =
    require(path.join(__dirname, "lib", "parse-requirements.js"));

let passed = 0;
function test(name, fn) {
    fn();
    passed++;
    console.log("PASS:", name);
}

const parse = createParser(hardware.cpus, hardware.gpus);

const steamSample =
    "<strong>Minimum:</strong> Requires a 64-bit processor and operating system<br>" +
    "<strong>OS:</strong> Windows 10 64 Bit<br>" +
    "<strong>Processor:</strong> Intel Core i5-3470 or AMD Ryzen 3 1200<br>" +
    "<strong>Memory:</strong> 8 GB RAM<br>" +
    "<strong>Graphics:</strong> NVIDIA GeForce GTX 660 2GB or AMD Radeon R9 280<br><br>" +
    "<strong>Recommended:</strong> Requires a 64-bit processor and operating system<br>" +
    "<strong>Processor:</strong> Intel Core i5-9600K or AMD Ryzen 5 3600<br>" +
    "<strong>Memory:</strong> 16 GB RAM<br>" +
    "<strong>Graphics:</strong> NVIDIA GeForce GTX 1660 Ti or AMD Radeon RX 5700 XT";

const result = parse({ minimum: "", recommended: steamSample });

test("splits minimum/recommended sections", () => {
    const parts = splitRequirementSections(stripHtml(steamSample));
    assert.ok(parts.minimum.includes("i5-3470"));
    assert.ok(parts.recommended.includes("1660"));
});

test("extracts RAM from both sections", () => {
    assert.strictEqual(result.min.ram, 8);
    assert.strictEqual(result.rec.ram, 16);
});

test("matches CPUs exactly with correct scores", () => {
    assert.strictEqual(result.min.cpu.name, "Core i5-3470");
    assert.strictEqual(result.rec.cpu.name, "Core i5-9600K");
    assert.strictEqual(hardware.cpus[result.rec.cpu.name], 48);
});

test("prefers longest GPU match (1050 Ti over 1050)", () => {
    const r = parse({
        minimum: "Minimum: Graphics: NVIDIA GeForce GTX 1050 Ti, Memory: 4 GB RAM",
        recommended: ""
    });
    assert.strictEqual(r.min.gpu.name, "GTX 1050 Ti");
});

test("does not match RX 550 inside RX 5500 XT (digit boundary)", () => {
    const r = parse({
        minimum: "",
        recommended: "Recommended: Graphics: AMD Radeon RX 5500 XT, Memory: 8 GB RAM"
    });
    assert.strictEqual(r.rec.gpu.name, "RX 5500 XT");
});

test("model-only mention still matches at lower confidence", () => {
    const r = parse({
        minimum: "Minimum: Processor: i3-4130, Memory: 4 GB RAM",
        recommended: ""
    });
    assert.strictEqual(r.min.cpu.name, "Core i3-4130");
    assert.strictEqual(r.min.cpu.confidence, "model-only");
});

test("unknown hardware yields null + warning", () => {
    const r = parse({
        minimum: "Minimum: Processor: Quantum Core 99X, Graphics: TurboBlaster 5000",
        recommended: ""
    });
    assert.strictEqual(r.min.cpu.name, null);
    assert.strictEqual(r.min.gpu.name, null);
    assert.ok(r.warnings.length >= 2);
});

test("RAM extractor handles 'Memory: 6 GB' phrasing", () => {
    assert.strictEqual(extractRam("Memory: 6 GB RAM"), 6);
    assert.strictEqual(extractRam("8 GB available space"), null);
});

test("stripHtml removes tags and entities", () => {
    const out = stripHtml("<strong>A</strong> &amp; B<br>C");
    assert.strictEqual(out.trim(), "A & B\nC");
});

console.log("\nAll " + passed + " parser tests passed.");
