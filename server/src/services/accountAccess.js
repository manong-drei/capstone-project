const bcrypt = require("bcryptjs");
const User = require("../models/User");
const audit = require("./auditLog");

const fail = (status, message) => Object.assign(new Error(message), { status });

async function requireRecoveryActor(
  req,
  connection,
  roles = ["staff", "admin"],
) {
  const actor = await User.findByIdWithHash(req.user.user_id, connection);
  if (
    !actor?.is_active ||
    !roles.includes(actor.role) ||
    actor.must_change_password ||
    actor.credential_version !== req.user.credential_version
  ) {
    throw fail(403, "Sign in again before recovering an account.");
  }
  return actor;
}

async function requireRecoveryPassword(req, connection, roles) {
  const password = req.body?.staff_password;
  if (typeof password !== "string" || !password || password.length > 128) {
    throw fail(400, "Enter your sign-in password.");
  }
  const actor = await requireRecoveryActor(req, connection, roles);
  if (!(await User.verifyPassword(password, actor.password_hash))) {
    throw fail(403, "Your password is incorrect.");
  }
}

// Call while holding the account row lock, in the same transaction as revocation.
async function closeRecovery(connection, userId, reason) {
  await connection.query(
    `UPDATE password_recoveries
    SET status = 'cancelled', otp_hash = NULL, reset_token_hash = NULL
    WHERE user_id = ? AND status IN ('pending','verified')`,
    [userId],
  );
  await connection.query(
    `UPDATE sms_jobs SET state = 'cancelled', payload = NULL, last_error = ?
    WHERE user_id = ? AND purpose IN ('temporary_password','password_recovery')
    AND state IN ('queued','submitting')`,
    [reason, userId],
  );
}

async function issueTemporaryPassword(connection, user) {
  const password = User.generateTempPassword();
  const version = user.credential_version + 1;
  await connection.query(
    `UPDATE users SET password_hash = ?, must_change_password = 1, credential_version = ?,
     temp_password_expires_at = ?, temp_password_used_at = NULL,
     login_failures = 0, login_locked_until = NULL WHERE user_id = ?`,
    [
      await bcrypt.hash(password, 10),
      version,
      user.recovery_expires_at,
      user.user_id,
    ],
  );
  await closeRecovery(connection, user.user_id, "credential_replaced");
  return {
    temp_password: password,
    expires_at: user.recovery_expires_at.toISOString(),
    registered_phone: user.phone,
  };
}

async function issueWorkforcePassword(
  userId,
  req,
  { expectedVersion, operator = false } = {},
) {
  if (
    !Number.isSafeInteger(userId) ||
    userId < 1 ||
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 1
  ) {
    throw fail(
      400,
      "Refresh the account and confirm its identity before issuing a password.",
    );
  }
  if (!operator && req.user.user_id === userId) {
    throw fail(403, "Ask another administrator to recover your account.");
  }
  return audit.transaction(async (connection) => {
    const ids = operator ? [userId] : [userId, req.user.user_id];
    const [users] = await connection.query(
      `SELECT user_id, phone, role, is_active, credential_version,
      DATE_ADD(NOW(), INTERVAL 30 MINUTE) AS recovery_expires_at
      FROM users WHERE user_id IN (?) ORDER BY user_id FOR UPDATE`,
      [ids],
    );
    if (!operator) await requireRecoveryPassword(req, connection, ["admin"]);
    const user = users.find((row) => row.user_id === userId);
    if (
      !user?.is_active ||
      !(operator ? ["admin"] : ["staff", "doctor", "admin"]).includes(user.role)
    ) {
      throw fail(404, "Active workforce account not found.");
    }
    if (user.credential_version !== expectedVersion) {
      throw fail(
        409,
        "This account has changed. Refresh it before issuing another password.",
      );
    }
    const credential = await issueTemporaryPassword(connection, user);
    await audit.write(
      req,
      {
        action: "password.issued",
        target_type: "user",
        target_id: userId,
        force: operator,
        details: {
          assigned_role: user.role,
          method: operator ? "deployment_operator" : "in_person",
        },
      },
      connection,
    );
    return credential;
  });
}

module.exports = {
  requireRecoveryActor,
  requireRecoveryPassword,
  closeRecovery,
  issueTemporaryPassword,
  issueWorkforcePassword,
};
