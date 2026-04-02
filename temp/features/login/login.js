(function() {
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');
    const errorMsg = document.getElementById('error-msg');

    if (localStorage.getItem('adminToken')) {
        window.location.href = '?mode=admin';
        return;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
            loginBtn.disabled = true;
            errorMsg.classList.add('hidden');

            try {
                // 🔴 CHANGE: Ab hum Google ke bajaye apne Vercel API ko call kar rahe hain
                const response = await fetch('/api/admin-auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error?.message || "Login failed");
                }

                // Success! Token save karo
                localStorage.setItem('adminToken', data.idToken);
                window.location.href = '?mode=admin';

            } catch (error) {
                console.error("Login Error:", error);
                errorMsg.innerText = "Galat Email ya Password!";
                errorMsg.classList.remove('hidden');
            } finally {
                loginBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login to Dashboard';
                loginBtn.disabled = false;
            }
        });
    }
})();
