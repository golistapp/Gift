document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const memoryId = urlParams.get('id');
    const mode = urlParams.get('mode'); // Admin preview check

    if (!memoryId) {
        alert("Invalid Link! QR code me memory ID nahi hai.");
        return;
    }

    // --- 1. INITIALIZE COMPONENTS ---
    const vaultContainer = document.getElementById('vault-container');
    const surpriseContainer = document.getElementById('surprise-container');
    const chatContainer = document.getElementById('chat-container');
    const footerContainer = document.getElementById('footer-container');

    // UI inject karna components.js se
    vaultContainer.innerHTML = AppComponents.getVaultHTML();
    surpriseContainer.innerHTML = AppComponents.getSurpriseHTML();
    chatContainer.innerHTML = AppComponents.getChatHTML();
    footerContainer.innerHTML = AppComponents.getFooterHTML();

    // Vault Tap Sound & Heart Magic activate karna
    AppComponents.attachVaultMagic();

    // --- 2. GLOBAL VARIABLES ---
    let memoryData = null;
    let userPasscode = ""; // Encryption Key banegi aage chalkar
    let enteredPasscode = "";
    const MAX_LENGTH = 6;

    const musicTracks = {
        "romantic-piano": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "love-theme": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        "soft-violin": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
    };

    const bgMusic = document.getElementById('bg-music');
    let isMusicPlaying = false;

    // --- DOM Elements ---
    const keys = document.querySelectorAll('.key[data-number]');
    const clearBtn = document.querySelector('.clear-btn');
    const dots = document.querySelectorAll('.dot');
    const unlockBtn = document.getElementById('unlock-btn');

    // --- 3. FETCH DATA ---
    try {
        unlockBtn.innerText = "LOADING...";
        const response = await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`);
        memoryData = await response.json();

        if (!memoryData || memoryData.status !== "locked") {
            alert("Surprise is not ready yet!");
            unlockBtn.innerText = "NOT READY";
            return;
        }

        // Admin Preview mode bypass
        if(mode === 'admin_preview') {
            vaultContainer.classList.add('hidden');
            vaultContainer.classList.remove('active-screen');
            surpriseContainer.classList.remove('hidden');
            footerContainer.classList.remove('hidden');
            setupMainScreen();
            setupNavigation();
            return;
        }

        unlockBtn.innerText = "UNLOCK GIFT";
        updateUI();
    } catch (error) {
        console.error(error); alert("Internet connection check karein."); return;
    }

    // --- 4. PASSCODE LOGIC ---
    function updateUI() {
        dots.forEach((dot, index) => {
            dot.style.background = index < enteredPasscode.length ? '#cc0033' : 'rgba(0,0,0,0.1)';
        });
        unlockBtn.disabled = enteredPasscode.length !== MAX_LENGTH;
        unlockBtn.style.background = enteredPasscode.length === MAX_LENGTH ? "linear-gradient(135deg, #cc0033, #ff4d79)" : "#ccc";
    }

    keys.forEach(key => {
        key.addEventListener('click', () => {
            if (enteredPasscode.length < MAX_LENGTH) { enteredPasscode += key.getAttribute('data-number'); updateUI(); }
        });
    });

    clearBtn.addEventListener('click', () => {
        if (enteredPasscode.length > 0) { enteredPasscode = enteredPasscode.slice(0, -1); updateUI(); }
    });

    unlockBtn.addEventListener('click', async () => {
        if (enteredPasscode === memoryData.passcode) {
            userPasscode = enteredPasscode; // Save for encryption later

            // FIREBASE TRACKING: Scanned time
            await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scanned_at: new Date().toISOString() })
            });

            // Hide Vault, Show Surprise & Footer
            vaultContainer.classList.add('hidden');
            vaultContainer.classList.remove('active-screen');
            surpriseContainer.classList.remove('hidden');
            footerContainer.classList.remove('hidden');
            
            setupMainScreen();
            setupNavigation();
        } else {
            dots.forEach(dot => dot.style.background = 'red');
            setTimeout(() => { enteredPasscode = ""; updateUI(); }, 500);
        }
    });

    // --- 5. INJECT DATA TO UI ---
    function setupMainScreen() {
        document.getElementById('dynamic-gf-name').innerText = memoryData.girlfriend_name || "My Love";
        document.getElementById('dynamic-letter-text').innerText = memoryData.message_text;
        
        bgMusic.src = musicTracks[memoryData.music_id] || musicTracks["romantic-piano"];
        bgMusic.volume = 0.5;

        const polaroidContainer = document.getElementById('polaroid-container');
        polaroidContainer.innerHTML = '';
        for(let i = 1; i <= 5; i++) {
            if(memoryData[`image_${i}_url`]) {
                polaroidContainer.innerHTML += `
                    <div style="background: white; padding: 15px 15px 30px 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border-radius: 4px; transform: rotate(${i%2===0 ? '3deg' : '-3deg'}); width: 90%; max-width: 300px;">
                        <img src="${memoryData[`image_${i}_url`]}" style="width: 100%; height: 250px; object-fit: cover; border-radius: 2px;">
                        <p style="font-family: 'Dancing Script'; font-size: 24px; color: #333; margin-top: 15px; text-align: center;">${memoryData[`caption_${i}`]}</p>
                    </div>
                `;
            }
        }
    }

    // --- 6. ENVELOPE OPEN LOGIC ---
    const envelopeSection = document.getElementById('envelope-section');
    const hiddenSurpriseContent = document.getElementById('hidden-surprise-content');
    
    if(envelopeSection) {
        envelopeSection.addEventListener('click', function() {
            this.classList.add('hidden'); // Hide envelope
            hiddenSurpriseContent.classList.remove('hidden'); // Show gallery & letter
            toggleMusic(true); // Auto play music on open
        });
    }

    // --- 7. BOTTOM NAVIGATION & MUSIC TOGGLE LOGIC ---
    function toggleMusic(forcePlay = false) {
        const musicBtn = document.getElementById('music-toggle-btn');
        if (isMusicPlaying && !forcePlay) {
            bgMusic.pause();
            isMusicPlaying = false;
            musicBtn.style.background = 'white';
            musicBtn.style.color = '#cc0033';
        } else {
            bgMusic.play().catch(e => console.log("Browser blocked music autoplay", e));
            isMusicPlaying = true;
            musicBtn.style.background = '#cc0033';
            musicBtn.style.color = 'white';
        }
    }

    function setupNavigation() {
        const btnSurprise = document.getElementById('nav-surprise');
        const btnChat = document.getElementById('nav-chat');
        const musicBtn = document.getElementById('music-toggle-btn');

        // Music Button click handler
        musicBtn.addEventListener('click', () => toggleMusic());

        // Surprise Tab Click
        btnSurprise.addEventListener('click', () => {
            surpriseContainer.classList.remove('hidden');
            chatContainer.classList.add('hidden');
            
            btnSurprise.style.color = '#cc0033'; // Active color
            btnChat.style.color = '#888';        // Inactive color
        });

        // Chat Tab Click
        btnChat.addEventListener('click', () => {
            chatContainer.classList.remove('hidden');
            surpriseContainer.classList.add('hidden');
            
            btnChat.style.color = '#cc0033';     // Active color
            btnSurprise.style.color = '#888';    // Inactive color
        });
    }

    // ==========================================
    // CHAT SYSTEM LOGIC WILL COME IN STEP 2
    // ==========================================
});
