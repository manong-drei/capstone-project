import assert from "node:assert/strict";
import test from "node:test";
import { getNameFields } from "../src/utils/nameDisplay.js";

test("name columns use last/first order, an uppercase middle initial, and the saved suffix", () => {
  assert.deepEqual(getNameFields({ last_name: " Dela Cruz ", first_name: " Juan Pedro ", middle_name: " santos ", suffix: " Jr. " }), [
    ["Last name", "Dela Cruz"], ["First name", "Juan Pedro"], ["Middle initial", "S."], ["Suffix", "Jr."],
  ]);
  assert.equal(getNameFields({ middle_name: "S." })[2][1], "S.");
  for (const middle_name of [undefined, null, "", "   "]) {
    assert.deepEqual(getNameFields({ middle_name }).map(([, value]) => value), ["—", "—", "—", "—"]);
  }
});
