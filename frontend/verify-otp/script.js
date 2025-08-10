let email = null;
window.addEventListener('load', () => {
    if (!sessionStorage.getItem('forgotPasswordInProgress')) {
        window.location.href = '/';
    }

    fetch('http://localhost:3000/validate-reset-token', {
        method: 'GET',
        credentials: 'include' // send cookies
    })
        .then(res => {
            if (!res.ok) throw new Error('Unauthorized');
            return res.json();
        })
        .then(data => {
            if (!data.success) {
                alert('Reset session expired or unauthorized. Please start over.');
                window.location.href = '/forgot-password/';
            }
            email = data.email;
        })
});

const inputs = document.querySelectorAll('.otp-input');
inputs.forEach((input, index) => {
    input.addEventListener('input', () => {
        if (input.value.length === 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
            inputs[index - 1].focus();
        }
    });
});

const message = document.getElementById("message");

document.getElementById('otpForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const otp = Array.from(inputs).map(input => input.value).join('');
    console.log("OTP entered:", otp);
    // TODO: Send OTP to backend for verification
    fetch("http://localhost:3000/verify-otp", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, otp })
    })
        .then(response => response.json())
        .then(data => {
            message.textContent = data.message;
            message.style.color = data.success ? "green" : "red";
            if (data.success) {
                sessionStorage.removeItem('forgotPasswordInProgress');
                location.href = "/reset-password/"
            }
        })
});