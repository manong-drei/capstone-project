function parsePagination(query = {}, defaultLimit = 10) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? defaultLimit);
  if (
    !Number.isSafeInteger(page) || page < 1 ||
    !Number.isSafeInteger(limit) || limit < 1 || limit > 100 ||
    !Number.isSafeInteger((page - 1) * limit) ||
    (query.page !== undefined && (typeof query.page !== "string" || !/^[1-9]\d*$/.test(query.page))) ||
    (query.limit !== undefined && (typeof query.limit !== "string" || !/^[1-9]\d*$/.test(query.limit)))
  ) {
    throw Object.assign(new Error("Use a positive page number and a limit between 1 and 100."), { status: 400 });
  }
  return { page, limit };
}

module.exports = { parsePagination };
