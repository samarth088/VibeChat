const validateRegister = (username, password) => {
  if (!username || !password) {
    return "All fields are required";
  }

  if (username.length < 3) {
    return "Username must be at least 3 characters";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }

  return null;
};

const validateLogin = (username, password) => {
  if (!username || !password) {
    return "Username and password required";
  }

  return null;
};

module.exports = {
  validateRegister,
  validateLogin
};
