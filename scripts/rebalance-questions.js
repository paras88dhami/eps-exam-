// One-time migration planner: prints an apply_patch patch, never writes data.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

let seed = 20260919;
function shuffle(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((seed / 4294967296) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
const changes = [];
for (let set = 1; set <= 5; set++) {
  const files = ['reading', 'listening'].map(section => {
    const path = `data/set-${String(set).padStart(3, '0')}/${section}.json`;
    const before = readFileSync(path, 'utf8');
    return { path, before, questions: JSON.parse(before) };
  });
  const all = files.flatMap(file => file.questions);
  const distribution = all.reduce((counts, q) => (counts[q.answer]++, counts), [0, 0, 0, 0]);
  const balanced = distribution.every(count => count === 10);
  const targets = shuffle(Array.from({ length: 40 }, (_, i) => i % 4));
  for (const [index, q] of all.entries()) {
    const before = structuredClone(q);
    assert.equal(q.options.length, 4);
    if (!balanced) {
      const correct = q.answer;
      const order = shuffle([0, 1, 2, 3].filter(i => i !== correct));
      order.splice(targets[index], 0, correct);
      q.options = order.map(i => before.options[i]);
      if (before.audio?.optionsAudio) q.audio.optionsAudio = order.map(i => before.audio.optionsAudio[i]);
      q.answer = targets[index];
      assert.deepEqual(q.options[q.answer], before.options[correct]);
      if (before.audio?.optionsAudio) {
        assert.equal(q.audio.optionsAudio[q.answer], before.audio.optionsAudio[correct]);
        for (let i = 0; i < 4; i++) assert.deepEqual([q.options[i], q.audio.optionsAudio[i]], [before.options[order[i]], before.audio.optionsAudio[order[i]]]);
      }
    }
    if (q.id === 33 && q.audio.mode === 'tts') {
      q.audio.dialogue = q.audio.text.split('\n').flatMap(line => {
        const match = /^(남자|여자):\s*(.*)$/.exec(line);
        assert.ok(match, `Unrecognized dialogue: ${line}`);
        if (/^_+$/.test(match[2])) return [];
        return [{ speaker: match[1] === '남자' ? 'male' : 'female', text: match[2] }];
      });
      assert.equal(q.audio.dialogue.length, 2);
      q.audio.mode = 'dialogue';
      delete q.audio.text;
    }
  }
  assert.deepEqual(all.reduce((counts, q) => (counts[q.answer]++, counts), [0, 0, 0, 0]), [10, 10, 10, 10]);
  for (const file of files) {
    const after = JSON.stringify(file.questions, null, 2) + '\n';
    if (after.trim() !== file.before.trim()) changes.push({ ...file, after });
  }
}
console.log('*** Begin Patch');
for (const { path, before, after } of changes) {
  console.log(`*** Update File: ${path}\n@@`);
  console.log(before.trimEnd().split(/\r?\n/).map(line => '-' + line).join('\n'));
  console.log(after.trimEnd().split('\n').map(line => '+' + line).join('\n'));
}
console.log('*** End Patch');
