const { once } = require("node:events");
const assert = require("node:assert/strict");
const test = require("node:test");
const app = require("../src/server");

test("profile polling and credential attempts do not share the rate limit", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, "listening");
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/auth`;

  for (let i = 0; i < 101; i++) {
    const profile = await fetch(`${baseUrl}/profile`);
    assert.equal(profile.status, 401);
    await profile.text();
  }

  for (let i = 0; i <= 100; i++) {
    const login = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(login.status, i === 100 ? 429 : 401);
    if (login.status === 429) assert.ok(Number(login.headers.get("retry-after")) > 0);
    await login.text();
  }

  const profile = await fetch(`${baseUrl}/profile`);
  assert.equal(profile.status, 401);
  await profile.text();
});
