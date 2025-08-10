
fetch(`http://localhost:3000/me`, {
    credentials: "include"
})
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            location.href = "/dashboard/";
        }
    })
    .catch(() => location.href = "/");

const form = document.getElementById("registerForm")

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.toLowerCase();
    const email = document.getElementById("email").value.toLowerCase();
    const password = document.getElementById("password").value;

    const messageBox = document.getElementById("message")

    fetch(`http://localhost:3000/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, email, password }),
        credentials: "include"
    })
        .then(response => response.json())
        .then(data => {
            messageBox.textContent = data.message;
            messageBox.style.color = data.success ? "green" : "red"
            if (data.success) {
                location.href = "/dashboard/"
            }
        })
        .catch(err => {
            console.error(err)
        })

})