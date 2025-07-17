const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function findTestScripts() {
    return fs.readdirSync(__dirname)
        .filter(f => f.endsWith('-test.js'))
        .sort();
}

function runScript(script) {
    return new Promise((resolve, reject) => {
        console.log(`\n=== Running ${script} ===`);
        const proc = spawn('node', [script], { stdio: 'inherit' });
        proc.on('close', code => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`${script} exited with code ${code}`));
            }
        });
    });
}

async function runAll() {
    const scripts = findTestScripts();
    for (let i = 0; i < scripts.length; i++) {
        try {
            await runScript(scripts[i]);
            if (i < scripts.length - 1) {
                console.log('Waiting 2 seconds before next test...');
                await new Promise(res => setTimeout(res, 2000));
            }
        } catch (err) {
            console.error(err.message);
            process.exit(1);
        }
    }
    console.log('\nAll tests completed.');
}

runAll(); 