(function() {
    let minimalGiftOpened = false;
    
    const tapSound = document.getElementById('gift-tap-sound');
    const magicSound = document.getElementById('gift-magic-sound');
    
    // Dynamic Name Extraction
    const state = window.viewerState;
    const gfName = (state && state.memoryData && state.memoryData.girlfriend_name) ? state.memoryData.girlfriend_name : "";
    if (gfName) {
        const nameEl = document.getElementById('gift-dynamic-name');
        if(nameEl) nameEl.innerText = gfName;
    }

    // Cinematic Confetti Effect (Golden dust + Emojis)
    function fireCinematicConfetti() {
        // Emojis Burst
        for(let i=0; i<35; i++) {
            const h = document.createElement('div');
            h.innerHTML = ['❤️', '✨', '💍', '💖'][Math.floor(Math.random()*4)];
            h.style.position = 'fixed'; h.style.left = '50%'; h.style.top = '50%';
            h.style.fontSize = (Math.random() * 25 + 15) + 'px';
            h.style.pointerEvents = 'none'; h.style.zIndex = '99999';
            h.style.transition = 'all 2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            document.body.appendChild(h);
            setTimeout(() => {
                h.style.transform = `translate(${(Math.random()-0.5)*700}px, ${(Math.random()-0.5)*700}px) scale(${Math.random() + 0.5}) rotate(${Math.random()*360}deg)`;
                h.style.opacity = '0';
            }, 50);
            setTimeout(() => h.remove(), 2000);
        }
        
        // Golden Dust Particles
        for(let j=0; j<40; j++) {
            const dot = document.createElement('div');
            dot.style.position = 'fixed'; dot.style.left = '50%'; dot.style.top = '50%';
            dot.style.width = (Math.random() * 6 + 3) + 'px';
            dot.style.height = dot.style.width;
            dot.style.backgroundColor = ['#ffd700', '#ffea75', '#ff4d79'][Math.floor(Math.random()*3)];
            dot.style.borderRadius = '50%';
            dot.style.boxShadow = '0 0 8px rgba(255, 215, 0, 0.8)';
            dot.style.pointerEvents = 'none'; dot.style.zIndex = '99998';
            dot.style.transition = 'all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            document.body.appendChild(dot);
            setTimeout(() => {
                dot.style.transform = `translate(${(Math.random()-0.5)*800}px, ${(Math.random()-0.5)*800}px)`;
                dot.style.opacity = '0';
            }, 50);
            setTimeout(() => dot.remove(), 1500);
        }
    }

    const container = document.getElementById("minimal-gift-container");
    const giftBox = document.getElementById("minimal-gift");

    if (container && giftBox) {
        container.addEventListener('click', () => {
            if (minimalGiftOpened) return;
            minimalGiftOpened = true;

            // Play tap sound and short vibrate
            if(tapSound) { tapSound.currentTime = 0; tapSound.play().catch(e=>{}); }
            if(navigator.vibrate) navigator.vibrate(50);

            // Stop swaying and start open animations
            container.classList.add("opened-container");
            giftBox.classList.add("opened");

            // 3D Ring spawn logic
            const ringWrapper = document.createElement('div');
            ringWrapper.style.position = 'absolute';
            ringWrapper.style.top = '30px';
            ringWrapper.style.left = '50%';
            // Initial position: chota aur ulta ghuma hua
            ringWrapper.style.transform = 'translate(-50%, 0) scale(0.1) rotateY(180deg) rotateX(-20deg)';
            ringWrapper.style.transition = 'all 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            ringWrapper.style.zIndex = '3';
            ringWrapper.style.display = 'flex';
            ringWrapper.style.justifyContent = 'center';
            ringWrapper.style.alignItems = 'center';
            
            const ring = document.createElement('div');
            ring.innerHTML = '💍';
            ring.style.fontSize = '5.5rem';
            ring.style.filter = 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))';
            
            const sparkle = document.createElement('div');
            sparkle.className = 'ring-sparkle';

            ringWrapper.appendChild(sparkle);
            ringWrapper.appendChild(ring);
            giftBox.appendChild(ringWrapper);

            // Pop out 3D ring with magic sound
            setTimeout(() => {
                if(magicSound) { magicSound.currentTime = 0; magicSound.play().catch(e=>{}); }
                // Final position: Bada aur sidha ghuma hua (3D flip effect)
                ringWrapper.style.transform = 'translate(-50%, -110px) scale(1) rotateY(0deg) rotateX(0deg)';
                if(navigator.vibrate) navigator.vibrate([100, 100, 200]);
            }, 300);

            // Show message, fire cinematic confetti, and UNHIDE SHARE SECTION
            setTimeout(() => {
                const msg = document.getElementById("surpriseMessage");
                if (msg) msg.classList.add("show");
                fireCinematicConfetti();

                // 🔴 NAYA UPDATE: Share section ko unhide karna
                const shareMount = document.getElementById("surprise-share-mount");
                if (shareMount) {
                    shareMount.classList.remove("hidden");
                    
                    // Thoda sa delay dekar smoothly niche scroll karwana (optional but premium feel dega)
                    setTimeout(() => {
                        shareMount.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    }, 2000); // Confetti thoda shant hone ke baad scroll hoga
                }

            }, 1200); 
        });
    }
})();
