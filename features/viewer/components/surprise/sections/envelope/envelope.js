(function() {
    const state = window.viewerState;
    if (!state || !state.memoryData) return;

    const envelope = document.getElementById('envelope');
    const instructions = document.getElementById('env-instructions');
    const notesSection = document.getElementById('love-notes-section');
    const letterContainer = document.getElementById('dynamic-letter-container');
    const signature = document.getElementById('letter-sig');

    // 🔴 UPDATED: Dynamic Image Logic Based on Occasion
    const envCardImg = document.getElementById('envelope-dynamic-card');
    if (envCardImg && state.memoryData.occasion) {
        const occasionLower = state.memoryData.occasion.toLowerCase();
        if (occasionLower.includes("birthday")) {
            envCardImg.src = "assets/image/happy birthday.jpg";
        } else if (occasionLower.includes("anniversary")) {
            envCardImg.src = "assets/image/happy anniversary.jpg";
        } else if (occasionLower.includes("love") || occasionLower.includes("valentine")) {
            envCardImg.src = "assets/image/I love you.jpg";
        } else {
            // Default card
            envCardImg.src = "assets/image/you are happy.jpg";
        }
    }

    if (envelope) {
        envelope.addEventListener('click', function() {
            if (this.classList.contains('open')) return; 

            this.classList.add('open');
            if (instructions) instructions.style.opacity = '0';

            const bgMusic = document.getElementById('bg-music');
            if (bgMusic && bgMusic.paused) {
                bgMusic.volume = 0.5;
                bgMusic.play().then(() => {
                    state.isMusicPlaying = true;
                    document.dispatchEvent(new Event('musicStarted'));
                }).catch(e => console.log(e));
            }

            setTimeout(() => {
                notesSection.style.display = 'flex';
                setTimeout(() => { notesSection.style.opacity = '1'; }, 50);

                document.getElementById('surprise-gallery-mount').classList.remove('hidden');
                document.getElementById('surprise-proposal-mount').classList.remove('hidden');
                document.getElementById('surprise-gift-mount').classList.remove('hidden');

                const lines = (state.memoryData.message_text || "I love you.").split('\n');
                letterContainer.innerHTML = '';

                lines.forEach((lineText, index) => {
                    if(lineText.trim() !== "") {
                        const p = document.createElement('p');
                        p.className = 'letter-line';
                        p.innerText = lineText;
                        letterContainer.appendChild(p);
                        setTimeout(() => { p.classList.add('fade-in-text'); }, 600 + (index * 800));
                    }
                });

                setTimeout(() => { signature.classList.add('fade-in-text'); }, 600 + (lines.length * 800));

                setTimeout(() => {
                    notesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 500);

            }, 1200); 
        });
    }
})();