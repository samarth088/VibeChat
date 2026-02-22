// js/utils/time.js
// Time + date formatting utilities — non-module

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now  = new Date();
  const diff = now - date;

  if (diff < 60000)    return 'now';
  if (diff < 3600000)  return Math.floor(diff / 60000) + ' min';

  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return h + ':' + m;
}

function formatDate(timestamp) {
  const date      = new Date(timestamp);
  const now       = new Date();
  const days      = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString())       return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return days[date.getDay()];
}
