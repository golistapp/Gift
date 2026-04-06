document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('surprise-lead-form');
    const submitBtn = document.getElementById('submit-btn');
    const successMsg = document.getElementById('success-msg');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Page refresh rokne ke liye

            // --- 🛡️ SPAM PROTECTION 1: HONEYPOT CHECK ---
            const botTrap = document.getElementById('bot-trap');
            if (botTrap && botTrap.value !== "") {
                form.reset(); 
                return; // Bot detected, stop here
            }

            // --- 🛡️ SPAM PROTECTION 2: 5 MINUTE LIMIT ---
            const lastSubmitTime = localStorage.getItem('last_lead_submit');
            if (lastSubmitTime) {
                const timeDifference = new Date().getTime() - parseInt(lastSubmitTime);
                if (timeDifference < 5 * 60 * 1000) { 
                    alert("You have already submitted a request. Please wait a few minutes.");
                    return;
                }
            }

            // Button loading state
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Submitting... <i class="fa-solid fa-spinner fa-spin"></i>';
            submitBtn.style.opacity = '0.7';
            submitBtn.style.pointerEvents = 'none';

            const name = document.getElementById('user-name').value.trim();
            const mobile = document.getElementById('user-mobile').value.trim();
            const email = document.getElementById('user-email').value.trim();

            try {
                // 🔴 NAYA: Direct API call instead of Firebase Frontend
                const response = await fetch('/api/verify-passcode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requestType: 'submit_lead',
                        name: name,
                        mobile: mobile,
                        email: email
                    })
                });

                const resData = await response.json();

                if (resData.success) {
                    // Success!
                    localStorage.setItem('last_lead_submit', new Date().getTime()); 
                    form.style.display = 'none'; 
                    successMsg.style.display = 'block'; 
                } else {
                    // API ne error bheja
                    alert("Error: " + (resData.error || "Could not submit."));
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.opacity = '1';
                    submitBtn.style.pointerEvents = 'auto';
                }
            } catch (error) {
                console.error(error);
                alert("Network error. Please check your connection and try again.");
                submitBtn.innerHTML = originalText;
                submitBtn.style.opacity = '1';
                submitBtn.style.pointerEvents = 'auto';
            }
        });
    }
});
