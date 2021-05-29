const HotShots = require('hot-shots');
const os = require('os');
const GcStats = require('gc-stats');

const statsClient = new HotShots({
    host: '127.0.0.1',
    port: 8125,
    globalTags: {
        env: process.env.NODE_ENV
    },
});

let gcStats = GcStats();
let interval;

if (interval) {
    return;
}

let intervalStart = Date.now();

gcStats.on('stats', (gcValues) => {
    statsClient.timing('process.gc.delay.ms', gcValues.pauseMS);
    statsClient.gauge('process.gc.reclaimed', Math.abs(gcValues.diff.usedHeapSize));

    if (gcValues.gctype === 1) {
        statsClient.timing('process.gc.minor.delay.ms', gcValues.pauseMS);
        statsClient.gauge('process.gc.minor.reclaimed', Math.abs(gcValues.diff.usedHeapSize));
    } else if (gcValues.gctype === 2) {
        statsClient.timing('process.gc.major.delay.ms', gcValues.pauseMS);
        statsClient.gauge('process.gc.major.reclaimed', Math.abs(gcValues.diff.usedHeapSize));
    } else if (gcValues.gctype === 4) {
        statsClient.timing('process.gc.incremental.delay.ms', gcValues.pauseMS);
        statsClient.gauge('process.gc.incremental.reclaimed', Math.abs(gcValues.diff.usedHeapSize));
    } else if (gcValues.gctype === 8) {
        statsClient.timing('process.gc.weak.delay.ms', gcValues.pauseMS);
        statsClient.gauge('process.gc.weak.reclaimed', Math.abs(gcValues.diff.usedHeapSize));
    } else {
        statsClient.timing('process.gc.all.delay.ms', gcValues.pauseMS);
        statsClient.gauge('process.gc.all.reclaimed', Math.abs(gcValues.diff.usedHeapSize));
    }
});

interval = setInterval(() => {
    const load = os.loadavg();
    const memory = process.memoryUsage();
    const delay = Date.now() - intervalStart;
    const time = process.hrtime();

    intervalStart = Date.now();

    statsClient.gauge('process.cpu.load_1m', load[0]);
    statsClient.gauge('process.memory.resident', memory.rss);
    statsClient.gauge('process.memory.heap_usage', memory.heapUsed);
    statsClient.timing('process.event_loop.delay', delay > 1000 ? delay - 1000 : 0);

    process.nextTick(() => {
        const [seconds, nanoseconds] = process.hrtime(time);
        statsClient.timing('process.event_loop.hr_delay', ((seconds * 1000) + Math.round(nanoseconds / 1000000)));
    });
}, 1000);
