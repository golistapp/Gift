(function() {
    let enteredPasscode = "";
    const MAX_LENGTH = 6;

    const vaultKeypad = document.getElementById('vault-keypad');
    const unlockBtn = document.getElementById('unlock-btn');
    const dots = document.querySelectorAll('#dots-container .dot');

    // 🔴 PURANA ORIGINAL SOUND: HTML wale audio tag ko wapas connect kar diya
    const keySound = document.getElementById('keypad-sound');

    // Helper: Play Sound & Vibrate
    function playKeyFeedback() {
        if(keySound) {
            keySound.currentTime = 0; // Rewind to start
            keySound.play().catch(e => console.log("Sound locked by browser"));
        }
        if(navigator.vibrate) navigator.vibrate(40); 
    }

    // Button dabane par Dil (Heart) hawa mein udne ka logic
    function spawnHeart(buttonEl) {
        const heart = document.createElement('div');
        heart.innerHTML = '❤️';
        heart.className = 'floating-heart';

        const rect = buttonEl.getBoundingClientRect();
        heart.style.left = (rect.left + rect.width / 2 - 14) + 'px'; 
        heart.style.top = (rect.top - 10) + 'px'; 

        document.body.appendChild(heart);

        setTimeout(() => heart.remove(), 800);
    }

    // UI Update Function
    function updateVaultUI() {
        dots.forEach((dot, index) => {
            if (index < enteredPasscode.length) {
                // Type karte hi dot gayab aur Dil aa jayega
                dot.style.background = 'transparent';
                dot.innerHTML = '❤️';
                dot.style.transform = 'scale(1.4)';
            } else {
                dot.style.background = 'rgba(0,0,0,0.1)';
                dot.innerHTML = '';
                dot.style.transform = 'scale(1)';
            }
        });

        if(unlockBtn) {
            unlockBtn.disabled = enteredPasscode.length !== MAX_LENGTH;
            unlockBtn.style.background = enteredPasscode.length === MAX_LENGTH ? "linear-gradient(135deg, #cc0033, #ff4d79)" : "#ccc";
            unlockBtn.style.transform = enteredPasscode.length === MAX_LENGTH ? "scale(1.05)" : "scale(1)";
        }
    }

    // Keypad Click Event
    if (vaultKeypad) {
        vaultKeypad.addEventListener('click', (e) => {
            const keyBtn = e.target.closest('.magic-key:not(.clear-btn)');
            const clearBtn = e.target.closest('.clear-btn');

            if (keyBtn && enteredPasscode.length < MAX_LENGTH) {
                enteredPasscode += keyBtn.getAttribute('data-number');
                playKeyFeedback(); 
                spawnHeart(keyBtn); 
                updateVaultUI();
            } else if (clearBtn && enteredPasscode.length > 0) {
                enteredPasscode = enteredPasscode.slice(0, -1);
                playKeyFeedback(); 
                updateVaultUI();
            }
        });
    }

    // 🔥 NAYA LOGIC: Gift Kholne Ka Common Function
    async function executeUnlockSequence(state, passcodeToSave) {
        state.userPasscode = passcodeToSave; 

        try {
            fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, { 
                method: 'PATCH', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ scanned_at: new Date().toISOString() }) 
            });
        } catch(e) {}

        // Vault chhupao, Surprise dikhao
        document.getElementById('vault-mount').classList.add('hidden');

        await window.loadViewerComponent('surprise', 'surprise-mount');
        await window.loadViewerComponent('layout', 'footer-mount');

        document.getElementById('surprise-mount').classList.remove('hidden');
        document.getElementById('footer-mount').classList.remove('hidden');
    }

    // Unlock Button Event (Manual Entry ke liye)
    if (unlockBtn) {
        unlockBtn.addEventListener('click', async () => {
            const state = window.viewerState; 
            if (!state || !state.memoryData) return;

            const storedPass = state.memoryData.passcode || "";

            if (storedPass === enteredPasscode || (enteredPasscode !== "" && storedPass.endsWith(enteredPasscode))) {
                await executeUnlockSequence(state, enteredPasscode);
            } else {
                // Wrong Passcode Logic
                if(navigator.vibrate) navigator.vibrate([100, 50, 100]); 
                dots.forEach(dot => {
                    dot.style.background = 'transparent';
                    dot.innerHTML = '❌';
                    dot.style.transform = 'scale(1.2)';
                });
                setTimeout(() => { 
                    enteredPasscode = ""; 
                    updateVaultUI(); 
                }, 600);
            }
        });
    }

    // 🔥 NAYA LOGIC: Auto-Unlock Check (Master Portal Bypass)
    setTimeout(() => {
        const state = window.viewerState;
        if (state && state.memoryId) {
            // Master portal se aane wala "VIP Pass" check karo
            const authPass = sessionStorage.getItem(`auth_${state.memoryId}`);
            
            if (authPass === "true") {
                // Security ke liye pass use karne ke baad delete kar do
                sessionStorage.removeItem(`auth_${state.memoryId}`);
                
                // Actual passcode database se nikal kar direct unlock kar do
                const actualPass = state.memoryData.passcode || "";
                executeUnlockSequence(state, actualPass);
            }
        }
    }, 100);

})();
