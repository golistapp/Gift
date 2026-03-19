(function() {
    const state = window.viewerState;
    if (!state) return;

    // Helper: Confetti Effect
    function fireConfettiAndHearts() {
        for(let i=0; i<30; i++) {
            const h = document.createElement('div');
            h.innerHTML = Math.random() > 0.5 ? '❤️' : '✨';
            h.style.position = 'fixed'; h.style.left = '50%'; h.style.top = '50%';
            h.style.fontSize = (Math.random() * 20 + 10) + 'px';
            h.style.pointerEvents = 'none'; h.style.zIndex = '99999';
            h.style.transition = 'all 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            document.body.appendChild(h);
            setTimeout(() => {
                h.style.transform = `translate(${(Math.random()-0.5)*500}px, ${(Math.random()-0.5)*500}px) scale(${Math.random() + 0.5})`;
                h.style.opacity = '0';
            }, 50);
            setTimeout(() => h.remove(), 1500);
        }
    }

    const btnNo = document.getElementById('btn-no');
    const btnYes = document.getElementById('btn-yes');

    // "No" Button Evasion Logic
    if (btnNo) {
        function evadeCursor(e) {
            e.preventDefault();
            const container = document.querySelector('.proposal-buttons');
            const containerRect = container.getBoundingClientRect();
            const btnRect = btnNo.getBoundingClientRect();

            const randomX = Math.floor(Math.random() * (containerRect.width - btnRect.width)) - (containerRect.width / 2);
            const randomY = Math.floor(Math.random() * 80) - 40;

            btnNo.style.transform = `translate(${randomX}px, ${randomY}px)`;

            // 🔴 Updated Path: assets/gif/angry.gif
            const proposalGif = document.getElementById('proposal-gif');
            if (proposalGif) proposalGif.src = "assets/gif/angry.gif"; // Angry/crying bear

            clearTimeout(btnNo.resetTimer);
            btnNo.resetTimer = setTimeout(() => {
                btnNo.style.transform = 'translate(0, 0)';
                // 🔴 Updated Path: assets/gif/reaction.gif
                if (proposalGif) proposalGif.src = "assets/gif/reaction.gif"; // Normal
            }, 2000);
        }

        btnNo.addEventListener('mouseover', evadeCursor);
        btnNo.addEventListener('touchstart', evadeCursor, { passive: false });
    }

    // "Yes" Button Click Logic
    if (btnYes) {
        btnYes.addEventListener('click', async () => {
            document.getElementById('proposal-state').style.display = 'none';
            document.getElementById('success-state').style.display = 'flex';
            fireConfettiAndHearts();

            // Save status to Firebase
            if(state.mode !== 'admin_preview' && window.firebaseConfig) {
                try {
                    await fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, { 
                        method: 'PATCH', 
                        headers: { 'Content-Type': 'application/json' }, 
                        body: JSON.stringify({ proposal_accepted_at: new Date().toISOString() }) 
                    });
                } catch(e) { console.log("Failed to save proposal status"); }
            }
        });
    }
})();