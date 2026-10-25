#!/usr/bin/env node

/**
 * Check team-overrides.json, the ledger of team smial files that override a base smial file. An entry is stale
 * when the base file changed after the team file was written. Review the team file, then accept the new base.
 *
 * Usage: node scripts/overrides.js [--accept]
 *
 *   --accept  Rewrite every sha1 to the current base file and drop entries whose files no longer exist.
 */

import fs from 'fs';
import path from 'path';
import { loadOverrides, log, saveOverrides, sha1Of, smialsDir } from './helpers.js';

const accepting = process.argv.slice(2).includes('--accept');
const overrides = loadOverrides();
const stale = [];

for (const [key, entry] of Object.entries(overrides)) {
    const teamFile = path.join(smialsDir, key);
    const baseFile = path.join(smialsDir, entry.base, key.split('/').slice(1).join('/'));

    if (!fs.existsSync(teamFile) || !fs.existsSync(baseFile)) {
        if (accepting) {
            delete overrides[key];
        }

        stale.push(`${key} no longer overrides smials/${entry.base}`);
    } else if (sha1Of(baseFile) !== entry.sha1) {
        if (accepting) {
            entry.sha1 = sha1Of(baseFile);
        }

        stale.push(`${key} is behind smials/${entry.base}`);
    }
}

if (accepting) {
    saveOverrides(overrides);
    log(`Accepted ${stale.length} override(s)`, 'green');
    process.exit(0);
}

stale.forEach(message => log(message, 'yellow'));
log(`${stale.length} stale override(s)`, stale.length > 0 ? 'red' : 'green');
process.exit(stale.length > 0 ? 1 : 0);
