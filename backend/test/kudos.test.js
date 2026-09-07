const test = require('node:test');
const assert = require('node:assert');
const { gradeSubmission, HIGHLIGHT_RULES } = require('../src/kudos');

// Frozen "now" so the future-date rule does not drift with the calendar.
const NOW = Date.UTC(2026, 8, 7); // 2026-09-07

const grade = (highlight_type, submission_date, resolution_date) =>
    gradeSubmission({ highlight_type, submission_date, resolution_date, now: NOW });

test('each highlight mirrors one issue_type accepted by /api/ledger', () => {
    assert.deepStrictEqual(
        Object.values(HIGHLIGHT_RULES).map(r => r.mirrors).sort(),
        [
            'Ghosting (No response at all)',
            'SLA Resolution Delay (Fix/Payout)',
            'SLA Response Delay (Triage)',
            'Unjustified Payment Refusal',
            'Unjustified Severity Downgrade'
        ]
    );
});

test('a case closed inside the window is credited, and the elapsed days are derived', () => {
    assert.deepStrictEqual(grade('Fast Triage', '2026-09-01', '2026-09-04'), { elapsed_days: 3 });
    assert.deepStrictEqual(grade('Fast Triage', '2026-08-25', '2026-09-01'), { elapsed_days: 7 });
    assert.deepStrictEqual(grade('Consistent Communication', '2026-08-25', '2026-09-05'), { elapsed_days: 11 });
    assert.deepStrictEqual(grade('Fast Resolution / Payout', '2026-08-10', '2026-09-05'), { elapsed_days: 26 });
});

test('one day past the window is refused, which is the whole point of the gate', () => {
    assert.match(grade('Fast Triage', '2026-08-25', '2026-09-02').error, /within 7 days/);
    assert.match(grade('Consistent Communication', '2026-08-01', '2026-08-16').error, /within 14 days/);
    assert.match(grade('Fast Resolution / Payout', '2026-07-01', '2026-08-01').error, /within 30 days/);
});

test('the two untimed credits accept any span', () => {
    assert.deepStrictEqual(grade('Fair Severity Assessment', '2026-01-01', '2026-09-01'), { elapsed_days: 243 });
    assert.deepStrictEqual(grade('Bounty Paid As Scoped', '2026-01-01', '2026-09-01'), { elapsed_days: 243 });
});

test('an unknown highlight is refused rather than stored as free text', () => {
    assert.strictEqual(grade('Very Nice People', '2026-09-01', '2026-09-02').error, 'Type de retour inconnu.');
});

test('the timeline itself must hold', () => {
    assert.match(grade('Fast Triage', '2026-09-05', '2026-09-01').error, /cannot precede/);
    assert.match(grade('Fast Triage', '2026-09-08', '2026-09-09').error, /future/);
    assert.match(grade('Fast Triage', '2026-09-01', '').error, /required/);
    assert.match(grade('Fast Triage', 'not-a-date', '2026-09-02').error, /required/);
});
