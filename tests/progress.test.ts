import assert from "node:assert/strict";
import test from "node:test";
import { freshProgress, parseProgress, grade, getTasks, refillHearts } from "../src/lib/progress";

const key1 = getTasks(1, 0)[0].key;
const key2 = getTasks(2, 0)[0].key;

test("Correct answers survive serialization, remain separate by module, and are idempotent", () => {
  let state = grade(freshProgress(), key1, true);
  assert.equal(state.points, 10);
  assert.deepEqual(state.completed, [key1]);
  state = grade(state, key1, true);
  assert.equal(state.points, 10);
  state = grade({ ...state, activeModule: 2 }, key2, true);
  const restored = parseProgress(JSON.stringify(state));
  assert.equal(restored.points, 20);
  assert.equal(restored.activeModule, 2);
  assert.deepEqual(restored.completed, [key1, key2]);
});

test("Mistakes cost hearts, practice restores them, and refill spends points once", () => {
  let state = grade(freshProgress(), key1, false);
  assert.equal(state.hearts, 4);
  state = grade(state, key1, false, true);
  assert.equal(state.hearts, 4);
  state = grade(state, key1, true, true);
  assert.equal(state.hearts, 5);
  assert.equal(state.points, 10);
  state = { ...state, hearts: 0 };
  assert.deepEqual(grade(state, key2, true), state);
  state = refillHearts(state);
  assert.equal(state.hearts, 5);
  assert.equal(state.points, 0);
  assert.deepEqual(refillHearts(state), state);
});

test("Invalid stored data is safe and unknown answers cannot inflate progress", () => {
  assert.deepEqual(parseProgress("not json"), freshProgress());
  assert.deepEqual(parseProgress(null), freshProgress());
  assert.deepEqual(parseProgress('{"schema":99}'), freshProgress());
  const restored = parseProgress(JSON.stringify({schema:1, completed:[key1,key1,"unknown"], hearts:90, points:-10, activeModule:42}));
  assert.deepEqual(restored.completed, [key1]);
  assert.equal(restored.hearts, 5);
  assert.equal(restored.points, 0);
  assert.equal(restored.activeModule, 1);
  assert.throws(() => grade(freshProgress(), "unknown", true));
});
