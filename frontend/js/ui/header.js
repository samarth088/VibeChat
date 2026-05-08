// js/ui/header.js

// Live clock + header init — non-module

function updateClock() {
  const el = document.querySelector('.status-bar span');
  if (!el) return;
  const now = new Date();
  const h   = now.getHours().toString().padStart(2, '0');
  const m   = now.getMinutes().toString().padStart(2, '0');
  el.textContent = h + ':' + m;
}

function initHeader() {
  updateClock();
  setInterval(updateClock, 60000);
}
