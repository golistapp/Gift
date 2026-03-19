(function() {
    const yesBtn = document.querySelector('.btn-yes'); // Aapka yes button class/id
    const noBtn = document.querySelector('.btn-no');   // Aapka no button class/id
    const pandaImg = document.querySelector('.proposal-img'); // Panda image class/id

    // "No" Button bhagane wala logic (Agar aapne lagaya hua hai)
    if (noBtn) {
        noBtn.addEventListener('mouseover', function() {
            const x = Math.random() * (window.innerWidth - this.clientWidth);
            const y = Math.random() * (window.innerHeight - this.clientHeight);
            this.style.position = 'absolute';
            this.style.left = `${x}px`;
            this.style.top = `${y}px`;
        });

        // Touch screen ke liye bhi
        noBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            const x = Math.random() * (window.innerWidth - this.clientWidth);
            const y = Math.random() * (window.innerHeight - this.clientHeight);
            this.style.position = 'absolute';
            this.style.left = `${x}px`;
            this.style.top = `${y}px`;
        });
    }

    // 🔴 THE FIX: "Yes" Button Click Logic
    if (yesBtn) {
        yesBtn.addEventListener('click', async function() {
            // 1. Change Image (Agar aap animation dikhana chahte hain)
            if(pandaImg) pandaImg.src = "assets/gif/kiss.gif"; 

            // 2. Firebase me Time Save Karein!
            const state = window.viewerState;
            if (state && state.memoryId && typeof firebaseConfig !== 'undefined') {
                try {
                    await fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            proposal_accepted_at: new Date().toISOString() // 👈 Naya Time!
                        })
                    });
                    console.log("Proposal Time Saved!");
                } catch(error) {
                    console.log("Error saving proposal time.");
                }
            }

            // Optional: Confetti ya Success message yahan add kar sakte hain
            yesBtn.innerHTML = "I Love You Too! ❤️";
            yesBtn.style.transform = "scale(1.1)";
            if(noBtn) noBtn.style.display = "none";
        });
    }
})();
