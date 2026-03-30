(function() {
    const state = window.viewerState;
    if (!state || !state.memoryData) return;
    const memoryData = state.memoryData;

    const occasionEl = document.getElementById('dynamic-occasion');
    const nameEl = document.getElementById('dynamic-gf-name');
    const subtitleEl = document.getElementById('dynamic-subtitle');
    const iconEl = document.getElementById('scroll-hint-icon');
    const roseContainer = document.getElementById('dynamic-rose-container'); 

    // 1. Text Format Logic (Occasion ko 2 line mein todna)
    const fullOccasion = memoryData.occasion || "A Special Surprise";
    const words = fullOccasion.split(' ');
    let occasionHtml = fullOccasion;
    
    if (words.length > 1) {
        const firstWord = words[0]; 
        const restWords = words.slice(1).join(' '); 
        occasionHtml = `<span style="display:block;">${firstWord}</span><span style="display:block;">${restWords}</span>`;
    }

    if (occasionEl) occasionEl.innerHTML = occasionHtml;
    if (nameEl) nameEl.innerText = memoryData.girlfriend_name || "My Love";

    // 2. STABLE ANIMATION SEQUENCE (1 SEC WAIT)
    setTimeout(() => {
        
        // Naya aur smooth animation class add kiya hai
        if (roseContainer) roseContainer.classList.add('show-element');
        if (occasionEl) occasionEl.classList.add('show-element');

        setTimeout(() => {
            if (nameEl) nameEl.classList.add('show-element');

            setTimeout(() => {
                if (subtitleEl) {
                    subtitleEl.style.opacity = '1';
                    const msg = "Every moment with you is a beautiful dream come true.";
                    let i = 0;
                    
                    const heroTypingSound = new Audio('assets/audio/pen.mp3');
                    heroTypingSound.loop = true;
                    heroTypingSound.volume = 0.5;
                    
                    heroTypingSound.play().catch(e => console.log("Sound blocked by browser", e));
                    
                    const typeWriter = setInterval(() => {
                        if (i < msg.length) {
                            subtitleEl.innerHTML = msg.substring(0, i + 1) + '<span class="typing-cursor"></span>';
                            i++;
                        } else {
                            clearInterval(typeWriter);
                            subtitleEl.innerHTML = msg; 
                            
                            heroTypingSound.pause();
                            heroTypingSound.currentTime = 0;
                            
                            if(iconEl) iconEl.classList.remove('hidden');
                        }
                    }, 50); 
                }
            }, 1000); 

        }, 1000); 

    }, 1000); 
})();
