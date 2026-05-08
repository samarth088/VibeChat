// js/utils/format.js

// Text + string formatting utilities — non-module

function truncate(str, maxLen) {
  maxLen = maxLen || 40;
  return str && str.length > maxLen ? str.slice(0, maxLen) + '…' : (str || '');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  return (text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
