/**
 * test-countries.js
 * Tests the streaming pipeline for all new countries.
 * Run:  node test-countries.js
 * Requires the server to be running at PORT 3355.
 */

const BASE_URL = 'http://localhost:3355';
const MESSAGE   = 'I need a quick loan';

const NEW_COUNTRIES = [
    { code: 'co', name: 'Colombia'     },
    { code: 'de', name: 'Germany'      },
    { code: 'kz', name: 'Kazakhstan'   },
    { code: 'lk', name: 'Sri Lanka'    },
    { code: 'my', name: 'Malaysia'     },
    { code: 'pe', name: 'Peru'         },
    { code: 'ph', name: 'Philippines'  },
    { code: 'ro', name: 'Romania'      },
    { code: 'ua', name: 'Ukraine'      },
    { code: 'vn', name: 'Vietnam'      },
    { code: 'za', name: 'South Africa' },
];

// ---------------------------------------------------------------------------
// SSE stream parser
// ---------------------------------------------------------------------------

async function readSSEStream(response) {
    const reader   = response.body.getReader();
    const decoder  = new TextDecoder();
    let   buffer   = '';
    const events   = [];

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop();          // keep the incomplete trailing chunk

        for (const chunk of chunks) {
            if (!chunk.trim()) continue;

            let eventName = 'message';
            let dataLine  = '';

            for (const line of chunk.split('\n')) {
                if (line.startsWith('event: ')) eventName = line.slice(7).trim();
                if (line.startsWith('data: '))  dataLine  = line.slice(6).trim();
            }

            if (!dataLine) continue;
            try {
                events.push({ event: eventName, data: JSON.parse(dataLine) });
            } catch {
                // non-JSON data line – ignore
            }
        }
    }

    return events;
}

// ---------------------------------------------------------------------------
// Single-country test
// ---------------------------------------------------------------------------

async function testCountry({ code, name }) {
    const PAD = 60;
    const header = ` ${code.toUpperCase()} – ${name} `;
    const side   = Math.floor((PAD - header.length) / 2);
    console.log('\n' + '─'.repeat(side) + header + '─'.repeat(PAD - side - header.length));

    let response;
    try {
        response = await fetch(`${BASE_URL}/api/ai/message/stream`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                message: MESSAGE,
                params:  { country: code },
                source:  'app',
                content_types: ['app_offers'],
            }),
        });
    } catch (err) {
        console.error('  ✗ Connection failed:', err.message);
        return;
    }

    if (!response.ok) {
        const text = await response.text();
        console.error(`  ✗ HTTP ${response.status}:`, text);
        return;
    }

    const events = await readSSEStream(response);

    // ── Tools ──────────────────────────────────────────────────────────────
    const toolUsageEvents = events.filter(e => e.event === 'tool-usage');
    const finalTools = toolUsageEvents.at(-1)?.data?.tools ?? [];

    if (finalTools.length === 0) {
        console.log('  (no tools ran)');
    } else {
        console.log('  Tools:');
        for (const t of finalTools) {
            const icon = t.status === 'done' ? '✓' : t.status === 'error' ? '✗' : '○';
            console.log(`    ${icon} ${t.name.padEnd(28)} [${t.status}]`);
        }
    }

    // ── Offers ─────────────────────────────────────────────────────────────
    const doneEvent   = events.find(e => e.event === 'done' || e.event === 'message-complete');
    const answer      = doneEvent?.data?.answer ?? [];
    const offersBlock = answer.find(a => a.type === 'app_offers');
    const offers      = offersBlock?.content ?? [];

    console.log(`  Offers returned: ${offers.length}`);
    for (const o of offers) {
        console.log(`    [${String(o.id).padStart(5)}] ${o.name}`);
    }

    // ── Error events ───────────────────────────────────────────────────────
    const errorEvents = events.filter(e => e.event === 'error');
    for (const e of errorEvents) {
        console.warn('  ⚠ stream error:', e.data?.message);
    }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
    // Quick health check first
    try {
        const hc = await fetch(`${BASE_URL}/api/health`);
        if (!hc.ok) throw new Error(`status ${hc.status}`);
        console.log(`✓ Server is up at ${BASE_URL}`);
    } catch (err) {
        console.error(`✗ Server not reachable at ${BASE_URL} – start it first (npm start)\n  ${err.message}`);
        process.exit(1);
    }

    console.log(`\nMessage sent to all countries: "${MESSAGE}"\n`);

    for (const country of NEW_COUNTRIES) {
        await testCountry(country);
    }

    console.log('\n' + '─'.repeat(60));
    console.log('Done.');
}

main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
