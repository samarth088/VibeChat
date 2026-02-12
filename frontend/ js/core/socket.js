// =============================
// Socket Layer
// =============================

let socket = null;

function initSocket() {

  if (!State.currentUser) return;

    socket = io(ENV.SOCKET_URL, {
        transports: ["websocket"]
          });

            socket.emit("register", State.currentUser.id);

              socket.on("connect", () => {
                  console.log("🟢 Socket Connected");
                    });

                      socket.on("disconnect", () => {
                          console.log("🔴 Socket Disconnected");
                            });

                            }

                            function getSocket() {
                              return socket;
                              }
