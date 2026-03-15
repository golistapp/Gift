document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const memoryId = urlParams.get('id');
    const mode = urlParams.get('mode'); // Check if Admin is previewing

    if (!memoryId) {
        alert("Invalid Link! QR code me memory ID nahi hai.");
        return;
    }

    const keys = document.querySelectorAll('.key[data-number]');
    const clearBtn = document.querySelector('.clear-btn');
    const dots = document.querySelectorAll('.dot');
    const unlockBtn = document.getElementById('unlock-btn');
    
    let enteredPasscode = "";
    const MAX_LENGTH = 6;
    let memoryData = null;
    let userPasscode = ""; // Ise hum Encryption Key banayenge

    const musicTracks = {
        "romantic-piano": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "love-theme": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        "soft-violin": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
    };

    // --- 1. FETCH DATA ---
    try {
        unlockBtn.innerText = "LOADING...";
        const response = await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`);
        memoryData = await response.json();

        if (!memoryData || memoryData.status !== "locked") {
            alert("Surprise is not ready yet!");
            unlockBtn.innerText = "NOT READY";
            return;
        }
        
        // Agar Admin preview mode mein hai, toh direct khol do (No passcode needed)
        if(mode === 'admin_preview') {
            document.getElementById('vault-screen').classList.add('hidden');
            document.getElementById('main-memory-screen').classList.remove('hidden');
            setupMainScreen();
            return;
        }

        unlockBtn.innerText = "UNLOCK GIFT";
    } catch (error) {
        console.error(error); alert("Internet connection check karein."); return;
    }

    // --- 2. PASSCODE LOGIC ---
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
            
            // Passcode sahi hai, isko variable mein save kar lo Encryption ke liye
            userPasscode = enteredPasscode; 

            // FIREBASE TRACKING: Update 'scanned_at' time
            await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scanned_at: new Date().toISOString() })
            });

            document.getElementById('vault-screen').classList.add('hidden');
            document.getElementById('main-memory-screen').classList.remove('hidden');
            setupMainScreen();
        } else {
            dots.forEach(dot => dot.style.background = 'red');
            setTimeout(() => { enteredPasscode = ""; updateUI(); }, 500);
        }
    });

    // --- 3. INJECT DATA ---
    function setupMainScreen() {
        document.getElementById('dynamic-gf-name').innerText = memoryData.girlfriend_name || "My Love";
        document.getElementById('dynamic-letter-text').innerText = memoryData.message_text;
        
        const bgMusic = document.getElementById('bg-music');
        bgMusic.src = musicTracks[memoryData.music_id] || musicTracks["romantic-piano"];
        bgMusic.volume = 0.5;

        const polaroidContainer = document.getElementById('polaroid-container');
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

    // --- 4. ENVELOPE OPEN ---
    document.getElementById('envelope-section').addEventListener('click', function() {
        this.classList.add('hidden');
        document.getElementById('letter-section').classList.remove('hidden');
        document.getElementById('gallery-section').classList.remove('hidden');
        document.getElementById('proposal-section').classList.remove('hidden');
        document.getElementById('bg-music').play().catch(e => console.log("Music blocked by browser", e));
    });

    // --- 5. RUNAWAY NO & YES LOGIC ---
    const btnNo = document.getElementById('btn-no');
    const btnYes = document.getElementById('btn-yes');

    const evadeCursor = () => {
        const x = Math.random() * 150 - 75; const y = Math.random() * 100 - 50;
        btnNo.style.transform = `translate(${x}px, ${y}px)`;
    };
    btnNo.addEventListener('mouseover', evadeCursor);
    btnNo.addEventListener('touchstart', (e) => { e.preventDefault(); evadeCursor(); });

    btnYes.addEventListener('click', async () => {
        alert("Yayyy! I knew you'd say YES! ❤️");
        btnNo.style.display = 'none';
        btnYes.innerText = "FOREVER MINE! 💖";
        btnYes.style.transform = "scale(1.1)";
        
        if(mode !== 'admin_preview') {
            // FIREBASE TRACKING: Proposal Time (Only if not admin)
            await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proposal_accepted_at: new Date().toISOString() })
            });
        }
    });

    // --- 6. SECURE LIVE MESSAGE TO BOYFRIEND (ENCRYPTION) ---
    document.getElementById('send-msg-btn').addEventListener('click', async () => {
        const msg = document.getElementById('live-msg-input').value;
        if (!msg) return alert("Please write a message first!");
        
        if (mode === 'admin_preview') {
            return alert("You are in Admin Preview mode. Messages cannot be sent.");
        }

        const btn = document.getElementById('send-msg-btn');
        btn.innerText = "Encrypting & Sending..."; btn.disabled = true;

        try {
            // 🔴 ENCRYPTION MAGIC: Message ko Passcode se lock karo
            const encryptedMessage = CryptoJS.AES.encrypt(msg, userPasscode).toString();

            // Sirf encrypted kachra text Firebase jayega
            await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ girlfriend_message: encryptedMessage })
            });
            
            btn.innerHTML = 'Secret Message Sent! <i class="fa-solid fa-lock"></i>';
            btn.style.background = "#10b981"; // Green color
        } catch(e) {
            btn.innerText = "Error sending!"; btn.disabled = false;
        }
    });
});
