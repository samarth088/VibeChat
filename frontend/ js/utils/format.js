// Shorten long message preview
export function shortenText(text, length = 30) {
  if (!text) return "";
  return text.length > length
    ? text.substring(0, length) + "..."
    : text;
}

// Capitalize first letter
export function capitalize(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}
