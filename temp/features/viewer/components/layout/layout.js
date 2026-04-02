(function() {
    const state = window.viewerState;
    
    // Elements
    const btnSurprise = document.getElementById('nav-surprise');
    const btnGallery = document.getElementById('nav-gallery');
    const btnChat = document.getElementById('nav-chat');
    
    const mountSurprise = document.getElementById('surprise-mount');
    const mountBooth = document.getElementById('booth-mount');
    const mountChat = document.getElementById('chat-mount');

    const musicToggleBtn = document.getElementById('music-toggle-btn');
    const musicStatusText = document.getElementById('music-status-text');
    const bgMusic = document.getElementById('bg-music');
    const bottomNav = document.querySelector('.bottom-nav-bar');
    
    // 🔴 Icon target kiya
    const musicIcon = document.getElementById('music-icon'); 

    // 1. Music Toggle Logic (Play/Pause setup)
    function toggleMusic(forcePlay = false) {
        if (!bgMusic) return;

        if (state.isMusicPlaying && !forcePlay) {
            // PAUSE music
            bgMusic.pause(); 
            state.isMusicPlaying = false;
            if(musicToggleBtn) musicToggleBtn.classList.remove('music-playing'); 
            if(musicStatusText) musicStatusText.innerText = "Tap to play";
            
            // Icon ko wapas Play mein badlo
            if(musicIcon) musicIcon.className = 'fa-solid fa-play'; 
        } else {
            // PLAY music
            bgMusic.play().catch(e => console.log("Blocked by browser", e));
            state.isMusicPlaying = true;
            if(musicToggleBtn) musicToggleBtn.classList.add('music-playing'); 
            if(musicStatusText) musicStatusText.innerText = "Playing for you";
            
            // Icon ko Pause mein badlo
            if(musicIcon) musicIcon.className = 'fa-solid fa-pause'; 
        }
    }

    // Jab envelope click karne se music start ho
    document.addEventListener('musicStarted', () => {
        if(musicToggleBtn) musicToggleBtn.classList.add('music-playing'); 
        if(musicStatusText) musicStatusText.innerText = "Playing for you";
        
        // Envelope open hote hi icon Pause ka ho jayega
        if(musicIcon) musicIcon.className = 'fa-solid fa-pause'; 
    });

    // Click event fire karna
    if (musicToggleBtn) {
        musicToggleBtn.addEventListener('click', () => toggleMusic());
    }

    // 2. Navigation Logic & Lazy Loading
    function resetNav() {
        [btnSurprise, btnGallery, btnChat].forEach(b => { 
            if(b) b.classList.remove('active-nav'); 
        });
        [mountSurprise, mountBooth, mountChat].forEach(m => { 
            if(m) m.classList.add('hidden'); 
        });
    }

    if (btnSurprise) {
        btnSurprise.addEventListener('click', () => { 
            resetNav(); 
            btnSurprise.classList.add('active-nav'); 
            mountSurprise.classList.remove('hidden'); 
            
            // Surprise tab par music button wapas dikhega
            if (musicToggleBtn) musicToggleBtn.style.display = 'flex';
        });
    }

    if (btnGallery) {
        btnGallery.addEventListener('click', async () => { 
            resetNav(); 
            btnGallery.classList.add('active-nav'); 
            
            if (mountBooth.innerHTML.trim() === "") {
                await window.loadViewerComponent('booth', 'booth-mount');
            }
            mountBooth.classList.remove('hidden'); 
            
            // Gallery aate hi hide
            if (musicToggleBtn) musicToggleBtn.style.display = 'none';
        });
    }

    if (btnChat) {
        btnChat.addEventListener('click', async () => { 
            resetNav(); 
            btnChat.classList.add('active-nav'); 
            
            if (mountChat.innerHTML.trim() === "") {
                await window.loadViewerComponent('chat', 'chat-mount');
            }
            mountChat.classList.remove('hidden'); 
            
            // Chat aate hi hide
            if (musicToggleBtn) musicToggleBtn.style.display = 'none';
        });
    }

    // 3. SMART AUTO-HIDE SCROLL ENGINE
    let lastScrollY = window.scrollY;
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                
                if (currentScrollY > lastScrollY && currentScrollY > 50) {
                    if (bottomNav) bottomNav.classList.add('nav-hidden');
                } 
                else if (currentScrollY < lastScrollY) {
                    if (bottomNav) bottomNav.classList.remove('nav-hidden');
                }
                
                lastScrollY = currentScrollY;
                ticking = false;
            });
            ticking = true;
        }
    });

})();
