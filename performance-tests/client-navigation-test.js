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
            let vitals = { fcp: NaN, lcp: NaN, tti: NaN };
            if (collectVitals) {
                vitals = await getWebVitals(page);
            }
            // Navigation time measurement in Node.js
            let navTime = NaN;
            try {
                const navTriggerSelector = '[data-testid="navigate"], a, button';
                const destinationSelector = 'h1';
                // Wait for navigation trigger to be available
                await page.waitForSelector(navTriggerSelector, { timeout: 5000 });
                const start = Date.now();
                await page.click(navTriggerSelector);
                await page.waitForFunction(() => {
                    const h1 = document.querySelector('h1');
                    return h1 && h1.textContent && h1.textContent !== 'Client Navigation Test';
                }, { timeout: 10000 });
                navTime = Date.now() - start;
            } catch (e) {
                navTime = NaN;
            }
            if (collectVitals) {
                fcpTimes.push(vitals.fcp);
                lcpTimes.push(vitals.lcp);
                ttiTimes.push(vitals.tti);
                navigationTimes.push(navTime);
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
        getVitals: getWebVitals,
        runScenario: runScenarioWithNavigationTime,
        analyzeResults
    });

    const table = generate_count_table(browsersList, apps, WARMUP_COUNT, TEST_COUNT);
    for (const metric of metrics) {
        for (const stat of stats) {
            let statLabel = statTranslations[stat] || stat.charAt(0).toUpperCase() + stat.slice(1);
            if (metric === 'navigation_time') statLabel = 'Średni czas nawigacji';
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
    const exampleRow = table['Średni czas nawigacji NAVIGATION_TIME (ms)'];
    if (exampleRow) {
        console.log('Średni czas nawigacji NAVIGATION_TIME (ms)', ...allColumns.map(col => exampleRow[col]));
    }

    console.log("\nFinal Report:\n");
    console.table(table);

    saveRawResults(rawResults, metrics, apps, browsersList, folderName);
    saveSummaryTable(table, folderName, summaryFileName, columnLabelMap);
}

main(); 