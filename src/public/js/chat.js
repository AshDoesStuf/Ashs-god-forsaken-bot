const socket = io();

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("submit").addEventListener("click", function (event) {
    event.preventDefault();

    // Get the message from the input field
    const message = document.getElementById("text").value;

    // Emit the message to the server
    socket.emit("chat message", message);

    // Clear the input field
    document.getElementById("text").value = "";
  });

  socket.on("game-message", (data) => {
    const chatDiv = document.querySelector(".chat-box");
    const messageElement = document.createElement("div");
    messageElement.textContent = `[${data.username}]: ${data.message}`;
    chatDiv.appendChild(messageElement);
  });
});

