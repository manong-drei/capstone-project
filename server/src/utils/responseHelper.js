exports.success = (res, data = {}, message = "OK", status = 200) =>
  res.status(status).json({ success: true, message, ...data });

exports.fail = (res, message = "Something went wrong.", status = 400) =>
  res.status(status).json({ success: false, message });
