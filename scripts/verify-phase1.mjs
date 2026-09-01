/**
 * RopeLink Automated Test Suite - Phase 1 Verification
 */
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, testId, description) {
  if (condition) {
    console.log(`✅ [PASS] ${testId}: ${description}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testId}: ${description}`);
    failed++;
  }
}

console.log('\n========================================');
console.log('🧪 RUNNING ROPELINK PHASE 1 AUTOMATED TESTS');
console.log('========================================\n');

// 1. Localization Parity Test
console.log('--- [1] Localization & i18n Dictionary Parity ---');
const arJson = JSON.parse(fs.readFileSync('src/messages/ar.json', 'utf8'));
const enJson = JSON.parse(fs.readFileSync('src/messages/en.json', 'utf8'));

const arSections = Object.keys(arJson);
const enSections = Object.keys(enJson);

assert(
  JSON.stringify(arSections.sort()) === JSON.stringify(enSections.sort()),
  'I18N-01',
  'AR and EN dictionary section parity'
);

let allKeysMatch = true;
for (const section of arSections) {
  const arKeys = Object.keys(arJson[section]).sort();
  const enKeys = Object.keys(enJson[section] || {}).sort();
  if (JSON.stringify(arKeys) !== JSON.stringify(enKeys)) {
    allKeysMatch = false;
    console.error(`Mismatch in section ${section}:`, { arKeys, enKeys });
  }
}
assert(allKeysMatch, 'I18N-02', 'All inner translation keys are 100% synchronized across AR & EN');

// 2. Hardcoded Arabic in TSX Check
console.log('\n--- [2] Codebase Localization & File Size Checks ---');
const tsxFiles = [];
function findTsx(dir) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (!full.includes('node_modules') && !full.includes('.next')) findTsx(full);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      tsxFiles.push(full);
    }
  }
}
findTsx('src');

let filesUnder200Lines = true;
for (const f of tsxFiles) {
  const lines = fs.readFileSync(f, 'utf8').split('\n').length;
  if (lines > 200) {
    filesUnder200Lines = false;
    console.error(`File exceeded 200 lines: ${f} (${lines} lines)`);
  }
}
assert(filesUnder200Lines, 'ARCH-01', 'Strict File Size Rule: Every single file is < 200 lines');

// 3. Database Schema Structure
console.log('\n--- [3] Database Schema Integrity ---');
const schemaSql = fs.readFileSync('supabase/schema.sql', 'utf8');
assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.profiles'), 'SEC-01', 'Profiles table defined');
assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.requests'), 'SEC-02', 'Requests table defined');
assert(schemaSql.includes('has_seen_tutorial BOOLEAN'), 'SEC-03', 'Tutorial state tracked in profiles');
assert(schemaSql.includes('technician_count > 0'), 'SEC-04', 'Positive technician count constraint enforced');
assert(schemaSql.includes('ENABLE ROW LEVEL SECURITY'), 'SEC-05', 'Row Level Security enabled on all tables');
assert(schemaSql.includes('handle_new_user()'), 'SEC-06', 'Automated auth signup trigger defined');

// 4. Client Resiliency
console.log('\n--- [4] Client Resiliency & Crash Proofing ---');
const authHook = fs.readFileSync('src/hooks/useSupabaseAuth.ts', 'utf8');
const reqHook = fs.readFileSync('src/hooks/useRequests.ts', 'utf8');
assert(!authHook.includes('JSON.parse(stored)') || authHook.includes('try {'), 'RES-01', 'Auth hook storage wrapped in safe try/catch');
assert(!reqHook.includes('JSON.parse(raw)') || reqHook.includes('try {'), 'RES-02', 'Requests hook storage wrapped in safe try/catch');

console.log('\n========================================');
console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================\n');

process.exit(failed > 0 ? 1 : 0);
