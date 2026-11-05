const { normalizeNamePart, normalizeMiddleName, normalizeSuffix } = require("./name");
const { normalizePhilippineMobilePhone } = require("./phone");

const invalid = (message) => Object.assign(new Error(message), { status: 400 });

const requiredText = (value, label) => {
  const text = normalizeNamePart(value, label, 100);
  if (!text) throw invalid(`${label} is required.`);
  return text;
};

const mobile = (value, label, optional = false) => {
  if (optional && (value === null || (typeof value === "string" && !value.trim()))) return null;
  const number = typeof value === "string" && /^[+\d ()-]+$/.test(value.trim()) &&
    normalizePhilippineMobilePhone(value);
  if (!number) throw invalid(`${label} must be a valid Philippine mobile number (09xxxxxxxxx).`);
  return number;
};

const commonFields = {
  first_name: (value) => requiredText(value, "First name"),
  middle_name: normalizeMiddleName,
  last_name: (value) => requiredText(value, "Last name"),
  suffix: normalizeSuffix,
  contact_number: (value) => mobile(value, "Contact number"),
};

const patientFields = {
  ...commonFields,
  barangay: (value) => requiredText(value, "Barangay"),
  city: (value) => requiredText(value, "City"),
  philhealth_id: (value) => normalizeNamePart(value, "PhilHealth ID", 20),
  emergency_contact: (value) => normalizeNamePart(value, "Emergency contact", 100),
  emg_contact_no: (value) => mobile(value, "Emergency contact number", true),
};

function normalizeProfileChanges(body, isPatient = false) {
  if (!body || typeof body !== "object" || Array.isArray(body) || !Object.keys(body).length) {
    throw invalid("Provide at least one profile field to update.");
  }
  const fields = isPatient ? patientFields : commonFields;
  return Object.fromEntries(Object.entries(body).map(([key, value]) => {
    if (!Object.hasOwn(fields, key)) throw invalid("One or more fields cannot be edited here.");
    return [key, fields[key](value)];
  }));
}

module.exports = { normalizeProfileChanges };
