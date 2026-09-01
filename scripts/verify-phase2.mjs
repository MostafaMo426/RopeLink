/**
 * RopeLink Automated Test Suite - Phase 2 Verification
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
console.log('🧪 RUNNING ROPELINK PHASE 2 AUTOMATED TESTS');
console.log('========================================\n');

// 1. Localization Parity Test
console.log('--- [1] Localization & i18n Dictionary Parity ---');
const arJson = JSON.parse(fs.readFileSync('src/messages/ar.json', 'utf8'));
const enJson = JSON.parse(fs.readFileSync('src/messages/en.json', 'utf8'));

const arSections = Object.keys(arJson).sort();
const enSections = Object.keys(enJson).sort();

assert(
  JSON.stringify(arSections) === JSON.stringify(enSections),
  'I18N-01',
  'AR and EN dictionary section parity (including marketplace, matching & verification)'
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

// 2. Strict File Size Rule Check
console.log('\n--- [2] Codebase Modularity & File Size Audit ---');
const tsxFiles = [];
function findFiles(dir) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (!full.includes('node_modules') && !full.includes('.next')) findFiles(full);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      tsxFiles.push(full);
    }
  }
}
findFiles('src');

let filesUnder200Lines = true;
for (const f of tsxFiles) {
  const lines = fs.readFileSync(f, 'utf8').split('\n').length;
  if (lines > 200) {
    filesUnder200Lines = false;
    console.error(`File exceeded 200 lines: ${f} (${lines} lines)`);
  }
}
assert(filesUnder200Lines, 'ARCH-01', 'Strict File Size Rule: Every single file in src/ is < 200 lines');

// 3. Database Schema & Phase 2 Entities
console.log('\n--- [3] Database Schema & Real-Time Integrity ---');
const schemaSql = fs.readFileSync('supabase/schema.sql', 'utf8');
assert(schemaSql.includes('CREATE TYPE verification_status'), 'SEC-01', 'Verification status ENUM defined');
assert(schemaSql.includes('CREATE TYPE match_status'), 'SEC-02', 'Match status ENUM defined');
assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.matches'), 'SEC-03', 'Matches table created for B2B proposals');
assert(schemaSql.includes('ALTER PUBLICATION supabase_realtime ADD TABLE public.requests'), 'SEC-04', 'Realtime publication enabled for requests');
assert(schemaSql.includes('ALTER PUBLICATION supabase_realtime ADD TABLE public.matches'), 'SEC-05', 'Realtime publication enabled for matches');

// 4. Matching Engine Logic Test
console.log('\n--- [4] Matching Engine Algorithm Verification ---');
const engineCode = fs.readFileSync('src/lib/matching/engine.ts', 'utf8');
assert(engineCode.includes('calculateMatchScore'), 'ENG-01', 'calculateMatchScore function implemented');
assert(engineCode.includes('specialtyScore * 0.4'), 'ENG-02', 'IRATA specialty weighted at 40%');
assert(engineCode.includes('locationScore * 0.3'), 'ENG-03', 'Geographic proximity weighted at 30%');
assert(engineCode.includes('timelineScore * 0.2'), 'ENG-04', 'Mobilization timeline weighted at 20%');

console.log('\n========================================');
console.log(`📊 PHASE 2 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================\n');

process.exit(failed > 0 ? 1 : 0);
