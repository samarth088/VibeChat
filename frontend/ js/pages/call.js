// js/pages/call.js
(function () {
  const params = new URLSearchParams(window.location.search);
  const callType = params.get("type"); // voice | video

  const micBtn = document.getElementById("micBtn");
  const camBtn = document.getElementById("camBtn");
  const endBtn = document.getElementById("endBtn");

  const localVideo = document.querySelector(".local-video");

  let stream = null;
  let micOn = true;
  let camOn = true;

  async function initCall() {
    try {
      if (callType === "video") {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (localVideo) localVideo.srcObject = stream;
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (camBtn) camBtn.style.display = "none";
      }
    } catch (err) {
      alert("Media access denied");
    }
  }

  micBtn?.addEventListener("click", () => {
    if (!stream) return;
    micOn = !micOn;
    stream.getAudioTracks().forEach(t => t.enabled = micOn);
    micBtn.textContent = micOn ? "🎤" : "🔇";
  });

  camBtn?.addEventListener("click", () => {
    if (!stream) return;
    camOn = !camOn;
    stream.getVideoTracks().forEach(t => t.enabled = camOn);
    camBtn.textContent = camOn ? "🎥" : "📷";
  });

  endBtn?.addEventListener("click", () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    window.location.href = "chat.html";
  });

  initCall();
})();
