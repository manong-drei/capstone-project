export const SERVICE_CATEGORIES = {
  DENTAL: { id: "dental", label: "Dental Check-up" },
  GENERAL: { id: "general", label: "General Consultation" },
};

export const DENTAL_SERVICES = [
  { id: "CONSULTATION", label: "Dental Check-up", group: null },
  { id: "ORAL_PROPHYLAXIS", label: "Oral Prophylaxis", group: null },
  {
    id: "PERMANENT_FILLING",
    label: "Permanent Filling",
    group: "Restoration (Tooth Filling)",
  },
  {
    id: "TEMPORARY_FILLING",
    label: "Temporary Filling",
    group: "Restoration (Tooth Filling)",
  },
  { id: "FLUORIDE", label: "Fluoride", group: null },
  { id: "SILVER_DIAMINE", label: "Silver Diamine", group: null },
  {
    id: "RPD_UPPER",
    label: "Removable Partial Denture – Upper",
    group: "Removable Partial Denture (Vitaflex)",
  },
  {
    id: "RPD_LOWER",
    label: "Removable Partial Denture – Lower",
    group: "Removable Partial Denture (Vitaflex)",
  },
  {
    id: "CLOSED_EXTRACTION",
    label: "Closed Extraction",
    group: "Dental Surgery",
  },
  { id: "OPEN_EXTRACTION", label: "Open Extraction", group: "Dental Surgery" },
  {
    id: "ODONTECTOMY",
    label: "Odontectomy / Wisdom Tooth Extraction",
    group: "Dental Surgery",
  },
  { id: "SPECIAL_SURGERY", label: "Special Surgery", group: null },
  { id: "OTHERS", label: "Others", group: null },
];

export const GENERAL_SERVICES = [
  { id: "GENERAL_CONSULTATION", label: "General Consultation", group: null },
];

// Backward-compat alias: existing consumers (AdminDashboard, etc.) expect a
// `SERVICES` export. The alias keeps them working without edits and always
// resolves to the dental list — the patient-facing service catalogue.
export const SERVICES = DENTAL_SERVICES;

export const QUEUE_TYPE = {
  REGULAR: "regular",
  PRIORITY: "priority",
};

export const QUEUE_STATUS = {
  WAITING: "waiting",
  SERVING: "serving",
  DONE: "done",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
};
