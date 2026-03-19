window.initVault = function() {
    const vaultKeypad = document.getElementById('vault-keypad');
    const unlockBtn = document.getElementById('unlock-btn');
    const altUnlockBtn = document.getElementById('alt-unlock-btn');
    const dots = document.querySelectorAll('#dots-container .dot');
    const tickSound = document.getElementById('key-press-sound');

    // Prevent duplicate event listeners
    if(!vaultKeypad || vaultKeypad.dataset.initialized === "true") return;
    vaultKeypad.dataset.initialized = "true"; 

    let enteredPasscode = "";
    const MAX_LENGTH = 6;

    // --- 🔴 BUG FIX 1: ADMIN PREVIEW BYPASS ---
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminPreview = urlParams.get('mode') === 'admin_preview';

    if(isAdminPreview) {
        executeUnlock(true); // Direct unlock bina password ke
        return;
    }

    // --- 🔴 BUG FIX 2: TIK TIK SOUND LOGIC ---
    function playTick() {
        if(tickSound) {
            tickSound.currentTime = 0;
            tickSound.play().catch(e => console.log("Sound blocked"));
        }
    }

    function updateVaultUI() {
        dots.forEach((dot, index) => {
            dot.style.background = index < enteredPasscode.length ? '#cc0033' : 'rgba(0,0,0,0.1)';
        });

        const isReady = enteredPasscode.length === MAX_LENGTH;

        // Update Main Button
        unlockBtn.disabled = !isReady;
        unlockBtn.style.background = isReady ? "linear-gradient(135deg, #cc0033, #ff4d79)" : "#ccc";

        // Update Alt (Arrow) Button
        if(altUnlockBtn) {
            altUnlockBtn.style.background = isReady ? "#cc0033" : "#e2e8f0";
            altUnlockBtn.style.color = isReady ? "white" : "#cc0033";
        }
    }

    vaultKeypad.addEventListener('click', (e) => {
        const keyBtn = e.target.closest('.magic-key:not(.clear-btn)');
        const clearBtn = e.target.closest('.clear-btn');

        if (keyBtn && enteredPasscode.length < MAX_LENGTH) {
            enteredPasscode += keyBtn.getAttribute('data-number');
            playTick();
            updateVaultUI();
        } else if (clearBtn && enteredPasscode.length > 0) {
            enteredPasscode = enteredPasscode.slice(0, -1);
            playTick();
            updateVaultUI();
        }
    });

    // --- 🔴 MASTER UNLOCK FUNCTION ---
    async function executeUnlock(isBypass = false) {
        try {
            let state = window.viewerState;
            if (!state || !state.memoryData) {
                alert("Data is still loading... Please wait a second.");
                return;
            }

            const dbPasscode = String(state.memoryData.passcode).trim();
            const inputPasscode = enteredPasscode.trim();

            if (isBypass || inputPasscode === dbPasscode) {
                // UI Changes
                unlockBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Unlocking...';
                if(altUnlockBtn) altUnlockBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                unlockBtn.disabled = true;

                state.userPasscode = isBypass ? dbPasscode : inputPasscode; 

                // Firebase Update
                if(!isBypass && typeof firebaseConfig !== 'undefined') {
                    fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, { 
                        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, 
                        body: JSON.stringify({ scanned_at: new Date().toISOString() }) 
                    }).catch(e => {});
                }

                // Hide Vault
                const vaultMount = document.getElementById('vault-mount');
                if(vaultMount) vaultMount.classList.add('hidden');
                else document.querySelector('.vault-screen').style.display = 'none';

                // Load & Show Next Components
                if(typeof window.loadViewerComponent === 'function') {
                    await window.loadViewerComponent('surprise', 'surprise-mount');
                    await window.loadViewerComponent('layout', 'footer-mount');
                }

                const surpriseMount = document.getElementById('surprise-mount');
                const footerMount = document.getElementById('footer-mount');
                if(surpriseMount) surpriseMount.classList.remove('hidden');
                if(footerMount) footerMount.classList.remove('hidden');

            } else {
                dots.forEach(dot => dot.style.background = 'red');
                unlockBtn.innerText = 'WRONG PASSCODE';
                unlockBtn.style.background = 'red';
                setTimeout(() => { 
                    enteredPasscode = ""; 
                    unlockBtn.innerText = 'UNLOCK GIFT';
                    updateVaultUI(); 
                }, 800);
            }
        } catch(error) {
            alert("Error unlocking: " + error.message);
            unlockBtn.innerText = 'UNLOCK GIFT';
            unlockBtn.disabled = false;
            if(altUnlockBtn) altUnlockBtn.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
        }
    }

    // Dono Buttons par Event lagana
    unlockBtn.addEventListener('click', () => executeUnlock(false));
    if(altUnlockBtn) {
        altUnlockBtn.addEventListener('click', () => {
            if(enteredPasscode.length === MAX_LENGTH) executeUnlock(false);
        });
    }
};

window.initVault();
