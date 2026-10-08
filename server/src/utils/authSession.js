const jwt = require('jsonwebtoken');
function sessionResponse(user) {
  const setup = !!user.must_change_password;
  return {
    token: jwt.sign({ user_id: user.user_id, phone: user.phone, role: user.role,
      credential_version: user.credential_version, purpose: setup ? 'password_setup' : 'session' },
    process.env.JWT_SECRET, { expiresIn: setup ? '15m' : process.env.JWT_EXPIRES_IN || '1h' }),
    user: { user_id: user.user_id, phone: user.phone, role: user.role, must_change_password: setup },
  };
}
module.exports = { sessionResponse };
