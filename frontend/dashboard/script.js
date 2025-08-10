
fetch(`http://localhost:3000/me`, {
    credentials: "include"
})
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            location.href = "/";
        } else {
            document.getElementById("welcomeHeader").textContent = `Welcome ${data.username}`;
        }
    })
    .catch(() => location.href = "/");

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", () => {
    fetch(`http://localhost:3000/logout`, {
        method: "POST",
        credentials: "include"
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                window.location.href = "/";
            }
        });
});
