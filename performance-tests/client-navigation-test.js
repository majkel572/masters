const { browsers, browserNames, WARMUP_COUNT, TEST_COUNT, browsersList, apps, metrics: baseMetrics } = require('./base');
const { runScenario } = require('./base');
const { analyzeResults, getWebVitals, saveRawResults, saveSummaryTable, generate_count_table, run_full_benchmark } = require('./util');

const statTranslations = {
    median: 'Mediana',
    mean: 'Średnia',
    min: 'Min',
    max: 'Max',
    stdDev: 'OdchylenieStd'
};

const stats = ['median', 'mean', 'min', 'max', 'stdDev'];

const columnLabelMap = {
    'Next.js Application (chromium)': 'Next (C)',
    'Blazor WASM Application (chromium)': 'Blazor (C)',
    'Next.js Application (firefox)': 'Next (F)',
    'Blazor WASM Application (firefox)': 'Blazor (F)'
};

const TARGETS = {
    "Next.js Application": "http://localhost:3000/client-navigation",
    "Blazor WASM Application": "http://localhost:5000/client-navigation"
};

const metrics = [...baseMetrics, 'navigation_time'];

async function getWebVitalsAndNavigationTime(page) {
    const vitals = await page.evaluate(async () => {
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
        return { fcp, lcp, tti };
    });

    const navigationTime = await page.evaluate(async () => {
        const navTrigger = document.querySelector('[data-testid="navigate"]') || document.querySelector('a,button');
        if (!navTrigger) return NaN;
        return new Promise(resolve => {
            const start = performance.now();
            function onTarget() {
                const h1 = document.querySelector('h1');
                if (h1 && h1.textContent && h1.textContent !== 'Client Navigation Test') {
                    resolve(performance.now() - start);
                    observer.disconnect();
                }
            }
            const observer = new MutationObserver(onTarget);
            observer.observe(document.body, { childList: true, subtree: true });
            navTrigger.click();

            const interval = setInterval(() => {
                const h1 = document.querySelector('h1');
                if (h1 && h1.textContent && h1.textContent !== 'Client Navigation Test') {
                    clearInterval(interval);
                    observer.disconnect();
                    resolve(performance.now() - start);
                }
            }, 10);
        });
    });
    return { ...vitals, navigation_time: navigationTime };
}

async function runScenarioWithNavigationTime({ browserType, appName, url, count, collectVitals }) {
    const browser = await browserType.launch();
    const context = await browser.newContext({
        bypassCSP: true,
        javaScriptEnabled: true,
        ignoreHTTPSErrors: true,
        locale: 'en-US',
        userAgent: 'performance-benchmark',
        permissions: [],
        colorScheme: 'light',
        viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();
    const fcpTimes = [];
    const lcpTimes = [];
    const ttiTimes = [];
    const navigationTimes = [];
    for (let i = 0; i < count; i++) {
        try {
            await context.clearCookies();
            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
            if (collectVitals) {
                const vitals = await getWebVitalsAndNavigationTime(page);
                fcpTimes.push(vitals.fcp);
                lcpTimes.push(vitals.lcp);
                ttiTimes.push(vitals.tti);
                navigationTimes.push(vitals.navigation_time);
            }
        } catch (err) {
            if (collectVitals) {
                fcpTimes.push(NaN);
                lcpTimes.push(NaN);
                ttiTimes.push(NaN);
                navigationTimes.push(NaN);
            }
            console.warn(`${collectVitals ? 'Test' : 'Warmup'} error: ${err.message}`);
        }
    }
    await browser.close();
    if (collectVitals) {
        return {
            fcp: fcpTimes,
            lcp: lcpTimes,
            tti: ttiTimes,
            navigation_time: navigationTimes
        };
    }
    return null;
}

async function main() {
    const folderName = 'client-navigation-test';
    const summaryFileName = 'summary_client-navigation-test.csv';

    const { report, rawResults } = await run_full_benchmark({
        TARGETS,
        browsers,
        browserNames,
        WARMUP_COUNT,
        TEST_COUNT,
        getVitals: getWebVitalsAndNavigationTime,
        runScenario: runScenarioWithNavigationTime,
        analyzeResults
    });

    const table = generate_count_table(browsersList, apps, WARMUP_COUNT, TEST_COUNT);
    for (const metric of metrics) {
        for (const stat of stats) {
            let statLabel = statTranslations[stat] || stat.charAt(0).toUpperCase() + stat.slice(1);
            if (metric === 'navigation_time') statLabel = 'Czas nawigacji';
            const rowName = `${statLabel} ${metric.toUpperCase()} (ms)`;
            table[rowName] = {};
            for (const browser of browsersList) {
                for (const app of apps) {
                    table[rowName][`${app} (${browser})`] = report[app][browser][metric][stat];
                }
            }
        }
    }

    const allColumns = Object.keys(table[Object.keys(table)[0]]);
    const header = ['Metryka', ...allColumns.map(col => columnLabelMap[col] || col)];
    console.log(header.join(' '));
    const exampleRow = table['Średni czas nawigacji (ms)'];
    if (exampleRow) {
        console.log('Czas nawigacji NAVIGATION_TIME (ms)', ...allColumns.map(col => exampleRow[col]));
    }

    console.log("\nFinal Report:\n");
    console.table(table);

    saveRawResults(rawResults, metrics, apps, browsersList, folderName);
    saveSummaryTable(table, folderName, summaryFileName, columnLabelMap);
}

main(); 