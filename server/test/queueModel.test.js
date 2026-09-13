const assert = require("node:assert/strict");
const test = require("node:test");
const Queue = require("../src/models/Queue");

test("queue sequences use the category/type counter and preserve prefixes", async () => {
  const calls = [];
  const connection = {
    async query(sql, values) {
      calls.push({ sql, values });
      return calls.length === 2 ? [[{ last_number: 7 }]] : [{}];
    },
  };

  assert.equal(
    await Queue.nextQueueNumber({ category: "dental", type: "priority" }, connection),
    "P-007",
  );
  assert.deepEqual(calls[0].values, ["dental", "priority"]);
});
