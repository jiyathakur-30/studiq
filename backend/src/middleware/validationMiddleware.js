const validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields: username, email, and password' });
  }
  if (username.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Username must be at least 3 characters long' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }
  next();
};

export {
  validateRegister,
  validateLogin
};
