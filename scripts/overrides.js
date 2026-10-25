#!/usr/bin/env node

/**
 * Check team-overrides.json, the ledger of team smial files that override a base smial file. A team file that
 * wins in a team kit and shadows a base file needs an entry, and an entry is stale when the base file changed
 * after the team file was written. Review the team file, then accept the new base.
 *
 * Usage: node scripts/overrides.js [--accept]
 *
 *   --accept  Add missing entries, rewrite every sha1 to the current base file and drop entries whose files no longer exist.
 */

import { loadManifest, loadOverrides, log, reconcileOverrides, saveOverrides } from './helpers.js';

const { messages, accepted } = reconcileOverrides(loadManifest(), loadOverrides());

if (process.argv.slice(2).includes('--accept')) {
    saveOverrides(accepted);
    log(`Accepted ${messages.length} override(s)`, 'green');
    process.exit(0);
}

messages.forEach(message => log(message, 'yellow'));
log(`${messages.length} override problem(s)`, messages.length > 0 ? 'red' : 'green');
process.exit(messages.length > 0 ? 1 : 0);
