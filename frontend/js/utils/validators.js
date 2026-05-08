// js/utils/validators.js

// Input validation utilities — non-module

function isValidUsername(username) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username || '');
}

function isValidPassword(password) {
  return (password || '').length >= 6;
}

function isValidUID(uid) {
  return /^#\d{5}$/.test(uid || '');
}
