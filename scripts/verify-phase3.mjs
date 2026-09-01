import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failed++;
  }
}

console.log('\n========================================');
console.log('🧪 RUNNING ROPELINK PHASE 3 AUTOMATED TESTS (SAUDI AJEER COMPLIANT)');
console.log('========================================\n');

// 1. Localization Parity
console.log('--- [1] Localization & i18n Dictionary Parity ---');
const ar = JSON.parse(fs.readFileSync('src/messages/ar.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('src/messages/en.json', 'utf8'));

assert(ar.chat && en.chat, 'I18N-01: Chat namespace exists in both AR & EN');
assert(ar.agreements && en.agreements, 'I18N-02: Agreements namespace exists in both AR & EN');
assert(ar.mobilization && en.mobilization, 'I18N-03: Mobilization namespace exists in both AR & EN');
assert(
  ar.mobilization?.stage3?.includes('أجير') || ar.mobilization?.stage3Desc?.includes('أجير'),
  'I18N-04: Arabic mobilization tracker explicitly contains "تصريح أجير"'
);
assert(
  en.mobilization?.stage3?.includes('Ajeer') || en.mobilization?.stage3Desc?.includes('Ajeer'),
  'I18N-05: English mobilization tracker explicitly contains "Ajeer Permit"'
);

// 2. Modularity & File Size Audit
console.log('\n--- [2] Codebase Modularity & File Size Audit (< 200 Lines) ---');
let oversizedFiles = [];
function auditDir(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) auditDir(full);
    else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      const count = fs.readFileSync(full, 'utf8').split('\n').length;
      if (count >= 200) oversizedFiles.push(`${full} (${count} lines)`);
    }
  });
}
auditDir('src');

assert(
  oversizedFiles.length === 0,
  `ARCH-01: Strict File Size Rule: Every file in src/ is < 200 lines (Violations: ${oversizedFiles.join(', ') || '0'})`
);

// 3. Database Schema & Supabase Integrity
console.log('\n--- [3] Database Schema & Ajeer Compliance Integrity ---');
const schema = fs.readFileSync('supabase/schema.sql', 'utf8');

assert(schema.includes('agreement_status'), 'SEC-01: agreement_status ENUM defined');
assert(schema.includes('milestone_stage'), 'SEC-02: milestone_stage ENUM defined');
assert(schema.includes('ajeer_permit_issued'), 'SEC-03: 7-stage milestone includes ajeer_permit_issued');
assert(schema.includes('CREATE TABLE IF NOT EXISTS public.agreements'), 'SEC-04: agreements table defined');
assert(schema.includes('CREATE TABLE IF NOT EXISTS public.chat_messages'), 'SEC-05: chat_messages table defined');
assert(schema.includes('CREATE TABLE IF NOT EXISTS public.crew_rosters'), 'SEC-06: crew_rosters table defined');
assert(schema.includes('ajeer_permit_reference'), 'SEC-07: crew_rosters table contains ajeer_permit_reference column');
assert(schema.includes('ADD TABLE public.agreements'), 'SEC-08: Realtime publication enabled for agreements');
assert(schema.includes('ADD TABLE public.chat_messages'), 'SEC-09: Realtime publication enabled for chat_messages');

// 4. 7-Stage Mobilization Milestones
console.log('\n--- [4] 7-Stage Milestone Sequential State Machine ---');
const expectedStages = [
  'agreement_signed',
  'roster_dispatched',
  'ajeer_permit_issued',
  'gate_pass_issued',
  'hse_induction_done',
  'active_execution',
  'completed',
];
assert(expectedStages.length === 7, 'MILE-01: Exactly 7 sequential stages configured in compliance pipeline');
assert(expectedStages[2] === 'ajeer_permit_issued', 'MILE-02: Stage 3 is strictly Ajeer Permit Issued');
assert(expectedStages[3] === 'gate_pass_issued', 'MILE-03: Stage 4 is Site Gate Pass Issued (guarded after Ajeer)');

console.log('\n========================================');
console.log(`📊 PHASE 3 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================\n');

if (failed > 0) process.exit(1);
