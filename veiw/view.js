document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. URL se Memory ID nikalna ---
    const urlParams = new URLSearchParams(window.location.search);
    const memoryId = urlParams.get('id');

    if (!memoryId) {
        alert("Invalid Link! QR code me memory ID nahi hai.");
        return;
    }

    // --- DOM Elements ---
    const keys = document.querySelectorAll('.key[data-number]');
    const clearBtn = document.querySelector('.clear-btn');
    const dots = document.querySelectorAll('.dot');
    const unlockBtn = document.getElementById('unlock-btn');
    const vaultScreen = document.getElementById('vault-screen');
    const mainScreen = document.getElementById('main-memory-screen');
    
    const envelopeSection = document.getElementById('envelope-section');
    const letterSection = document.getElementById('letter-section');
    const gallerySection = document.getElementById('gallery-section');
    const openWhenSection = document.getElementById('open-when-section');
    const proposalSection = document.getElementById('proposal-section');
    
    const polaroidContainer = document.getElementById('polaroid-container');
    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');

    let enteredPasscode = "";
    const MAX_LENGTH = 6;
    let memoryData = null; 

    // Music URLs (Testing ke liye)
    const musicTracks = {
        "romantic-piano": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "love-theme": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        "soft-violin": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        "memory-instrumental": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
    };

    // --- 2. FETCH DATA FROM FIREBASE ---
    try {
        unlockBtn.innerText = "LOADING..."; 
        // Note: Make sure firebaseConfig is loaded from api/firebase.config.js
        const firebaseUrl = `${firebaseConfig.databaseURL}/memories/${memoryId}.json`;
        const response = await fetch(firebaseUrl);
        memoryData = await response.json();

        if (!memoryData || memoryData.status !== "locked") {
            alert("Surprise is not ready yet! Boyfriend ne abhi gift lock nahi kiya hai.");
            unlockBtn.innerText = "NOT READY";
            return;
        }
        unlockBtn.innerText = "UNLOCK GIFT";
    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Internet connection check karein.");
        unlockBtn.innerText = "ERROR";
        return;
    }

    // --- 3. PASSCODE LOGIC ---
    function updateUI() {
        dots.forEach((dot, index) => {
            if (index < enteredPasscode.length) dot.classList.add('filled');
            else dot.classList.remove('filled', 'error');
        });
        unlockBtn.disabled = enteredPasscode.length !== MAX_LENGTH;
    }

    keys.forEach(key => {
        key.addEventListener('click', () => {
            if (enteredPasscode.length < MAX_LENGTH && memoryData) {
                enteredPasscode += key.getAttribute('data-number');
                updateUI();
            }
        });
    });

    clearBtn.addEventListener('click', () => {
        if (enteredPasscode.length > 0) {
            enteredPasscode = enteredPasscode.slice(0, -1);
            updateUI();
        }
    });

    unlockBtn.addEventListener('click', () => {
        if (enteredPasscode === memoryData.passcode) {
            // Sahi Password!
            vaultScreen.classList.remove('active');
            setTimeout(() => {
                vaultScreen.classList.add('hidden');
                mainScreen.classList.remove('hidden');
                setupMainScreen(); // Data inject karna shuru karo
            }, 400);
        } else {
            // Galat Password!
            dots.forEach(dot => dot.classList.add('error'));
            setTimeout(() => { enteredPasscode = ""; updateUI(); }, 500);
        }
    });

    // --- 4. POPULATE DATA (MAGIC HAPPENS HERE) ---
    function setupMainScreen() {
        // GF Name & Letter
        document.getElementById('dynamic-gf-name').innerText = memoryData.girlfriend_name || "My Love";
        document.getElementById('dynamic-letter-text').innerText = memoryData.message_text;
        
        // Music setup
        bgMusic.src = musicTracks[memoryData.music_id] || musicTracks["romantic-piano"];
        bgMusic.volume = 0.5;

        // 5 Photos Gallery Loop
        polaroidContainer.innerHTML = ''; 
        for(let i = 1; i <= 5; i++) {
            const photoUrl = memoryData[`image_${i}_url`];
            const caption = memoryData[`caption_${i}`];
            
            if(photoUrl) {
                const polaroidHTML = `
                    <div class="polaroid" style="animation: fadeIn 1s ease-in ${i * 0.2}s both;">
                        <img src="${photoUrl}" alt="Memory ${i}">
                        <div class="polaroid-caption">${caption}</div>
                    </div>
                `;
                polaroidContainer.innerHTML += polaroidHTML;
            }
        }
    }

    // --- 5. ENVELOPE OPEN LOGIC ---
    envelopeSection.addEventListener('click', () => {
        // Hide Envelope, Show all other sections
        envelopeSection.classList.add('hidden');
        letterSection.classList.remove('hidden');
        gallerySection.classList.remove('hidden');
        openWhenSection.classList.remove('hidden');
        proposalSection.classList.remove('hidden');
        musicToggle.classList.remove('hidden');

        // Play Music
        bgMusic.play().catch(e => console.log("Music blocked by browser:", e));
        musicToggle.classList.add('playing');
    });

    // --- 6. MUSIC TOGGLE BUTTON ---
    let isPlaying = true;
    musicToggle.addEventListener('click', () => {
        if(isPlaying) {
            bgMusic.pause();
            musicToggle.classList.remove('playing');
        } else {
            bgMusic.play();
            musicToggle.classList.add('playing');
        }
        isPlaying = !isPlaying;
    });

    // --- 7. OPEN WHEN CARDS MODAL LOGIC ---
    const owModal = document.getElementById('ow-modal');
    const owModalText = document.getElementById('ow-modal-text');
    
    document.querySelectorAll('.ow-card').forEach(card => {
        card.addEventListener('click', () => {
            const mood = card.getAttribute('data-mood'); // happy, sad, miss_me, cant_sleep
            // Firebase field name banayein: "open_when_happy"
            const moodText = memoryData[`open_when_${mood}`]; 
            
            owModalText.innerText = moodText || "I love you!";
            owModal.classList.remove('hidden');
        });
    });

    document.getElementById('close-modal').addEventListener('click', () => {
        owModal.classList.add('hidden');
    });

    // --- 8. RUNAWAY PROPOSAL BUTTON (FUN FEATURE) ---
    const btnNo = document.getElementById('btn-no');
    const btnYes = document.getElementById('btn-yes');

    const evadeCursor = () => {
        const x = Math.random() * 200 - 100; // Random X shift
        const y = Math.random() * 200 - 100; // Random Y shift
        btnNo.style.transform = `translate(${x}px, ${y}px)`;
    };

    // Mobile aur Desktop dono ke liye touch/hover
    btnNo.addEventListener('mouseover', evadeCursor);
    btnNo.addEventListener('touchstart', (e) => { e.preventDefault(); evadeCursor(); });

    btnYes.addEventListener('click', () => {
        alert("Yayyy! I knew you'd say YES! ❤️ I love you!");
        btnNo.style.display = 'none'; // Hide NO button
        btnYes.innerText = "FOREVER MINE! 💖";
        btnYes.style.transform = "scale(1.1)";
    });
});