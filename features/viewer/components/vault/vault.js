(function() {
    let enteredPasscode = "";
    const MAX_LENGTH = 6;

    const vaultKeypad = document.getElementById('vault-keypad');
    const unlockBtn = document.getElementById('unlock-btn');
    const dots = document.querySelectorAll('#dots-container .dot');
    const keySound = document.getElementById('keypad-sound'); // Sound Element

    // 🔴 Helper: Play Sound & Vibrate
    function playKeyFeedback() {
        if(keySound) {
            keySound.currentTime = 0; // Rewind to start
            keySound.play().catch(e => console.log("Sound locked by browser"));
        }
        // Haptic Feedback for Android devices
        if(navigator.vibrate) navigator.vibrate(40); 
    }

    // UI Update Function
    function updateVaultUI() {
        dots.forEach((dot, index) => {
            dot.style.background = index < enteredPasscode.length ? '#cc0033' : 'rgba(0,0,0,0.1)';
        });

        if(unlockBtn) {
            unlockBtn.disabled = enteredPasscode.length !== MAX_LENGTH;
            unlockBtn.style.background = enteredPasscode.length === MAX_LENGTH ? "linear-gradient(135deg, #cc0033, #ff4d79)" : "#ccc";
        }
    }

    // Keypad Click Event
    if (vaultKeypad) {
        vaultKeypad.addEventListener('click', (e) => {
            const keyBtn = e.target.closest('.magic-key:not(.clear-btn)');
            const clearBtn = e.target.closest('.clear-btn');

            if (keyBtn && enteredPasscode.length < MAX_LENGTH) {
                enteredPasscode += keyBtn.getAttribute('data-number');
                playKeyFeedback(); // Play sound here
                updateVaultUI();
            } else if (clearBtn && enteredPasscode.length > 0) {
                enteredPasscode = enteredPasscode.slice(0, -1);
                playKeyFeedback(); // Play sound here
                updateVaultUI();
            }
        });
    }

    // Unlock Button Event
    if (unlockBtn) {
        unlockBtn.addEventListener('click', async () => {
            const state = window.viewerState; 
            if (!state || !state.memoryData) return;

            if (enteredPasscode === state.memoryData.passcode) {
                state.userPasscode = enteredPasscode; 

                try {
                    fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, { 
                        method: 'PATCH', 
                        headers: { 'Content-Type': 'application/json' }, 
                        body: JSON.stringify({ scanned_at: new Date().toISOString() }) 
                    });
                } catch(e) {}

                document.getElementById('vault-mount').classList.add('hidden');

                await window.loadViewerComponent('surprise', 'surprise-mount');
                await window.loadViewerComponent('layout', 'footer-mount');

                document.getElementById('surprise-mount').classList.remove('hidden');
                document.getElementById('footer-mount').classList.remove('hidden');

            } else {
                if(navigator.vibrate) navigator.vibrate([100, 50, 100]); // Error vibration
                dots.forEach(dot => dot.style.background = 'red');
                setTimeout(() => { 
                    enteredPasscode = ""; 
                    updateVaultUI(); 
                }, 500);
            }
        });
    }
})();