window.addEventListener('load', () => {
    // On load, verify JWT reset token with backend
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
        // token valid, allow user to reset password
    })
    .catch(() => {
        alert('Reset session expired or unauthorized. Please start over.');
        window.location.href = '/forgot-password/';
    });
});

const form = document.getElementById('resetPasswordForm');
const message = document.getElementById('message');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    if (password.length < 6) {
        message.textContent = 'Password must be at least 6 characters.';
        message.style.color = 'red';
        return;
    }

    if (password !== confirmPassword) {
        message.textContent = 'Passwords do not match.';
        message.style.color = 'red';
        return;
    }

    // Send new password to backend
    fetch('http://localhost:3000/reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            message.textContent = 'Password reset successful! Redirecting to login...';
            message.style.color = 'green';
            // Clear session storage or any flags if you use them
            setTimeout(() => {
                window.location.href = '/';
            }, 2500);
        } else {
            message.textContent = data.message || 'Failed to reset password.';
            message.style.color = 'red';
        }
    })
    .catch(() => {
        message.textContent = 'Network error. Please try again.';
        message.style.color = 'red';
    });
});
