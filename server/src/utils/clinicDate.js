const clinicDay = (date) =>
  date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
const clinicToday = () => clinicDay(new Date());
const validDate = (value) =>
  typeof value === "string" &&
  /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

module.exports = { clinicDay, clinicToday, validDate };
