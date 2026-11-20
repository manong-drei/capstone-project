const { addMonths, differenceInYears, format, parseISO } = require("date-fns");
const { clinicDay } = require("./clinicDate");

function resolveWalkInPriority(patient, now = new Date(), selectedCategory) {
  const today = parseISO(clinicDay(now));
  const birthDate = patient.date_of_birth instanceof Date
    ? clinicDay(patient.date_of_birth)
    : patient.date_of_birth;
  if (birthDate && differenceInYears(today, parseISO(birthDate)) >= 60) {
    return { priority_category: "senior", priority_expires_at: null };
  }

  const category = selectedCategory === undefined ? patient.priority_category : selectedCategory;
  if (category !== "pregnant") {
    return {
      priority_category: category === "pwd" || category === "senior" ? category : null,
      priority_expires_at: null,
    };
  }

  const savedExpiry = patient.priority_expires_at;
  if (patient.priority_category === "pregnant" && savedExpiry && new Date(savedExpiry) > now) {
    return { priority_category: "pregnant", priority_expires_at: savedExpiry };
  }
  if (selectedCategory === "pregnant") {
    const expiryDay = format(addMonths(today, 9), "yyyy-MM-dd");
    return {
      priority_category: "pregnant",
      priority_expires_at: new Date(`${expiryDay}T00:00:00+08:00`),
    };
  }
  return { priority_category: null, priority_expires_at: null };
}

module.exports = { resolveWalkInPriority };
