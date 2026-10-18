#!/usr/bin/env node

/**
 * Fence kits: protect the main branch of each selected kit repository, so it only
 * changes through pull requests whose tests pass against the latest main. Add --hobbiton
 * to fence Hobbiton itself, requiring its own tests and every kit survey.
 *
 * Branch protection needs public repositories (or GitHub Pro), and gh must be logged in
 * as a repository admin.
 *
 * Usage: node scripts/fence.js [--vue] [--react] ... [--hobbiton]
 */

import { execFileSync } from 'child_process';
import { loadManifest, log, parseArgs } from './helpers.js';

const manifest = loadManifest();
const { kits, flags } = parseArgs(process.argv.slice(2), ['hobbiton'], manifest);

function fence(repository, checks) {
    const protection = {
        required_status_checks: { strict: true, contexts: checks },
        enforce_admins: false,
        required_pull_request_reviews: { required_approving_review_count: 0 },
        restrictions: null,
        allow_force_pushes: false,
        allow_deletions: false,
    };

    try {
        execFileSync('gh', ['api', '--method', 'PUT', `repos/${repository}/branches/main/protection`, '--input', '-'], {
            input: JSON.stringify(protection),
            stdio: ['pipe', 'ignore', 'pipe'],
        });
        log(`Fenced ${repository} (requires ${checks.join(', ')})`, 'green');
    } catch (error) {
        log(`Could not fence ${repository}: ${error.stderr?.toString().trim() || error.message}`, 'red');
        process.exitCode = 1;
    }
}

for (const kit of kits) {
    fence(manifest.kits[kit].repository, ['ci']);
}

if (flags.hobbiton) {
    fence('shire-studio/hobbiton', ['hobbiton', ...Object.values(manifest.kits).map(kit => kit.label)]);
}
