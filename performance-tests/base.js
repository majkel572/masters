const { chromium, firefox } = require('playwright');

const WARMUP_COUNT = 20;
const TEST_COUNT = 100;

const TARGETS = {
    "Next.js Application": "http://localhost:3000",
    "Blazor WASM Application": "http://localhost:5000"
};

const browsers = [chromium, firefox];
const browserNames = ['chromium', 'firefox'];
const browsersList = ['chromium', 'firefox'];
const apps = ['Next.js Application', 'Blazor WASM Application'];
const metrics = ['fcp', 'lcp', 'tti'];
const stats = ['median', 'mean', 'min', 'max', 'stdDev'];

async function createContext(browser) {
    return await browser.newContext({
        bypassCSP: true,
        javaScriptEnabled: true,
        ignoreHTTPSErrors: true,
        locale: 'en-US',
        userAgent: 'performance-benchmark',
        permissions: [],
        colorScheme: 'light',
        viewport: { width: 1280, height: 720 },
    });
}

async function runScenario({ browserType, appName, url, count, collectVitals, getVitals }) {
    const browser = await browserType.launch();
    const context = await createContext(browser);
    const page = await context.newPage();
    const fcpTimes = [];
    const lcpTimes = [];
    const ttiTimes = [];
    for (let i = 0; i < count; i++) {
        try {
            await context.clearCookies();
            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
            if (collectVitals && getVitals) {
                const vitals = await getVitals(page);
                fcpTimes.push(vitals.fcp);
                lcpTimes.push(vitals.lcp);
                ttiTimes.push(vitals.tti);
            }
        } catch (err) {
            if (collectVitals) {
                fcpTimes.push(NaN);
                lcpTimes.push(NaN);
                ttiTimes.push(NaN);
            }
            console.warn(`${collectVitals ? 'Test' : 'Warmup'} error: ${err.message}`);
        }
    }
    await browser.close();
    if (collectVitals) {
        return {
            fcp: fcpTimes,
            lcp: lcpTimes,
            tti: ttiTimes
        };
    }
    return null;
}

module.exports = {
    createContext,
    runScenario,
    chromium,
    firefox,
    WARMUP_COUNT,
    TEST_COUNT,
    TARGETS,
    browsers,
    browserNames,
    browsersList,
    apps,
    metrics,
    stats
}; 