export function getNameFields(person) {
  const middleName = person.middle_name?.trim();
  return [
    ["Last name", person.last_name?.trim() || "—"],
    ["First name", person.first_name?.trim() || "—"],
    ["Middle initial", middleName ? `${middleName[0].toUpperCase()}.` : "—"],
    ["Suffix", person.suffix?.trim() || "—"],
  ];
}
