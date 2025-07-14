const axios = require("axios");
const { performance } = require("perf_hooks");

const NEXT_URL = "http://localhost:3000";     
const BLAZOR_URL = "http://localhost:5270";   

const WARMUP_COUNT = 20;
const TEST_COUNT = 1000;

async function measure(url, name) {
    const times = [];

    console.log(`\n Starting warmup for ${name} (${WARMUP_COUNT} requests)...`);
    for (let i = 0; i < WARMUP_COUNT; i++) {
        try {
            await axios.get(url, { timeout: 10000 });
        } catch (err) {
            console.error(`Warmup error (${name}):`, err.message);
        }
    }

    console.log(`\n Running performance test for ${name} (${TEST_COUNT} requests)...`);
    for (let i = 0; i < TEST_COUNT; i++) {
        try {
            const start = performance.now();
            await axios.get(url, { timeout: 10000 });
            const end = performance.now();
            times.push(end - start);
        } catch (err) {
            console.error(`Test error (${name}):`, err.message);
        }
    }

    return analyzeResults(times);
}

function analyzeResults(times) {
    const sorted = [...times].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const stdDev = Math.sqrt(
        times.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / times.length
    );

    return {
        median: median.toFixed(2),
        mean: mean.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
        stdDev: stdDev.toFixed(2),
        count: times.length
    };
}

async function main() {
    const nextStats = await measure(NEXT_URL, "Next.js Application");
    const blazorStats = await measure(BLAZOR_URL, "Blazor WASM Application");

    console.log("\n Final Report:\n");
    console.table({
        "Warmup Count": {
            "Next.js Application": WARMUP_COUNT,
            "Blazor WASM Application": WARMUP_COUNT
        },
        "Test Count": {
            "Next.js Application": TEST_COUNT,
            "Blazor WASM Application": TEST_COUNT
        },
        "Median Load Time (ms)": {
            "Next.js Application": nextStats.median,
            "Blazor WASM Application": blazorStats.median
        },
        "Mean Load Time (ms)": {
            "Next.js Application": nextStats.mean,
            "Blazor WASM Application": blazorStats.mean
        },
        "Min Load Time (ms)": {
            "Next.js Application": nextStats.min,
            "Blazor WASM Application": blazorStats.min
        },
        "Max Load Time (ms)": {
            "Next.js Application": nextStats.max,
            "Blazor WASM Application": blazorStats.max
        },
        "Standard Deviation (ms)": {
            "Next.js Application": nextStats.stdDev,
            "Blazor WASM Application": blazorStats.stdDev
        }
    });
}

main();
