// Format message time (HH:MM)
export function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Format last seen
export function formatLastSeen(date) {
  const d = new Date(date);
  return "Last seen " + d.toLocaleString();
}
