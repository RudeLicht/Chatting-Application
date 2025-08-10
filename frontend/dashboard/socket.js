import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

const socket = io(`http://localhost:3000`, {
    auth: { serverOffset: 0 }
});

let username = null;
let currentRoom = "General";

const messageInput = document.getElementById("messageInput");
const messageBox = document.getElementById("messages");
const sendBtn = document.getElementById("sendBtn");
const dmContainer = document.getElementById("dmContainer");

fetch(`http://localhost:3000/me`, { credentials: "include" })
    .then(res => res.json())
    .then(data => {
        username = data.username;
        document.getElementById("welcomeHeader").textContent = `Welcome ${username}`;
        socket.emit("user_connected", username);
        socket.emit("request_history", currentRoom);
        socket.emit("request_dm_list", username);
    })
    .catch(err => {
        console.error("Failed to fetch user info:", err);
        alert("Could not connect. Please try again later.");
    });

socket.on("message", ({ data, username: sender, room = "General", serverOffset }) => {
    if (room !== getSocketRoomName(currentRoom)) return;
    displayMessage(data, sender);
    socket.auth.serverOffset = serverOffset;
});

sendBtn.addEventListener("click", sendMessage);
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && document.activeElement === messageInput) sendMessage();
});

function sendMessage() {
    const msg = messageInput.value.trim();
    if (!msg || !username) return;
    if (msg.length > 500) return alert("Message should be less than 500 letters");

    socket.emit("message", { data: msg, username, room: getSocketRoomName(currentRoom) });
    displayMessage(msg, username);
    messageInput.value = "";
    messageBox.scrollTop = messageBox.scrollHeight;
}

function displayMessage(text, sender = "System") {
    const messageItem = document.createElement("li");
    messageItem.classList.add("message-item");

    const senderSpan = document.createElement("span");
    senderSpan.classList.add("sender");
    senderSpan.textContent = `${sender}: `;

    const textSpan = document.createElement("span");
    textSpan.classList.add("text");
    textSpan.textContent = text;

    if (sender === "System") {
        messageItem.classList.add("system-message");
    } else if (sender === username) {
        senderSpan.style.color = "green";
    } else {
        senderSpan.style.color = "blue";
        senderSpan.classList.add("user");
        senderSpan.style.cursor = "pointer";
        senderSpan.title = `Click to DM ${sender.replace(":", "")}`;
    }

    messageItem.appendChild(senderSpan);
    messageItem.appendChild(textSpan);
    messageBox.appendChild(messageItem);
    messageBox.scrollTop = messageBox.scrollHeight;
}

socket.on("dm_created", (otherUser) => {
    for (let child of dmContainer.children) {
        if (child.textContent.trim() === otherUser.trim()) return;
    }
    const dmBtn = document.createElement("ul");
    dmBtn.classList.add("dm-tab");
    dmBtn.textContent = otherUser;
    dmContainer.appendChild(dmBtn);
});

const dmModal = document.getElementById("dmModal");
const createDmBtn = document.getElementById("createDmBtn");
const cancelDmBtn = document.getElementById("cancelDmBtn");

createDmBtn.addEventListener("click", () => {
    const name = document.getElementById("dmNameInput").value.trim().toLowerCase();
    if (!name) return;
    socket.emit("create_dm", name);
    dmModal.style.display = "none";
});

cancelDmBtn.addEventListener("click", () => {
    dmModal.style.display = "none";
});

dmModal.addEventListener("click", (e) => {
    if (e.target === dmModal) {
        dmModal.style.display = "none";
    }
});

dmContainer.addEventListener("click", (e) => {
    if (e.target !== dmContainer) {
        if (e.target.textContent.trim() === "+") {
            document.getElementById("dmModal").style.display = "flex";
            document.getElementById("dmNameInput").value = "";
            document.getElementById("dmNameInput").focus();
            return;
        }
        for (let child of dmContainer.children) {
            child.classList.remove("selected-room");
        }

        const newRoomLabel = e.target.textContent.trim();
        e.target.classList.add("selected-room");
        e.target.classList.remove("MISSED");

        currentRoom = newRoomLabel;
        messageBox.innerHTML = "";
        socket.emit("request_history", getSocketRoomName(currentRoom));
    }
});

socket.on("dm_notification", (fromUser) => {
    for (let child of dmContainer.children) {
        const tabUser = child.textContent.trim();
        if (tabUser === currentRoom) continue;
        if (tabUser === fromUser) {
            child.classList.add("NOTIFICATION");
            child.addEventListener("animationend", () => {
                child.classList.remove("NOTIFICATION");
                child.classList.add("MISSED");
            }, { once: true });
            break;
        }
    }
});

const userPopup = document.createElement("div");
userPopup.className = "user-popup";
userPopup.style.position = "fixed";
userPopup.style.display = "none";
userPopup.innerHTML = `<button id="dmBtn">DM</button>`;
document.body.appendChild(userPopup);

messageBox.addEventListener("click", (e) => {
    if (e.target.classList.contains("user")) {
        const rect = e.target.getBoundingClientRect();
        userPopup.style.top = `${rect.bottom + 5}px`;
        userPopup.style.left = `${rect.left}px`;
        userPopup.style.display = "block";
        userPopup.dataset.username = e.target.textContent.replace(":", "").trim();
    } else {
        userPopup.style.display = "none";
    }
});

document.addEventListener("click", (e) => {
    if (!userPopup.contains(e.target) && !e.target.classList.contains("user")) {
        userPopup.style.display = "none";
    }
});

userPopup.querySelector("#dmBtn").addEventListener("click", () => {
    const userToDM = userPopup.dataset.username;
    userPopup.style.display = "none";
    socket.emit("create_dm", userToDM);
});

function getSocketRoomName(label) {
    return label === "General"
        ? "General"
        : `dm_${[username, label].sort().join("_")}`;
}

socket.on("dm_list", (users) => {
    for (const user of users) {
        let exists = false;
        for (let child of dmContainer.children) {
            if (child.textContent.trim() === user.trim()) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            const dmBtn = document.createElement("ul");
            dmBtn.classList.add("dm-tab");
            dmBtn.textContent = user;
            dmContainer.appendChild(dmBtn);
        }
    }
});

socket.on("error_message", (message) => {
    alert(message);
    return;
})