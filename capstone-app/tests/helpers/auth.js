export function createTestToken(claims) {
  const encode = (value) => btoa(JSON.stringify(value))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
    exp: Math.floor(Date.now() / 1000) + 3600,
    purpose: "session",
    ...claims,
  })}.test-signature`;
}
