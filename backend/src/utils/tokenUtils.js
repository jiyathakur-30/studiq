import jwt from 'jsonwebtoken';

const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'studiq_access_token_secure_secret_2026_key',
    { expiresIn: '7d' } // We set to 7d in local environments for a smoother user/dev preview experience
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'studiq_refresh_token_secure_secret_2026_key',
    { expiresIn: '30d' }
  );
};

export {
  generateAccessToken,
  generateRefreshToken
};
