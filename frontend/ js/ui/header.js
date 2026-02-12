// =============================
// Header Logic
// =============================

const headerElement = document.getElementById("chatHeader");

if (State.currentUser && headerElement) {
  headerElement.innerText = "Welcome, " + State.currentUser.username;
  }
