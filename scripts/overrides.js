#!/usr/bin/env node

/**
 * Check team-overrides.json, the ledger of team smial files that override a base smial file. A team file that
 * wins in a team kit and shadows a base file needs an entry, and an entry is stale when the base file changed
 * after the team file was written. Review the team file, then accept the new base.
 *
 * Usage: node scripts/overrides.js [--accept]
 *
 *   --accept  Add missing entries, rewrite every sha1 to the current base file and drop entries whose files no longer exist.
 *             Exits 1 while a team file has an ambiguous base, which accepting cannot resolve.
 */

import { loadManifest, loadOverrides, log, overridesOutcome, saveOverrides } from './helpers.js';

const { lines, ledger, code } = overridesOutcome(loadManifest(), loadOverrides(), process.argv.slice(2).includes('--accept'));

if (ledger !== null) {
    saveOverrides(ledger);
}

lines.forEach(([message, color]) => log(message, color));
process.exit(code);
