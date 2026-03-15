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

    vaultContainer.innerHTML = AppComponents.getVaultHTML();
    surpriseContainer.innerHTML = AppComponents.getSurpriseHTML();
    chatContainer.innerHTML = AppComponents.getChatHTML();
    footerContainer.innerHTML = AppComponents.getFooterHTML();

    AppComponents.attachVaultMagic();

    // --- 2. GLOBAL VARIABLES ---
    let memoryData = null;
    let userPasscode = ""; // Encryption Key
    let enteredPasscode = "";
    const MAX_LENGTH = 6;
    let chatInterval = null; // Auto-refresh ke liye

    const musicTracks = {
        "romantic-piano": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "love-theme": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        "soft-violin": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
    };

    const bgMusic = document.getElementById('bg-music');
    let isMusicPlaying = false;

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

        if(mode === 'admin_preview') {
            vaultContainer.classList.add('hidden');
            vaultContainer.classList.remove('active-screen');
            surpriseContainer.classList.remove('hidden');
            footerContainer.classList.remove('hidden');
            setupMainScreen();
            setupNavigation();
            startChatSystem(); // Start polling chat
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
            userPasscode = enteredPasscode;

            await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scanned_at: new Date().toISOString() })
            });

            vaultContainer.classList.add('hidden');
            vaultContainer.classList.remove('active-screen');
            surpriseContainer.classList.remove('hidden');
            footerContainer.classList.remove('hidden');
            
            setupMainScreen();
            setupNavigation();
            startChatSystem(); // 🔴 CHAT START (After successful unlock)
        } else {
            dots.forEach(dot => dot.style.background = 'red');
            setTimeout(() => { enteredPasscode = ""; updateUI(); }, 500);
        }
    });

    // --- 5. INJECT DATA ---
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

    const envelopeSection = document.getElementById('envelope-section');
    const hiddenSurpriseContent = document.getElementById('hidden-surprise-content');
    
    if(envelopeSection) {
        envelopeSection.addEventListener('click', function() {
            this.classList.add('hidden'); 
            hiddenSurpriseContent.classList.remove('hidden'); 
            toggleMusic(true); 
        });
    }

    function toggleMusic(forcePlay = false) {
        const musicBtn = document.getElementById('music-toggle-btn');
        if (isMusicPlaying && !forcePlay) {
            bgMusic.pause();
            isMusicPlaying = false;
            musicBtn.style.background = 'white';
            musicBtn.style.color = '#cc0033';
        } else {
            bgMusic.play().catch(e => console.log("Blocked by browser", e));
            isMusicPlaying = true;
            musicBtn.style.background = '#cc0033';
            musicBtn.style.color = 'white';
        }
    }

    function setupNavigation() {
        const btnSurprise = document.getElementById('nav-surprise');
        const btnChat = document.getElementById('nav-chat');
        const musicBtn = document.getElementById('music-toggle-btn');

        musicBtn.addEventListener('click', () => toggleMusic());

        btnSurprise.addEventListener('click', () => {
            surpriseContainer.classList.remove('hidden');
            chatContainer.classList.add('hidden');
            btnSurprise.style.color = '#cc0033'; 
            btnChat.style.color = '#888';        
        });

        btnChat.addEventListener('click', () => {
            chatContainer.classList.remove('hidden');
            surpriseContainer.classList.add('hidden');
            btnChat.style.color = '#cc0033';     
            btnSurprise.style.color = '#888';    
            renderChatUI(); // Scroll down when opened
        });
    }

    // ==========================================
    // 🔴 STEP 2: CHAT SYSTEM LOGIC
    // ==========================================

    function startChatSystem() {
        fetchChatData(); // First load
        // Har 5 second me auto-refresh taaki BF ka naya message dikhe
        chatInterval = setInterval(fetchChatData, 5000); 
    }

    async function fetchChatData() {
        try {
            const res = await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`);
            const data = await res.json();
            if(data) {
                memoryData = data;
                renderChatUI();
            }
        } catch(e) { console.log("Silent error in polling."); }
    }

    function renderChatUI() {
        const count = memoryData.message_count || 0;
        document.getElementById('msg-count-display').innerText = `Messages: ${count} / 100`;

        const chatArea = document.getElementById('chat-messages-area');
        const chatList = memoryData.chat || [];
        
        chatArea.innerHTML = '';

        if(chatList.length === 0) {
            chatArea.innerHTML = '<p style="text-align:center; color:#888; font-size:13px; margin-top:50px;">Send a message to start the conversation...</p>';
            return;
        }

        chatList.forEach(msgObj => {
            let decryptedText = "";
            try {
                // Passcode na hone par (Admin Preview), decryption fail hoga
                const bytes = CryptoJS.AES.decrypt(msgObj.text, userPasscode);
                decryptedText = bytes.toString(CryptoJS.enc.Utf8);
            } catch(e) { decryptedText = ""; }
            
            // Security check
            if(!decryptedText || mode === 'admin_preview') {
                decryptedText = "<i>🔒 Encrypted Message</i>";
            }

            // GF messages: Pink & Right | BF messages: White & Left
            const isGf = msgObj.sender === 'gf';
            const align = isGf ? 'flex-end' : 'flex-start';
            const bg = isGf ? '#cc0033' : '#fff';
            const color = isGf ? '#fff' : '#333';
            const radius = isGf ? '15px 15px 0 15px' : '15px 15px 15px 0';
            const shadow = isGf ? '0 4px 10px rgba(204,0,51,0.2)' : '0 4px 10px rgba(0,0,0,0.05)';

            chatArea.innerHTML += `
                <div style="align-self: ${align}; background: ${bg}; color: ${color}; padding: 10px 15px; border-radius: ${radius}; max-width: 80%; font-size: 14px; box-shadow: ${shadow}; border: 1px solid #fce4ec;">
                    ${decryptedText}
                </div>
            `;
        });
        
        // Auto scroll to latest message
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    // Send Message Button Event
    document.getElementById('send-msg-btn').addEventListener('click', async () => {
        const inputEl = document.getElementById('live-msg-input');
        const msgText = inputEl.value.trim();
        
        if(!msgText) return;
        if(mode === 'admin_preview') return alert("Admin cannot send messages.");

        let currentCount = memoryData.message_count || 0;
        if(currentCount >= 100) return alert("Message limit reached (100/100).");

        const btn = document.getElementById('send-msg-btn');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        btn.disabled = true;

        try {
            // Fresh fetch to avoid collision
            const res = await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`);
            const latestData = await res.json();
            
            let chatList = latestData.chat || [];
            let newCount = (latestData.message_count || 0) + 1;
            
            if(newCount > 100) throw new Error("Limit Reached");

            // Encrypt using Passcode
            const encryptedMsg = CryptoJS.AES.encrypt(msgText, userPasscode).toString();
            
            // Add to array
            chatList.push({
                sender: 'gf', // Sender GF hai
                text: encryptedMsg,
                timestamp: new Date().toISOString()
            });

            // Auto-delete mechanism (Keep only last 5)
            if(chatList.length > 5) {
                chatList = chatList.slice(chatList.length - 5);
            }

            // Save to DB
            await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat: chatList, message_count: newCount })
            });

            inputEl.value = '';
            await fetchChatData(); // UI Refresh
        } catch(e) {
            alert(e.message === "Limit Reached" ? "100 Messages Limit Reached!" : "Error sending message.");
        }
        
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
        btn.disabled = false;
    });

});
