const normalizeNamePart = (value, label, maxLength) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw Object.assign(new Error(`${label} must be a string of up to ${maxLength} characters.`), { status: 400 });
  }
  return value.trim() || null;
};

const normalizeSuffix = (value) => normalizeNamePart(value, "Suffix", 20);
const normalizeMiddleName = (value) => normalizeNamePart(value, "Middle name", 100);

module.exports = { normalizeSuffix, normalizeMiddleName };
