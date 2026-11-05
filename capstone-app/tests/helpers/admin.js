export async function selectAdminSection(page, name) {
  const group = ["Accounts", "Doctors", "Leave Requests", "Patients History"].includes(name) ? "Management"
    : ["Notifications", "Audit Logs"].includes(name) ? "Activity"
      : name === "Statistics/Analytics" ? "Analytics" : name;
  const navigation = page.getByRole("navigation", { name: "Admin navigation", exact: true });
  await navigation.waitFor();
  const menu = navigation.getByRole("button", { name: "Open menu", exact: true });
  if (page.viewportSize().width <= 640) await menu.click();
  const button = navigation.getByRole("button", { name: group, exact: true }).filter({ visible: true });
  await button.click();
  if (name === "Accounts" || name === "Patients History") {
    await page.getByRole("group", { name: "Management sections" }).getByRole("button", { name: name === "Accounts" ? "Accounts" : "Patient history", exact: true }).click();
  }
  if (name === "Leave Requests") await page.getByRole("heading", { name: "Leave Requests", exact: true }).scrollIntoViewIfNeeded();
  if (name === "Audit Logs") await page.getByRole("combobox", { name: "Activity view" }).selectOption("auditlogs");
}
