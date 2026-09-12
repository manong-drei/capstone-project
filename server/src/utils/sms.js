const SEMAPHORE_API_URL = "https://api.semaphore.co/api/v4/messages";

async function sendSMS(number, message) {
  const apiKey = process.env.SMS_API_KEY;
  if (!apiKey) {
    throw new Error("Wrong env.");
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    number,
    message,
  });

  if (process.env.SMS_SENDER_NAME) {
    params.append("sendername", process.env.SMS_SENDER_NAME);
  }

  const response = await fetch(SEMAPHORE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Semaphore API request failed with status ${response.status}.`,
    );
  }
  return data;
}

module.exports = { sendSMS };
