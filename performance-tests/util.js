const fs = require('fs');
const path = require('path');

function analyzeResults(times) {
    const filtered = times.filter(x => !isNaN(x));
    if (filtered.length === 0) {
        return { median: NaN, mean: NaN, min: NaN, max: NaN, stdDev: NaN, var: NaN, count: 0, raw: times };
    }
    const sorted = filtered.slice().sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const mean = filtered.reduce((a, b) => a + b, 0) / filtered.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const stdDev = Math.sqrt(filtered.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / filtered.length);
    const variance = filtered.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (filtered.length - 1);
    return {
        median: median.toFixed(2),
        mean: mean.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
        stdDev: stdDev.toFixed(2),
        var: variance.toFixed(2),
        count: filtered.length,
        raw: times
    };
}

async function getWebVitals(page) {
    return await page.evaluate(async () => {
        function getTTI() {
            return new Promise(resolve => {
                if (document.readyState === 'complete') {
                    setTimeout(() => resolve(performance.now()), 0);
                } else {
                    window.addEventListener('load', () => {
                        setTimeout(() => resolve(performance.now()), 0);
                    });
                }
            });
        }
        let fcp = 0;
        let lcp = 0;
        let tti = 0;
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
        if (fcpEntry) {
            fcp = fcpEntry.startTime;
        } else {
            await new Promise(resolve => {
                new PerformanceObserver((entryList, observer) => {
                    for (const entry of entryList.getEntries()) {
                        if (entry.name === 'first-contentful-paint') {
                            fcp = entry.startTime;
                            observer.disconnect();
                            resolve();
                        }
                    }
                }).observe({ type: 'paint', buffered: true });
            });
        }
        await new Promise(resolve => {
            new PerformanceObserver((entryList, observer) => {
                for (const entry of entryList.getEntries()) {
                    lcp = entry.startTime;
                }
                observer.disconnect();
                resolve();
            }).observe({ type: 'largest-contentful-paint', buffered: true });
        });
        tti = await getTTI();
        return {
            fcp,
            lcp,
            tti
        };
    });
}

function saveRawResults(rawResults, metrics, apps, browsersList, folderName) {
    for (const app of apps) {
        for (const browser of browsersList) {
            for (const metric of metrics) {
                let arr = [];
                if (rawResults[app][browser][metric] && rawResults[app][browser][metric].raw) {
                    arr = rawResults[app][browser][metric].raw;
                }
                if (!arr || arr.length === 0) continue;
                const safeApp = app.replace(/\s+/g, '').replace(/\./g, '').replace(/\//g, '');
                const folder = path.join(__dirname, folderName);
                if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
                const filename = path.join(folder, `results-${metric}-${safeApp}-${browser}.csv`);
                fs.writeFileSync(filename, arr.join("\n"));
                console.log(`Saved raw ${metric} results for ${app} (${browser}) to ${filename}`);
            }
        }
    }
}

function saveSummaryTable(table, folderName, summaryFileName, columnLabelMap) {
    const summaryFolder = path.join(__dirname, folderName);
    if (!fs.existsSync(summaryFolder)) fs.mkdirSync(summaryFolder, { recursive: true });
    const summaryFile = path.join(summaryFolder, summaryFileName);
    const allColumns = Object.keys(table[Object.keys(table)[0]]);

    const header = ['Metryka', ...allColumns.map(col => columnLabelMap?.[col] || col)];
    const rows = [header.join(',')];
    for (const [metric, values] of Object.entries(table)) {
        const row = [metric];
        for (const col of allColumns) {
            row.push(values[col] !== undefined ? values[col] : '');
        }
        rows.push(row.join(','));
    }
    fs.writeFileSync(summaryFile, rows.join('\n'));
    console.log(`Saved summary table to ${summaryFile}`);
}

function generate_count_table(browsersList, apps, WARMUP_COUNT, TEST_COUNT) {
    const table = {
        'Liczba rozgrzewek': {},
        'Liczba testów': {}
    };
    for (const browser of browsersList) {
        for (const app of apps) {
            table['Liczba rozgrzewek'][`${app} (${browser})`] = WARMUP_COUNT;
            table['Liczba testów'][`${app} (${browser})`] = TEST_COUNT;
        }
    }
    return table;
}

async function run_full_benchmark({ TARGETS, browsers, browserNames, WARMUP_COUNT, TEST_COUNT, getVitals, runScenario, analyzeResults }) {
    const report = {};
    const rawResults = {};
    for (const [appName, url] of Object.entries(TARGETS)) {
        report[appName] = {};
        rawResults[appName] = {};
        for (let i = 0; i < browsers.length; i++) {
            const browserType = browsers[i];
            const browserName = browserNames[i];

            console.log(`\n[${browserType.name()}] Warming up: ${appName}`);
            await runScenario({ browserType, appName, url, count: WARMUP_COUNT, collectVitals: false });

            console.log(`\n[${browserType.name()}] Testing: ${appName}`);
            const raw = await runScenario({ browserType, appName, url, count: TEST_COUNT, collectVitals: true, getVitals });

            report[appName][browserName] = {
                fcp: analyzeResults(raw.fcp),
                lcp: analyzeResults(raw.lcp),
                tti: analyzeResults(raw.tti)
            };
            rawResults[appName][browserName] = report[appName][browserName];
        }
    }
    return { report, rawResults };
}

module.exports = {
    analyzeResults,
    getWebVitals,
    saveRawResults,
    saveSummaryTable,
    generate_count_table,
    run_full_benchmark
}; 