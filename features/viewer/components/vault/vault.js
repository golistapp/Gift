// Modular system ke liye global init function
window.initVault = function() {
    let enteredPasscode = "";
    const MAX_LENGTH = 6;
    
    // Elements select karna
    const vaultKeypad = document.getElementById('vault-keypad');
    const unlockBtn = document.getElementById('unlock-btn');
    const dots = document.querySelectorAll('#dots-container .dot');

    if(!vaultKeypad || !unlockBtn) return; // Guard clause

    // UI Update Logic
    function updateVaultUI() {
        dots.forEach((dot, index) => {
            dot.style.background = index < enteredPasscode.length ? '#cc0033' : 'rgba(0,0,0,0.1)';
        });

        unlockBtn.disabled = enteredPasscode.length !== MAX_LENGTH;
        unlockBtn.style.background = enteredPasscode.length === MAX_LENGTH ? "linear-gradient(135deg, #cc0033, #ff4d79)" : "#ccc";
    }

    // Purane events hatane ke liye clone karna (SPA me zaroori hai)
    const newKeypad = vaultKeypad.cloneNode(true);
    vaultKeypad.parentNode.replaceChild(newKeypad, vaultKeypad);
    
    const newUnlockBtn = unlockBtn.cloneNode(true);
    unlockBtn.parentNode.replaceChild(newUnlockBtn, unlockBtn);

    const activeKeypad = document.getElementById('vault-keypad');
    const activeUnlockBtn = document.getElementById('unlock-btn');

    // Keypad Logic
    activeKeypad.addEventListener('click', (e) => {
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

    // 🔴 BULLETPROOF UNLOCK LOGIC
    activeUnlockBtn.addEventListener('click', async () => {
        try {
            // 1. Check State
            let state = window.viewerState;
            if (!state || !state.memoryData) {
                alert("Loading data... Please wait a second and try again.");
                return;
            }

            // Database aur Input dono ko String banakar trim karna
            const dbPasscode = String(state.memoryData.passcode).trim();
            const inputPasscode = enteredPasscode.trim();

            if (inputPasscode === dbPasscode) {
                // UI Feedback (Button ka text change hoga)
                activeUnlockBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Unlocking...';
                activeUnlockBtn.disabled = true;

                state.userPasscode = inputPasscode; 
                
                // 2. Update Firebase safely
                if(typeof firebaseConfig !== 'undefined') {
                    fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, { 
                        method: 'PATCH', 
                        headers: { 'Content-Type': 'application/json' }, 
                        body: JSON.stringify({ scanned_at: new Date().toISOString() }) 
                    }).catch(e => console.log("Firebase status update silent error"));
                }

                // 3. Safe DOM Hiding
                const vaultMount = document.getElementById('vault-mount');
                if(vaultMount) {
                    vaultMount.classList.add('hidden');
                } else {
                    document.querySelector('.vault-screen').style.display = 'none';
                }

                // 4. Load Next Components safely
                if(typeof window.loadViewerComponent === 'function') {
                    await window.loadViewerComponent('surprise', 'surprise-mount');
                    await window.loadViewerComponent('layout', 'footer-mount');
                }

                // 5. Show Next Components
                const surpriseMount = document.getElementById('surprise-mount');
                const footerMount = document.getElementById('footer-mount');
                
                if(surpriseMount) surpriseMount.classList.remove('hidden');
                if(footerMount) footerMount.classList.remove('hidden');

            } else {
                // Wrong Passcode Feedback
                dots.forEach(dot => dot.style.background = 'red');
                activeUnlockBtn.innerText = 'WRONG PASSCODE';
                activeUnlockBtn.style.background = 'red';
                
                setTimeout(() => { 
                    enteredPasscode = ""; 
                    activeUnlockBtn.innerText = 'UNLOCK GIFT';
                    updateVaultUI(); 
                }, 800);
            }
        } catch (error) {
            console.error("System Error: ", error);
            alert("Oops! Something went wrong: " + error.message);
            activeUnlockBtn.innerText = 'UNLOCK GIFT';
            activeUnlockBtn.disabled = false;
        }
    });
};

// Start the vault logic
window.initVault();
