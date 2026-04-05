(function() {
    const masterForm = document.getElementById('master-login-form');
    const masterIdInput = document.getElementById('master-id-input');
    const masterPassInput = document.getElementById('master-pass-input');
    
    const masterCard = document.getElementById('master-card');
    const errorMsg = document.getElementById('master-error');
    const openBtn = document.getElementById('master-open-btn');
    const lightBurst = document.getElementById('light-burst-overlay');

    function createParticles() {
        const container = document.getElementById('particles-container');
        if(!container) return;
        for (let i = 0; i < 15; i++) {
            let p = document.createElement('div');
            p.className = 'particle';
            let size = Math.random() * 6 + 2; 
            p.style.width = `${size}px`; p.style.height = `${size}px`;
            p.style.left = `${Math.random() * 100}vw`;
            p.style.animationDuration = `${Math.random() * 5 + 5}s`; 
            p.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(p);
        }
    }
    createParticles();

    if(masterIdInput) masterIdInput.addEventListener('input', hideError);
    if(masterPassInput) masterPassInput.addEventListener('input', hideError);

    function hideError() {
        if(!errorMsg.classList.contains('hidden')) { 
            errorMsg.classList.add('hidden'); 
            masterCard.classList.remove('shake'); 
        }
    }

    // 🔴 NAYA UPDATE: Logo par single click karne se wapas index.html (Home) par jayega
    const logoArea = document.getElementById('secret-admin-trigger');
    if(logoArea) {
        logoArea.addEventListener('click', () => {
            window.location.href = 'index.html'; 
        });
    }

    if(masterIdInput) {
        masterIdInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9A-Z]/gi, '').toUpperCase(); 
        });
    }
    if(masterPassInput) {
        masterPassInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, ''); 
        });
    }

    if (masterForm) {
        masterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const idVal = masterIdInput.value.trim(); 
            const passVal = masterPassInput.value.trim();
            if (!idVal || !passVal) { showError("Please fill both ID and Password."); return; }

            const memoryId = `GX-${idVal.padStart(2, '0')}`; 
            const enteredPasscode = passVal;  
            openBtn.innerHTML = 'Unlocking...'; openBtn.disabled = true;

            try {
                const response = await fetch('/api/verify-passcode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ memoryId: memoryId, enteredPasscode: enteredPasscode, requestType: 'unlock' })
                });
                
                const resData = await response.json();

                if (resData.success && resData.memoryData.status === "locked" && resData.memoryData.is_enabled !== false) {
                    if(navigator.vibrate) navigator.vibrate([50, 30, 50]); 
                    lightBurst.classList.remove('hidden');
                    setTimeout(() => {
                        lightBurst.classList.add('active');
                        sessionStorage.setItem(`auth_${memoryId}`, enteredPasscode); 
                        setTimeout(() => { window.location.href = `?id=${memoryId}`; }, 600);
                    }, 50);
                    return;
                }
                showError(resData.error || "Incorrect details.");
            } catch (err) { showError("Network error. Please try again."); } 
            finally { openBtn.innerHTML = 'Tap to Open <span class="spinning-gift">🎁</span>'; openBtn.disabled = false; }
        });
    }

    function showError(customMsg) {
        errorMsg.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${customMsg || "Incorrect Details."}`;
        errorMsg.classList.remove('hidden'); masterCard.classList.add('shake');
        if(navigator.vibrate) navigator.vibrate([100, 50, 100]); 
        if(masterPassInput) { masterPassInput.value = ''; masterPassInput.focus(); }
    }

    // --- 2-BOX RECOVERY SYSTEM WITH SECURE BACKEND VERIFICATION ---
    const forgotBtn = document.getElementById('btn-forgot-recovery');
    const recoveryModal = document.getElementById('recovery-modal');
    const closeRecovery = document.getElementById('close-recovery');
    const recoverBtn = document.getElementById('btn-recover-secure');
    const recoveryResult = document.getElementById('recovery-result');

    if(forgotBtn) forgotBtn.addEventListener('click', () => {
        recoveryResult.innerHTML = ''; 
        document.getElementById('rec-primary').value = '';
        document.getElementById('rec-secondary').value = '';
        recoveryModal.classList.remove('hidden');
    });
    
    if(closeRecovery) {
        closeRecovery.addEventListener('click', () => recoveryModal.classList.add('hidden'));
        recoveryModal.addEventListener('click', (e) => { if(e.target === recoveryModal) recoveryModal.classList.add('hidden'); });
    }

    if(recoverBtn) recoverBtn.addEventListener('click', async () => {
        const recPrimaryRaw = document.getElementById('rec-primary').value.trim().toLowerCase();
        const recSecRaw = document.getElementById('rec-secondary').value.trim().toLowerCase();
        
        const recSecClean = recSecRaw.replace(/[^a-z0-9]/g, ''); 
        
        if (!recPrimaryRaw || !recSecClean) {
            recoveryResult.innerHTML = '<span style="color:#e53935;"><i class="fa-solid fa-triangle-exclamation"></i> Please fill both fields correctly.</span>';
            return;
        }

        const limitKey = `recovery_req_${recPrimaryRaw}`;
        let limitData = JSON.parse(localStorage.getItem(limitKey) || '{"count": 0, "timestamp": 0}');
        const now = new Date().getTime();

        if (now - limitData.timestamp > 86400000) {
            limitData.count = 0;
            limitData.timestamp = now;
        }

        if (limitData.count >= 2) {
            recoveryResult.innerHTML = '<br><span style="color:#e53935; font-weight:bold;"><i class="fa-solid fa-clock"></i> Already sent!</span><br><span style="color:#666; font-size:13px;">Please check your email. You can try again after 24 hours.</span>';
            return;
        }

        recoverBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
        recoverBtn.disabled = true;

        try {
            const response = await fetch('/api/verify-passcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    requestType: 'recover', 
                    recPrimary: recPrimaryRaw, 
                    recSecondary: recSecRaw 
                })
            });

            const resData = await response.json();

            if (resData.success) {
                const { foundId, customerName, customerEmail, passcode } = resData;

                await emailjs.send("service_qardvzx", "template_plwxp0k", {
                    subject: `Your GiftoraX Recovery Details`,
                    request_type: "Account Recovery Request",
                    user_name: customerName,
                    user_mobile: "Verified",
                    gift_id: foundId,
                    customer_email: customerEmail,
                    secure_message: `Hello ${customerName},\n\nYour account has been successfully verified.\n\nYour Gift ID is: ${foundId}\nYour Secret Passcode is: ${passcode}\n\nKeep these details safe and do not share them with anyone.`
                });
                
                limitData.count += 1;
                limitData.timestamp = now;
                localStorage.setItem(limitKey, JSON.stringify(limitData));

                let displayEmail = customerEmail;
                if(customerEmail.includes('@')) {
                    let parts = customerEmail.split('@');
                    let visibleLen = Math.min(4, parts[0].length); 
                    displayEmail = parts[0].substring(0, visibleLen) + '****@' + parts[1];
                }

                recoveryResult.innerHTML = `<br><span style="color:#10b981; font-weight:bold;">✅ Verification Successful!</span><br><span style="color:#666; font-size:13px; margin-top:5px; display:inline-block;">Details sent securely to: <br><strong style="color:#d81b60; font-size:15px; letter-spacing:0.5px;">${displayEmail}</strong></span>`;
            } else {
                recoveryResult.innerHTML = `<br><span style="color:#e53935;">❌ ${resData.error || "Verification Failed. Details do not match."}</span>`;
            }
        } catch (e) {
            recoveryResult.innerHTML = '<br><span style="color:#e53935;">System error. Try again.</span>';
        } finally {
            recoverBtn.innerHTML = 'Secure Request <i class="fa-solid fa-shield-halved" style="margin-left: 5px;"></i>';
            recoverBtn.disabled = false;
        }
    });

})();
