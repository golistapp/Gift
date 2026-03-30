(function() {
    const masterForm = document.getElementById('master-login-form');
    const masterInput = document.getElementById('master-input');
    const masterCard = document.getElementById('master-card');
    const errorMsg = document.getElementById('master-error');
    const openBtn = document.getElementById('master-open-btn');
    const lightBurst = document.getElementById('light-burst-overlay');

    // --- 1. Background Particles Logic ---
    function createParticles() {
        const container = document.getElementById('particles-container');
        if(!container) return;
        const particleCount = 15;
        for (let i = 0; i < particleCount; i++) {
            let p = document.createElement('div');
            p.className = 'particle';
            let size = Math.random() * 6 + 2; 
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            p.style.left = `${Math.random() * 100}vw`;
            p.style.animationDuration = `${Math.random() * 5 + 5}s`; 
            p.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(p);
        }
    }
    createParticles();

    masterInput.addEventListener('input', () => {
        if(!errorMsg.classList.contains('hidden')) {
            errorMsg.classList.add('hidden');
            masterCard.classList.remove('shake');
        }
    });

    // 2. Secret Admin Access (Logo par 3 tap)
    let tapCount = 0, tapTimeout;
    const logoArea = document.getElementById('secret-admin-trigger');
    if(logoArea) {
        logoArea.addEventListener('click', () => {
            tapCount++;
            if (tapCount >= 3) {
                clearTimeout(tapTimeout);
                window.location.href = '?mode=login';
            } else {
                clearTimeout(tapTimeout);
                tapTimeout = setTimeout(() => tapCount = 0, 1000); 
            }
        });
    }

    // 3. Smart Formatting
    masterInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/[^0-9A-Z]/gi, '').toUpperCase(); 
        if (val.length > 2) val = val.substring(0, 2) + '-' + val.substring(2, 8); 
        e.target.value = val;
    });

    // 4. Main Login Logic with Light Burst
    if (masterForm) {
        masterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const val = masterInput.value.trim(); 

            if (val.length < 4 || !val.includes('-')) {
                showError("Please enter valid secret code.");
                return;
            }

            const parts = val.split('-');
            const memoryId = `GX-${parts[0].padStart(2, '0')}`; 
            const enteredPasscode = parts[1];  

            openBtn.innerHTML = 'Unlocking...';
            openBtn.disabled = true;

            try {
                const res = await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`);
                if (!res.ok) throw new Error("Fetch failed");
                const data = await res.json();

                if (data && data.status === "locked" && data.is_enabled !== false) {
                                        const storedPass = data.passcode || "";
                    if (storedPass === enteredPasscode || (enteredPasscode !== "" && storedPass.endsWith(enteredPasscode))) {

                        if(navigator.vibrate) navigator.vibrate([50, 30, 50]); 
                        lightBurst.classList.remove('hidden');

                        // 🔴 NAYA: Viewer ko batane ke liye session storage mein temporary password save karein
                        sessionStorage.setItem(`auth_${memoryId}`, enteredPasscode);

                        setTimeout(() => {
                            lightBurst.classList.add('active');
                            setTimeout(() => {
                                window.location.href = `?id=${memoryId}`;
                            }, 600);
                        }, 50);
                        return;
                    }

                }
                showError();
            } catch (err) {
                showError("Network error. Please try again.");
            } finally {
                openBtn.innerHTML = 'Tap to Open <span class="spinning-gift">🎁</span>';
                openBtn.disabled = false;
            }
        });
    }

    function showError(customMsg) {
        errorMsg.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${customMsg || "Incorrect secret code."}`;
        errorMsg.classList.remove('hidden');
        masterCard.classList.add('shake');
        if(navigator.vibrate) navigator.vibrate([100, 50, 100]); 
        masterInput.focus();
        masterInput.select();
    }

    // 5. Forgot ID Modal Logic
    const forgotIdBtn = document.getElementById('btn-forgot-id');
    const forgotIdModal = document.getElementById('forgot-id-modal');
    const closeForgotId = document.getElementById('close-forgot-id');
    const searchBtn = document.getElementById('search-id-btn');
    const searchInput = document.getElementById('search-mobile-input');
    const searchResult = document.getElementById('search-result');

    if(forgotIdBtn) forgotIdBtn.addEventListener('click', () => {
        searchResult.innerHTML = ''; searchInput.value = '';
        forgotIdModal.classList.remove('hidden');
    });
    if(closeForgotId) {
        closeForgotId.addEventListener('click', () => forgotIdModal.classList.add('hidden'));
        forgotIdModal.addEventListener('click', (e) => { if(e.target === forgotIdModal) forgotIdModal.classList.add('hidden'); });
    }

    if(searchBtn) searchBtn.addEventListener('click', async () => {
        const mob = searchInput.value.trim().replace(/\D/g,'');
        if (mob.length < 8) return;
        searchBtn.innerHTML = 'Searching...';
        try {
            const res = await fetch(`${firebaseConfig.databaseURL}/memories.json`);
            const data = await res.json();
            let foundId = null;
            if (data) {
                Object.keys(data).forEach(id => {
                    const dbMob = (data[id].mobile_number || "").replace(/\D/g,'');
                    if (dbMob === mob) foundId = id;
                });
            }
            searchResult.innerHTML = foundId ? `<br><span style="color:#d81b60; font-weight:bold;">Your Code is: ${foundId}</span>` : '<br><span style="color:#e53935;">Not found.</span>';
        } catch (e) {} finally { searchBtn.innerHTML = 'Search ID'; }
    });

    // 🔴 6. NAYA: Custom Forgot Password Modal Logic
    const forgotPassBtn = document.getElementById('btn-forgot-pass');
    const forgotPassModal = document.getElementById('forgot-pass-modal');
    const closeForgotPass = document.getElementById('close-forgot-pass');
    const sendWaBtn = document.getElementById('send-wa-btn');
    const recoverIdInput = document.getElementById('recover-id-input');

    if(forgotPassBtn) forgotPassBtn.addEventListener('click', () => {
        recoverIdInput.value = '';
        forgotPassModal.classList.remove('hidden');
    });

    if(closeForgotPass) {
        closeForgotPass.addEventListener('click', () => forgotPassModal.classList.add('hidden'));
        forgotPassModal.addEventListener('click', (e) => { if(e.target === forgotPassModal) forgotPassModal.classList.add('hidden'); });
    }

    // Auto-format GX-02 logic inside popup
    recoverIdInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9A-Z]/gi, '').toUpperCase(); 
    });

    if(sendWaBtn) sendWaBtn.addEventListener('click', () => {
        let askId = recoverIdInput.value.trim();
        if (askId) {
            // Check if user just typed '02' and format it to 'GX-02'
            if (!askId.startsWith('GX-') && askId.length <= 2) askId = `GX-${askId.padStart(2, '0')}`;

            const msg = `Hello! I forgot the secret code for my Memory Gift ❤️.\n\nMy ID is: *${askId}*`;
            window.open(`https://wa.me/917903698180?text=${encodeURIComponent(msg)}`, '_blank');
            forgotPassModal.classList.add('hidden');
        } else {
            recoverIdInput.focus();
        }
    });

})();