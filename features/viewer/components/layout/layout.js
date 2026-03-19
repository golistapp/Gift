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

    // 1. Music Toggle Logic
    function toggleMusic(forcePlay = false) {
        if (!bgMusic) return;

        if (state.isMusicPlaying && !forcePlay) {
            bgMusic.pause(); 
            state.isMusicPlaying = false;
            musicToggleBtn.classList.remove('music-playing'); 
            musicStatusText.innerText = "Tap to play";
        } else {
            bgMusic.play().catch(e => console.log("Blocked by browser", e));
            state.isMusicPlaying = true;
            musicToggleBtn.classList.add('music-playing'); 
            musicStatusText.innerText = "Playing for you";
        }
    }

    // Listen for music started by Surprise Component (Envelope click)
    document.addEventListener('musicStarted', () => {
        musicToggleBtn.classList.add('music-playing'); 
        musicStatusText.innerText = "Playing for you";
    });

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
        });
    }

    if (btnGallery) {
        btnGallery.addEventListener('click', async () => { 
            resetNav(); 
            btnGallery.classList.add('active-nav'); 

            // 🚀 LAZY LOAD: Agar booth abhi tak load nahi hua hai, toh abhi karo
            if (mountBooth.innerHTML.trim() === "") {
                await window.loadViewerComponent('booth', 'booth-mount');
            }
            mountBooth.classList.remove('hidden'); 
        });
    }

    if (btnChat) {
        btnChat.addEventListener('click', async () => { 
            resetNav(); 
            btnChat.classList.add('active-nav'); 

            // 🚀 LAZY LOAD: Agar chat abhi tak load nahi hua hai, toh abhi karo
            if (mountChat.innerHTML.trim() === "") {
                await window.loadViewerComponent('chat', 'chat-mount');
            }
            mountChat.classList.remove('hidden'); 
        });
    }
})();