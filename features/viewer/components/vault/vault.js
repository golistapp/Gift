(function() {
    let enteredPasscode = "";
    const MAX_LENGTH = 6;

    const vaultKeypad = document.getElementById('vault-keypad');
    const unlockBtn = document.getElementById('unlock-btn');
    const dots = document.querySelectorAll('#dots-container .dot');

    // 🔴 NAYA: Premium Sweet Pop Sound
    const premiumClickSound = new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3");

    // Helper: Play Sound & Vibrate
    function playKeyFeedback() {
        premiumClickSound.currentTime = 0; 
        premiumClickSound.play().catch(e => console.log("Sound blocked"));
        if(navigator.vibrate) navigator.vibrate(30); 
    }

    // 🔴 NAYA: Button dabane par Dil (Heart) hawa mein udne ka logic
    function spawnHeart(buttonEl) {
        const heart = document.createElement('div');
        heart.innerHTML = '❤️';
        heart.className = 'floating-heart';

        // Jis button par click hua hai, uski exact position nikalo
        const rect = buttonEl.getBoundingClientRect();
        heart.style.left = (rect.left + rect.width / 2 - 14) + 'px'; // Center X
        heart.style.top = (rect.top - 10) + 'px'; // Button ke theek upar (Center Y)

        document.body.appendChild(heart);

        // Animation 0.8s ki hai, toh 800ms baad div ko delete kar do
        setTimeout(() => heart.remove(), 800);
    }

    // UI Update Function
    function updateVaultUI() {
        dots.forEach((dot, index) => {
            if (index < enteredPasscode.length) {
                // 🔴 NAYA: Type karte hi dot gayab aur Dil aa jayega
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
                spawnHeart(keyBtn); // 💖 Dil udao!
                updateVaultUI();
            } else if (clearBtn && enteredPasscode.length > 0) {
                enteredPasscode = enteredPasscode.slice(0, -1);
                playKeyFeedback(); 
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
                // Wrong Password effect
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
})();