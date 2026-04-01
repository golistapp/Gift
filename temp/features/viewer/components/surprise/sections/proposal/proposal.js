(function() {
    const yesBtn = document.getElementById('btn-yes'); 
    const noBtn = document.getElementById('btn-no');   
    const pandaImg = document.getElementById('proposal-gif'); 
    const clickSound = document.getElementById('prop-click-sound');
    const yaySound = document.getElementById('prop-yay-sound');
    
    const propState = document.getElementById('proposal-state');
    const successState = document.getElementById('success-state');

    // Dynamic Girlfriend Name (agar available ho toh add karega)
    const state = window.viewerState;
    const gfName = (state && state.memoryData && state.memoryData.girlfriend_name) ? state.memoryData.girlfriend_name : "";
    if (gfName) {
        const nameEl = document.getElementById('prop-dynamic-name');
        if(nameEl) nameEl.innerText = ", " + gfName;
        const succText = document.getElementById('success-dynamic-text');
        if(succText) succText.innerText = `"I knew you'd say yes, ${gfName}! I love you! 💖"`;
    }

    // Confetti Helper Function
    function fireProposalConfetti() {
        for(let i=0; i<50; i++) {
            const h = document.createElement('div');
            h.innerHTML = ['💖', '✨', '🌹', '🥰'][Math.floor(Math.random()*4)];
            h.style.position = 'fixed'; h.style.left = '50%'; h.style.top = '50%';
            h.style.fontSize = (Math.random() * 25 + 15) + 'px';
            h.style.pointerEvents = 'none'; h.style.zIndex = '99999';
            h.style.transition = 'all 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            document.body.appendChild(h);
            setTimeout(() => {
                h.style.transform = `translate(${(Math.random()-0.5)*800}px, ${(Math.random()-0.5)*800}px) scale(${Math.random() + 0.5})`;
                h.style.opacity = '0';
            }, 50);
            setTimeout(() => h.remove(), 1500);
        }
    }
    
    // "No" Button Limited Movement Logic (Range restricted)
    if (noBtn) {
        let moveCount = 0;
        
        const moveButton = function(e) {
            if (e && e.cancelable) e.preventDefault(); 
            
            // Angry GIF & Click Sound
            if (pandaImg) pandaImg.src = "assets/gif/angry.gif";
            if (clickSound) { clickSound.currentTime = 0; clickSound.play().catch(err=>{}); }

            // Pehle darne wala (Shake) animation play hoga
            noBtn.classList.add('shake-anim');
            
            setTimeout(() => {
                noBtn.classList.remove('shake-anim');
                
                // 🔴 FIX: Range fix kiya gaya hai taaki screen se bahar na jaaye.
                // Apni position se max 120px left/right aur 80px up/down hi jayega
                const maxMoveX = 120; 
                const maxMoveY = 80;  
                
                const randomX = (Math.random() - 0.5) * 2 * maxMoveX;
                const randomY = (Math.random() - 0.5) * 2 * maxMoveY;

                noBtn.style.transform = `translate(${randomX}px, ${randomY}px)`;
                
                // Thodi der baad button rone lagega
                moveCount++;
                if (moveCount > 4) {
                    noBtn.innerHTML = "Okay fine... 😭"; 
                }
            }, 150); 
        };

        noBtn.addEventListener('mouseover', moveButton);
        noBtn.addEventListener('touchstart', moveButton, {passive: false});
        noBtn.addEventListener('click', moveButton); 
    }

    // "Yes" Button Click Logic
    if (yesBtn) {
        yesBtn.addEventListener('click', async function() {
            // Play Sounds & Vibrate
            if (clickSound) { clickSound.currentTime = 0; clickSound.play().catch(err=>{}); }
            if (yaySound) { yaySound.currentTime = 0; yaySound.play().catch(err=>{}); }
            if(navigator.vibrate) navigator.vibrate([100, 50, 100]); 
            
            // Firebase me Time Save Karein!
            if (state && state.memoryId && typeof firebaseConfig !== 'undefined') {
                try {
                    fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ proposal_accepted_at: new Date().toISOString() })
                    });
                } catch(error) {}
            }

            // Smoothly Screen Change karna aur Confetti fadna
            propState.style.display = "none";
            successState.style.display = "flex";
            
            fireProposalConfetti();
        });
    }
})();
