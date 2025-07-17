const { browsers, browserNames, WARMUP_COUNT, TEST_COUNT, TARGETS, browsersList, apps, metrics } = require('./base');
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

async function main() {
    const folderName = 'static-text-rendering-test';
    const summaryFileName = 'summary_static-text-rendering-test.csv';

    const { report, rawResults } = await run_full_benchmark({
        TARGETS,
        browsers,
        browserNames,
        WARMUP_COUNT,
        TEST_COUNT,
        getVitals: getWebVitals,
        runScenario,
        analyzeResults
    });

    const table = generate_count_table(browsersList, apps, WARMUP_COUNT, TEST_COUNT);
    for (const metric of metrics) {
        for (const stat of stats) {
            const statLabel = statTranslations[stat] || stat.charAt(0).toUpperCase() + stat.slice(1);
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
    const exampleRow = table['Średnia FCP (ms)'];
    if (exampleRow) {
        console.log('Średnia FCP (ms)', ...allColumns.map(col => exampleRow[col]));
    }

    console.log("\nFinal Report:\n");
    console.table(table);

    saveRawResults(rawResults, metrics, apps, browsersList, folderName);
    saveSummaryTable(table, folderName, summaryFileName, columnLabelMap);
}

main();
