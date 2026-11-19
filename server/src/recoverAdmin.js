const { createInterface } = require("node:readline/promises");
const { userInfo, hostname } = require("node:os");
const pool = require("./config/db");
const { issueWorkforcePassword } = require("./services/accountAccess");

async function main() {
  const id = Number(process.argv[2]);
  if (
    !process.stdin.isTTY ||
    !process.stdout.isTTY ||
    process.argv.length !== 3 ||
    !Number.isSafeInteger(id) ||
    id < 1
  ) {
    throw new Error(
      "Use an interactive terminal and pass the administrator’s numeric user ID.",
    );
  }

  const [[target]] = await pool.query(
    "SELECT phone, credential_version FROM users WHERE user_id = ? AND role = 'admin' AND is_active = 1",
    [id],
  );
  if (!target) throw new Error("Active administrator not found.");

  const terminal = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const confirmation = await terminal.question(
      `Confirm administrator #${id}, phone ending ${target.phone.slice(-4)}. Type the account ID to proceed: `,
    );
    if (confirmation.trim() !== String(id)) return;
    const data = await issueWorkforcePassword(
      id,
      {
        auditActor: {
          name: `Deployment operator ${userInfo().username}@${hostname()}`,
        },
      },
      { operator: true, expectedVersion: target.credential_version },
    );
    console.log(
      `Temporary password: ${data.temp_password}\nExpires: ${data.expires_at}`,
    );
  } finally {
    terminal.close();
  }
}

main()
  .catch((error) => {
    console.error(
      error.status ? error.message : "Administrator recovery did not complete.",
    );
    process.exitCode = 1;
  })
  .finally(() => pool.end());
