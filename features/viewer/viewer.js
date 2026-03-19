(function() {
    let enteredPasscode = "";
    const MAX_LENGTH = 6;

    const vaultKeypad = document.getElementById('vault-keypad');
    const unlockBtn = document.getElementById('unlock-btn');
    const dots = document.querySelectorAll('#dots-container .dot');

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

    // Keypad Click Event Delegation
    if (vaultKeypad) {
        vaultKeypad.addEventListener('click', (e) => {
            const keyBtn = e.target.closest('.magic-key:not(.clear-btn)');
            const clearBtn = e.target.closest('.clear-btn');

            if (keyBtn && enteredPasscode.length < MAX_LENGTH) {
                enteredPasscode += keyBtn.getAttribute('data-number');
                updateVaultUI();
            } else if (clearBtn && enteredPasscode.length > 0) {
                enteredPasscode = enteredPasscode.slice(0, -1);
                updateVaultUI();
            }
        });
    }

    // Unlock Button Event
    if (unlockBtn) {
        unlockBtn.addEventListener('click', async () => {
            const state = window.viewerState; // Yeh data viewer.js ne lakar rakha hai
            if (!state || !state.memoryData) return;

            if (enteredPasscode === state.memoryData.passcode) {
                // Passcode Save karo aage Chat ko decrypt karne ke liye
                state.userPasscode = enteredPasscode; 

                // 1. Firebase update karo ki gift open ho gaya
                try {
                    fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, { 
                        method: 'PATCH', 
                        headers: { 'Content-Type': 'application/json' }, 
                        body: JSON.stringify({ scanned_at: new Date().toISOString() }) 
                    });
                } catch(e) { console.log("Firebase status update failed silently."); }

                // 2. Vault ko hide kardo
                document.getElementById('vault-mount').classList.add('hidden');

                // 3. MAGIC ✨: Naye components ko load karo
                await window.loadViewerComponent('surprise', 'surprise-mount');
                await window.loadViewerComponent('layout', 'footer-mount');

                // 4. Inko screen par show karo
                document.getElementById('surprise-mount').classList.remove('hidden');
                document.getElementById('footer-mount').classList.remove('hidden');

            } else {
                // Wrong Passcode Feedback
                dots.forEach(dot => dot.style.background = 'red');
                setTimeout(() => { 
                    enteredPasscode = ""; 
                    updateVaultUI(); 
                }, 500);
            }
        });
    }
})();