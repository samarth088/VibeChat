// Username validation
export function validateUsername(username) {
  return username && username.length >= 3;
}

// Password validation
export function validatePassword(password) {
  return password && password.length >= 6;
}

// Empty check
export function isEmpty(value) {
  return !value || value.trim() === "";
}
