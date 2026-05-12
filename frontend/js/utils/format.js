// js/utils/format.js
// VibeChat — Text + string formatting utilities

function truncate(str, maxLen) {
  maxLen = maxLen || 40;
  str    = String(str || "");
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}

// Escape HTML — XSS prevention
function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#039;");
}

// Format a VIBE-XXXXX uid for display
function formatVIBEId(uid) {
  if (!uid) return "";
  return String(uid).toUpperCase();
}
