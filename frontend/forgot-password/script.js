fetch(`http://localhost:3000/me`, {
    credentials: "include"
})
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            location.href = "/dashboard/";
        }
    })
    .catch(() => location.href = "/forgot-password/");

const form = document.getElementById("forgotPasswordForm");

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const message = document.getElementById("message");

    fetch("http://localhost:3000/forgot-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email })
    })
        .then((result) => result.json())
        .then((data) => {
            message.textContent = data.message;
            message.style.color = data.success ? "green" : "red";
            if (data.success) {
                sessionStorage.setItem('forgotPasswordInProgress', 'true');
                location.href = "/verify-otp/"
            }
        })
        .catch(err => {
            console.error(err)
        })
})