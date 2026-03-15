document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');
    const errorMsg = document.getElementById('error-msg');

    // Agar user pehle se logged in hai, toh direct dashboard dikhao
    if (localStorage.getItem('adminToken')) {
        window.location.href = 'index.html';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking...';
        loginBtn.disabled = true;
        errorMsg.classList.add('hidden');

        try {
            // FIREBASE_CONFIG ki jagah ab firebaseConfig use hoga (jo api/firebase.config.js mein hai)
            const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`;

            const response = await fetch(authUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    returnSecureToken: true
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error.message || "Login failed");
            }

            // Success! Token save karo aur Dashboard par redirect karo
            localStorage.setItem('adminToken', data.idToken);
            window.location.href = 'index.html';

        } catch (error) {
            console.error("Login Error:", error);
            errorMsg.innerText = "Galat Email ya Password! Kripya dobara try karein.";
            errorMsg.classList.remove('hidden');
        } finally {
            loginBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login to Dashboard';
            loginBtn.disabled = false;
        }
    });
});
