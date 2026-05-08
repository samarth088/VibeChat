// js/pages/group.js

// Group tab logic — non-module

function createGroup() {
  // TODO: Implement group creation with backend
  console.log('[Group] Create group triggered');
  // For now show a toast
  var toast = document.getElementById('vibeToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'vibeToast';
    toast.style.cssText = 'position:absolute;bottom:90px;left:50%;transform:translateX(-50%);' +
      'background:rgba(0,80,200,0.92);color:#fff;padding:10px 20px;border-radius:30px;' +
      'font-size:13px;font-weight:600;z-index:999;white-space:nowrap;pointer-events:none;' +
      'box-shadow:0 4px 20px rgba(0,100,255,0.4)';
    var phone = document.querySelector('.phone');
    if (phone) phone.appendChild(toast);
  }
  toast.textContent = 'Group feature coming soon!';
  setTimeout(function () { toast.remove(); }, 2500);
}

// Wire up the Create Group button after DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  var btn = document.querySelector('.btn-create-group');
  if (btn) btn.addEventListener('click', createGroup);
});
