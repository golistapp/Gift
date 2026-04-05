(function() {
    const masterForm = document.getElementById('master-login-form');
    // Naye dono inputs fetch kiye
    const masterIdInput = document.getElementById('master-id-input');
    const masterPassInput = document.getElementById('master-pass-input');
    
    const masterCard = document.getElementById('master-card');
    const errorMsg = document.getElementById('master-error');
    const openBtn = document.getElementById('master-open-btn');
    const lightBurst = document.getElementById('light-burst-overlay');

    // 1. Background Particles
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

    // Type karte hi error gayab ho jaye
    if(masterIdInput) masterIdInput.addEventListener('input', hideError);
    if(masterPassInput) masterPassInput.addEventListener('input', hideError);

    function hideError() {
        if(!errorMsg.classList.contains('hidden')) { 
            errorMsg.classList.add('hidden'); 
            masterCard.classList.remove('shake'); 
        }
    }

    // 2. Secret Admin Access (3 Tap)
    let tapCount = 0, tapTimeout;
    const logoArea = document.getElementById('secret-admin-trigger');
    if(logoArea) {
        logoArea.addEventListener('click', () => {
            tapCount++;
            if (tapCount >= 3) { window.location.href = '?mode=login'; } 
            else { clearTimeout(tapTimeout); tapTimeout = setTimeout(() => tapCount = 0, 1000); }
        });
    }

    // 3. Auto Format (Sirf numbers accept karega)
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

    // 4. Main Login Logic (Naya Dual Box System)
    if (masterForm) {
        masterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const idVal = masterIdInput.value.trim(); 
            const passVal = masterPassInput.value.trim();
            
            if (!idVal || !passVal) { 
                showError("Please fill both ID and Password."); 
                return; 
            }

                    // Agar ID '3' dali, toh 'GX-03' banayega, agar '100' dali toh 'GX-100' banayega
            const memoryId = `GX-${idVal.padStart(2, '0')}`; 
            const enteredPasscode = passVal;  
            
            openBtn.innerHTML = 'Unlocking...'; openBtn.disabled = true;

            try {
                // 🔴 SECURE API CALL (Bypasses Firebase Read Block via Admin SDK)
                const response = await fetch('/api/verify-passcode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ memoryId: memoryId, enteredPasscode: enteredPasscode, requestType: 'unlock' })
                });
                
                const resData = await response.json();

                if (resData.success) {
                    // Password aur ID bilkul sahi hai
                    if(navigator.vibrate) navigator.vibrate([50, 30, 50]); 
                    lightBurst.classList.remove('hidden');
                    setTimeout(() => {
                        lightBurst.classList.add('active');
                        sessionStorage.setItem(`auth_${memoryId}`, "true"); 
                        setTimeout(() => { window.location.href = `?id=${memoryId}`; }, 600);
                    }, 50);
                    return;
                } else {
                    // Password ya ID galat hai, ya rate limit active hai
                    showError(resData.error || "Incorrect Details.");
                }
            } catch (err) { 
                showError("Network error. Please try again."); 
            } 
            finally { 
                openBtn.innerHTML = 'Tap to Open <span class="spinning-gift">🎁</span>'; 
                openBtn.disabled = false; 
            }
        });
    }
          

    function showError(customMsg) {
        errorMsg.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${customMsg || "Incorrect Details."}`;
        errorMsg.classList.remove('hidden'); masterCard.classList.add('shake');
        if(navigator.vibrate) navigator.vibrate([100, 50, 100]); 
        if(masterPassInput) { masterPassInput.value = ''; masterPassInput.focus(); }
    }

    // --- 5. FORGOT ID SYSTEM ---
    const forgotIdBtn = document.getElementById('btn-forgot-id');
    const forgotIdModal = document.getElementById('forgot-id-modal');
    const closeForgotId = document.getElementById('close-forgot-id');
    const searchBtn = document.getElementById('search-id-btn');
    const searchResult = document.getElementById('search-result');

    if(forgotIdBtn) forgotIdBtn.addEventListener('click', () => {
        searchResult.innerHTML = ''; 
        document.getElementById('search-name-input').value = '';
        document.getElementById('search-mobile-input').value = '';
        forgotIdModal.classList.remove('hidden');
    });
    
    if(closeForgotId) {
        closeForgotId.addEventListener('click', () => forgotIdModal.classList.add('hidden'));
        forgotIdModal.addEventListener('click', (e) => { if(e.target === forgotIdModal) forgotIdModal.classList.add('hidden'); });
    }

    if(searchBtn) searchBtn.addEventListener('click', async () => {
        const nameInput = document.getElementById('search-name-input').value.trim().toLowerCase();
        const mobInput = document.getElementById('search-mobile-input').value.trim().replace(/\D/g,'');
        
        if (!nameInput || mobInput.length < 8) {
            searchResult.innerHTML = '<span style="color:#e53935;"><i class="fa-solid fa-triangle-exclamation"></i> Fill both details correctly.</span>';
            return;
        }

        searchBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
        searchBtn.disabled = true;

        try {
            const res = await fetch(`${firebaseConfig.databaseURL}/memories.json`);
            const data = await res.json();
            let foundId = null;
            
            if (data) {
                Object.keys(data).forEach(id => {
                    const dbMob = (data[id].mobile_number || "").replace(/\D/g,'');
                    const dbName = (data[id].customer_name || "").toLowerCase();
                    if (dbMob === mobInput && dbName.includes(nameInput)) {
                        foundId = id;
                    }
                });
            }

            if (foundId) {
                const custEmail = data[foundId].customer_email || "giftoraxofficial@gmail.com"; 

                await emailjs.send("service_qardvzx", "template_plwxp0k", {
                    subject: `Your Gift ID Request`,
                    request_type: "Forgot ID Request",
                    user_name: nameInput,
                    user_mobile: mobInput,
                    gift_id: "Unknown",
                    customer_email: custEmail,
                    secure_message: `Hello ${nameInput},\n\nYour verified Gift ID is: ${foundId}\n\nYou can now use this ID to open your gift or reset your passcode.`
                });
                
                let displayEmail = custEmail;
                if(custEmail.includes('@')) {
                    let parts = custEmail.split('@');
                    let visibleLen = Math.min(6, parts[0].length); 
                    displayEmail = parts[0].substring(0, visibleLen) + '***@' + parts[1];
                }

                searchResult.innerHTML = `<br><span style="color:#10b981; font-weight:bold;">✅ Verification Successful!</span><br><span style="color:#666; font-size:13px; margin-top:5px; display:inline-block;">Sent securely to: <br><strong style="color:#d81b60; font-size:15px; letter-spacing:0.5px;">${displayEmail}</strong></span>`;
            } else {
                searchResult.innerHTML = '<br><span style="color:#e53935;">❌ Verification Failed. No records matched.</span>';
            }
        } catch (e) {
            searchResult.innerHTML = '<br><span style="color:#e53935;">System error. Try again.</span>';
        } finally {
            searchBtn.innerHTML = 'Secure Request';
            searchBtn.disabled = false;
        }
    });

    // --- 6. FORGOT PASSWORD SYSTEM ---
    const forgotPassBtn = document.getElementById('btn-forgot-pass');
    const forgotPassModal = document.getElementById('forgot-pass-modal');
    const closeForgotPass = document.getElementById('close-forgot-pass');
    const sendWaBtn = document.getElementById('send-wa-btn');
    const recoverIdInput = document.getElementById('recover-id-input');
    const passSearchResult = document.getElementById('pass-search-result');

    if(forgotPassBtn) forgotPassBtn.addEventListener('click', () => {
        recoverIdInput.value = '';
        document.getElementById('recover-name-input').value = '';
        document.getElementById('recover-mobile-input').value = '';
        passSearchResult.innerHTML = '';
        forgotPassModal.classList.remove('hidden');
    });
    
    if(closeForgotPass) {
        closeForgotPass.addEventListener('click', () => forgotPassModal.classList.add('hidden'));
        forgotPassModal.addEventListener('click', (e) => { if(e.target === forgotPassModal) forgotPassModal.classList.add('hidden'); });
    }

    recoverIdInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9A-Z]/gi, '').toUpperCase(); 
    });

    if(sendWaBtn) sendWaBtn.addEventListener('click', async () => {
        let askId = recoverIdInput.value.trim();
        const nameInput = document.getElementById('recover-name-input').value.trim().toLowerCase();
        const mobInput = document.getElementById('recover-mobile-input').value.trim().replace(/\D/g,'');
        
        if (!askId || !nameInput || mobInput.length < 8) {
            passSearchResult.innerHTML = '<span style="color:#e53935;"><i class="fa-solid fa-triangle-exclamation"></i> Fill all fields correctly.</span>';
            return;
        }

        if (!askId.startsWith('GX-') && askId.length <= 2) askId = `GX-${askId.padStart(2, '0')}`;
        
        sendWaBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
        sendWaBtn.disabled = true;

        try {
            const res = await fetch(`${firebaseConfig.databaseURL}/memories/${askId}.json`);
            const data = await res.json();
            
            if (data) {
                const dbMob = (data.mobile_number || "").replace(/\D/g,'');
                const dbName = (data.customer_name || "").toLowerCase();

                if (dbMob === mobInput && dbName.includes(nameInput)) {
                    
                    const custEmail = data.customer_email || "giftoraxofficial@gmail.com"; 

                    await emailjs.send("service_qardvzx", "template_plwxp0k", {
                        subject: `Your Password Recovery`,
                        request_type: "Forgot Password Request",
                        user_name: nameInput,
                        user_mobile: mobInput,
                        gift_id: askId,
                        customer_email: custEmail,
                        secure_message: `Hello ${nameInput},\n\nYour Gift ID is: ${askId}\nYour Secret Passcode is: ${data.passcode}\n\nKeep this code safe and do not share it with anyone.`
                    });
                    
                    let displayEmail = custEmail;
                    if(custEmail.includes('@')) {
                        let parts = custEmail.split('@');
                        let visibleLen = Math.min(6, parts[0].length); 
                        displayEmail = parts[0].substring(0, visibleLen) + '***@' + parts[1];
                    }

                    passSearchResult.innerHTML = `<br><span style="color:#10b981; font-weight:bold;">✅ Secure Request Sent!</span><br><span style="color:#666; font-size:13px; margin-top:5px; display:inline-block;">Sent securely to: <br><strong style="color:#d81b60; font-size:15px; letter-spacing:0.5px;">${displayEmail}</strong></span>`;
                } else {
                    passSearchResult.innerHTML = '<br><span style="color:#e53935;">❌ Verification Failed. Details do not match.</span>';
                }
            } else {
                passSearchResult.innerHTML = '<br><span style="color:#e53935;">❌ Invalid Gift ID.</span>';
            }
        } catch (e) {
            passSearchResult.innerHTML = '<br><span style="color:#e53935;">System error. Try again.</span>';
        } finally {
            sendWaBtn.innerHTML = 'Send Secure Request <i class="fa-solid fa-shield-halved" style="margin-left: 5px;"></i>';
            sendWaBtn.disabled = false;
        }
    });

})();