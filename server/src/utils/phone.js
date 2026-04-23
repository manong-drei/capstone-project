function normalizePhilippineMobilePhone(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return null;

  const sanitized = raw.replace(/[^\d+]/g, "");

  if (/^09\d{9}$/.test(sanitized)) return sanitized;
  if (/^\+639\d{9}$/.test(sanitized)) return `0${sanitized.slice(3)}`;
  if (/^639\d{9}$/.test(sanitized)) return `0${sanitized.slice(2)}`;

  return null;
}

function isNormalizedPhilippineMobilePhone(input) {
  return /^09\d{9}$/.test(String(input ?? "").trim());
}

module.exports = {
  normalizePhilippineMobilePhone,
  isNormalizedPhilippineMobilePhone,
};
