(function() {
    const yesBtn = document.getElementById('btn-yes'); // ID se select kiya
    const noBtn = document.getElementById('btn-no');   // ID se select kiya
    // 🔴 FIX: HTML mein id 'proposal-gif' hai, usko match kiya
    const pandaImg = document.getElementById('proposal-gif'); 

    // "No" Button bhagane wala logic
    if (noBtn) {
        const moveButton = function(e) {
            if (e && e.cancelable) e.preventDefault(); // Touch device scrolling issue rokne ke liye

            // 🔴 NAYA: Jab bhi NO par click/touch/hover karein, Angry GIF lag jaye
            if (pandaImg) pandaImg.src = "assets/gif/angry.gif";

            // Button ko random jagah move karna
            const x = Math.random() * (window.innerWidth - this.clientWidth - 20);
            const y = Math.random() * (window.innerHeight - this.clientHeight - 20);

            this.style.position = 'fixed'; // fixed taaki pure screen par bhage aur card ke andar na phase
            this.style.left = `${Math.max(10, x)}px`;
            this.style.top = `${Math.max(10, y)}px`;
            this.style.zIndex = '9999';
        };

        noBtn.addEventListener('mouseover', moveButton);
        noBtn.addEventListener('touchstart', moveButton, {passive: false});
    }

    // "Yes" Button Click Logic
    if (yesBtn) {
        yesBtn.addEventListener('click', async function() {
            // 🔴 NAYA: Yes par click karne par Kiss GIF lag jaye
            if (pandaImg) pandaImg.src = "assets/gif/kiss.gif"; 

            // Firebase me Time Save Karein!
            const state = window.viewerState;
            if (state && state.memoryId && typeof firebaseConfig !== 'undefined') {
                try {
                    await fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            proposal_accepted_at: new Date().toISOString() 
                        })
                    });
                    console.log("Proposal Time Saved!");
                } catch(error) {
                    console.log("Error saving proposal time.");
                }
            }

            // Confetti ya Success message
            yesBtn.innerHTML = "I Love You Too! ❤️";
            yesBtn.style.transform = "scale(1.1)";
            yesBtn.style.position = "static";

            // No button ko humesha ke liye hide kar do
            if (noBtn) noBtn.style.display = "none";
        });
    }
})();