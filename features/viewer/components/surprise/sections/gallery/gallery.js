(function() {
    const state = window.viewerState;
    if (!state || !state.memoryData) return;
    const memoryData = state.memoryData;

    // Audio elements ko select karein
    const clickSound = document.getElementById('sound-click-card');
    
    if (clickSound) {
        clickSound.volume = 0.6; // Volume set karein
    }

    // Generate Polaroids logic (Aapka purana logic waise hi rahega)
    const polaroidContainer = document.getElementById('dynamic-polaroids');
    if (polaroidContainer) {
        polaroidContainer.innerHTML = '';
        for(let i = 1; i <= 5; i++) {
            if(memoryData[`image_${i}_url`]) {
                const isAesthetic = (i === 1 || i === 5);
                const isPremiumRose = (i === 3);

                let imageHtml = `<img src="${memoryData[`image_${i}_url`]}" alt="Memory ${i}">`;
                let aestheticHtml = '';
                if (isAesthetic) {
                    const occasionText = memoryData.occasion || "Happy Anniversary";
                    aestheticHtml = `<div class="aesthetic-border"></div><div class="aesthetic-top-text">${occasionText}</div><div class="aesthetic-bottom-text">2026</div>`;
                }

                let cardClasses = 'polaroid-wrapper';
                if (isAesthetic) cardClasses += ' aesthetic-card';
                if (isPremiumRose) cardClasses += ' premium-rose-card';

                polaroidContainer.innerHTML += `
                    <div class="${cardClasses}" data-index="${i}">
                        <div class="washi-tape"></div>
                        <div class="polaroid-inner">
                            <div class="polaroid-front">
                                ${aestheticHtml}
                                <div class="img-container">${imageHtml}</div>
                                ${!isAesthetic ? `<p>${memoryData[`caption_${i}`] || ''}</p>` : ''}
                            </div>
                            <div class="polaroid-back">"${memoryData[`caption_${i}`] || 'Every moment with you is a treasure. ❤️'}"</div>
                        </div>
                    </div>
                `;
            }
        }

        // --- CLICK EVENT WITH SOUND FIX ---
        document.querySelectorAll('.polaroid-wrapper').forEach(card => {
            card.addEventListener('click', function() {
                
                // Sound logic: Pehle reset karein phir play karein
                if (clickSound) {
                    clickSound.pause(); // Agar pehle se chal raha ho toh rokein
                    clickSound.currentTime = 0; // Shuruat par le jayein
                    
                    // Play promise handle karein (browser security ke liye)
                    const playPromise = clickSound.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.log("Audio play failed:", error);
                        });
                    }
                }

                // Card flip karein
                this.classList.toggle('is-flipped');
                
                // Haptic feedback (Mobile ke liye)
                if (navigator.vibrate) navigator.vibrate(30);
            });
        });
    }
})();
