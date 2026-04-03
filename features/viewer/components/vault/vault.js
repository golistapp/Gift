(function() {
    let enteredPasscode = "";
    const MAX_LENGTH = 6;

    const vaultKeypad = document.getElementById('vault-keypad');
    const unlockBtn = document.getElementById('unlock-btn');
    const dots = document.querySelectorAll('#dots-container .dot');
    const keySound = document.getElementById('keypad-sound');

    function playKeyFeedback() {
        if(keySound) { keySound.currentTime = 0; keySound.play().catch(e => {}); }
        if(navigator.vibrate) navigator.vibrate(40); 
    }

    function spawnHeart(buttonEl) {
        const heart = document.createElement('div'); heart.innerHTML = '❤️'; heart.className = 'floating-heart';
        const rect = buttonEl.getBoundingClientRect();
        heart.style.left = (rect.left + rect.width / 2 - 14) + 'px'; heart.style.top = (rect.top - 10) + 'px'; 
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 800);
    }

    function updateVaultUI() {
        dots.forEach((dot, index) => {
            if (index < enteredPasscode.length) {
                dot.style.background = 'transparent'; dot.innerHTML = '❤️'; dot.style.transform = 'scale(1.4)';
            } else {
                dot.style.background = 'rgba(0,0,0,0.1)'; dot.innerHTML = ''; dot.style.transform = 'scale(1)';
            }
        });
        if(unlockBtn) {
            unlockBtn.disabled = enteredPasscode.length !== MAX_LENGTH;
            unlockBtn.style.background = enteredPasscode.length === MAX_LENGTH ? "linear-gradient(135deg, #cc0033, #ff4d79)" : "#ccc";
            unlockBtn.style.transform = enteredPasscode.length === MAX_LENGTH ? "scale(1.05)" : "scale(1)";
        }
    }

    if (vaultKeypad) {
        vaultKeypad.addEventListener('click', (e) => {
            const keyBtn = e.target.closest('.magic-key:not(.clear-btn)');
            const clearBtn = e.target.closest('.clear-btn');
            if (keyBtn && enteredPasscode.length < MAX_LENGTH) {
                enteredPasscode += keyBtn.getAttribute('data-number');
                playKeyFeedback(); spawnHeart(keyBtn); updateVaultUI();
            } else if (clearBtn && enteredPasscode.length > 0) {
                enteredPasscode = enteredPasscode.slice(0, -1);
                playKeyFeedback(); updateVaultUI();
            }
        });
    }

    async function executeUnlockSequence(state, passcodeToSave) {
        state.userPasscode = passcodeToSave; 
        try { fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scanned_at: new Date().toISOString() }) }); } catch(e) {}
        document.getElementById('vault-mount').classList.add('hidden');
        await window.loadViewerComponent('surprise', 'surprise-mount');
        await window.loadViewerComponent('layout', 'footer-mount');
        document.getElementById('surprise-mount').classList.remove('hidden');
        document.getElementById('footer-mount').classList.remove('hidden');
    }

    if (unlockBtn) {
        unlockBtn.addEventListener('click', async () => {
            const state = window.viewerState; 
            if (!state) return;

            // 🔒 Loading State
            unlockBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking...';
            unlockBtn.disabled = true;

            try {
                // 🚀 SECURE VERIFICATION VIA BACKEND API
                const response = await fetch('/api/verify-passcode', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ memoryId: state.memoryId, enteredPasscode: enteredPasscode, requestType: 'unlock' })
                });
                
                const resData = await response.json();

                if (resData.success) {
                    // 🟢 Passcode Match Ho Gaya! Backend ne data bhej diya.
                    window.viewerState.memoryData = resData.memoryData; 
                    unlockBtn.innerHTML = 'Unlocked <i class="fa-solid fa-unlock"></i>';
                    await executeUnlockSequence(state, enteredPasscode);
                } else {
                    // 🔴 Galat Passcode
                    if(navigator.vibrate) navigator.vibrate([100, 50, 100]); 
                    dots.forEach(dot => { dot.style.background = 'transparent'; dot.innerHTML = '❌'; dot.style.transform = 'scale(1.2)'; });
                    setTimeout(() => { enteredPasscode = ""; updateVaultUI(); unlockBtn.innerHTML = 'Unlock <i class="fa-solid fa-unlock-keyhole"></i>'; }, 600);
                }
            } catch (e) {
                alert("Network Error! Please try again.");
                unlockBtn.innerHTML = 'Unlock <i class="fa-solid fa-unlock-keyhole"></i>';
                unlockBtn.disabled = false;
            }
        });
    }
})();
