document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const memoryId = urlParams.get('id');
    const mode = urlParams.get('mode'); 

    if (!memoryId) {
        alert("Invalid Link! QR code me memory ID nahi hai.");
        return;
    }

    // --- 1. INITIALIZE COMPONENTS ---
    const appRoot = document.getElementById('app-root');
    const vaultContainer = document.getElementById('vault-container');
    const surpriseContainer = document.getElementById('surprise-container');
    const chatContainer = document.getElementById('chat-container');
    const footerContainer = document.getElementById('footer-container');

    // Create Gallery Container dynamically
    const galleryContainer = document.createElement('div');
    galleryContainer.id = 'gallery-container';
    galleryContainer.className = 'hidden';
    appRoot.insertBefore(galleryContainer, chatContainer);

    vaultContainer.innerHTML = AppComponents.getVaultHTML();
    surpriseContainer.innerHTML = AppComponents.getSurpriseHTML();
    galleryContainer.innerHTML = AppComponents.getGalleryHTML();
    chatContainer.innerHTML = AppComponents.getChatHTML();
    footerContainer.innerHTML = AppComponents.getFooterHTML();

    AppComponents.attachVaultMagic();

    // --- 2. GLOBAL VARIABLES ---
    let memoryData = null;
    let userPasscode = ""; 
    let enteredPasscode = "";
    const MAX_LENGTH = 6;
    let chatInterval = null; 

    const bgMusic = document.getElementById('bg-music');
    let isMusicPlaying = false;

    const keys = document.querySelectorAll('.key[data-number]');
    const clearBtn = document.querySelector('.clear-btn');
    const dots = document.querySelectorAll('.dot');
    const unlockBtn = document.getElementById('unlock-btn');

    // Mini Hearts on Screen Touch
    document.addEventListener('click', (e) => {
        if(e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        for(let i=0; i<5; i++) {
            const h = document.createElement('div');
            h.innerHTML = '❤️';
            h.style.position = 'fixed'; h.style.left = e.clientX + 'px'; h.style.top = e.clientY + 'px';
            h.style.pointerEvents = 'none'; h.style.zIndex = '9999';
            h.style.transition = 'all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            document.body.appendChild(h);
            setTimeout(() => {
                h.style.transform = `translate(${(Math.random()-0.5)*100}px, -${Math.random()*100 + 50}px) scale(${Math.random() + 0.5})`;
                h.style.opacity = '0';
            }, 10);
            setTimeout(() => h.remove(), 1000);
        }
    });

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
            openMainApp();
            return;
        }

        unlockBtn.innerText = "UNLOCK GIFT";
        updateUI();
    } catch (error) {
        console.error(error); alert("Internet connection error."); return;
    }

    // --- 4. PASSCODE & AUDIO UNLOCK LOGIC ---
    function updateUI() {
        dots.forEach((dot, index) => {
            dot.style.background = index < enteredPasscode.length ? '#cc0033' : 'rgba(0,0,0,0.1)';
        });
        unlockBtn.disabled = enteredPasscode.length !== MAX_LENGTH;
        unlockBtn.style.background = enteredPasscode.length === MAX_LENGTH ? "linear-gradient(135deg, #cc0033, #ff4d79)" : "#ccc";
    }

    keys.forEach(key => { key.addEventListener('click', () => { if (enteredPasscode.length < MAX_LENGTH) { enteredPasscode += key.getAttribute('data-number'); updateUI(); } }); });
    clearBtn.addEventListener('click', () => { if (enteredPasscode.length > 0) { enteredPasscode = enteredPasscode.slice(0, -1); updateUI(); } });

    unlockBtn.addEventListener('click', async () => {
        if (enteredPasscode === memoryData.passcode) {
            userPasscode = enteredPasscode;
            
            // 🔴 MUSIC FIX: Unlock audio context on first user tap
            bgMusic.src = (memoryData.music_id === 'gift' || !memoryData.music_id) ? 'gift.mp3' : memoryData.music_id;
            bgMusic.volume = 0.5;
            bgMusic.play().then(() => { bgMusic.pause(); }).catch(e => console.log("Audio prep", e));

            await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scanned_at: new Date().toISOString() }) });
            openMainApp();
        } else {
            dots.forEach(dot => dot.style.background = 'red');
            setTimeout(() => { enteredPasscode = ""; updateUI(); }, 500);
        }
    });

    function openMainApp() {
        vaultContainer.classList.add('hidden');
        vaultContainer.classList.remove('active-screen');
        surpriseContainer.classList.remove('hidden');
        footerContainer.classList.remove('hidden');

        // Background Hearts Init
        if(!document.getElementById('hearts-bg')) {
            const hbg = document.createElement('div'); hbg.id = 'hearts-bg';
            document.body.prepend(hbg);
            setInterval(() => {
                if (document.querySelectorAll('.bg-heart').length > 30) return; 
                const heart = document.createElement('div');
                heart.classList.add('bg-heart'); heart.innerHTML = '<i class="fa-solid fa-heart"></i>';
                heart.style.left = Math.random() * 100 + 'vw'; heart.style.fontSize = (Math.random() * 20 + 10) + 'px';
                heart.style.animationDuration = (Math.random() * 5 + 6) + 's';
                document.getElementById('hearts-bg').appendChild(heart);
                setTimeout(() => heart.remove(), 11000);
            }, 600);
        }

        setupMainScreen();
        setupNavigation();
        startChatSystem(); 
        setupLoveBooth();
    }

    // --- 5. INJECT DATA ---
    function setupMainScreen() {
        document.getElementById('dynamic-occasion').innerText = memoryData.occasion || "A Special Surprise";
        document.getElementById('dynamic-gf-name').innerText = memoryData.girlfriend_name || "My Love";
        
        document.getElementById('dynamic-ow-happy').innerText = memoryData.open_when_happy || "Smile!";
        document.getElementById('dynamic-ow-sad').innerText = memoryData.open_when_sad || "Cheer up!";
        document.getElementById('dynamic-ow-miss').innerText = memoryData.open_when_miss_me || "I am here.";
        document.getElementById('dynamic-ow-sleep').innerText = memoryData.open_when_cant_sleep || "Dream of me.";

        const polaroidContainer = document.getElementById('polaroid-container');
        polaroidContainer.innerHTML = '';
        for(let i = 1; i <= 5; i++) {
            if(memoryData[`image_${i}_url`]) {
                polaroidContainer.innerHTML += `
                    <div class="polaroid-flip" onclick="this.classList.toggle('is-flipped');">
                        <div class="polaroid-inner">
                            <div class="polaroid-front">
                                <img src="${memoryData[`image_${i}_url`]}" alt="Memory">
                                <p>${memoryData[`caption_${i}`]}</p>
                            </div>
                            <div class="polaroid-back">
                                "Every moment with you is a treasure. ❤️"
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    }

    // --- 6. ENVELOPE OPEN & LETTER FADE ---
    const envelopeSection = document.getElementById('envelope-section');
    const hiddenSurpriseContent = document.getElementById('hidden-surprise-content');
    
    if(envelopeSection) {
        envelopeSection.addEventListener('click', function() {
            this.classList.add('hidden'); 
            hiddenSurpriseContent.classList.remove('hidden'); 
            
            // Play music smoothly now
            toggleMusic(true); 

            const letterContainer = document.getElementById('dynamic-letter-container');
            const lines = (memoryData.message_text || "I love you.").split('\n');
            letterContainer.innerHTML = '';
            
            lines.forEach((lineText, index) => {
                if(lineText.trim() !== "") {
                    const p = document.createElement('p'); p.className = 'letter-line'; p.innerText = lineText;
                    letterContainer.appendChild(p);
                    setTimeout(() => { p.classList.add('fade-in-text'); }, 600 + (index * 800)); 
                }
            });
        });
    }

    // --- 7. NAVIGATION & MUSIC ---
    function toggleMusic(forcePlay = false) {
        const musicBtn = document.getElementById('music-toggle-btn');
        const statusText = document.getElementById('music-status-text');

        if (isMusicPlaying && !forcePlay) {
            bgMusic.pause(); isMusicPlaying = false;
            musicBtn.classList.remove('music-playing'); statusText.innerText = "Tap to play";
        } else {
            bgMusic.play().catch(e => console.log("Blocked by browser", e));
            isMusicPlaying = true;
            musicBtn.classList.add('music-playing'); statusText.innerText = "Playing for you";
        }
    }

    function setupNavigation() {
        const btnSurprise = document.getElementById('nav-surprise');
        const btnGallery = document.getElementById('nav-gallery');
        const btnChat = document.getElementById('nav-chat');
        const musicBtn = document.getElementById('music-toggle-btn');

        musicBtn.addEventListener('click', () => toggleMusic());

        function resetNav() {
            [btnSurprise, btnGallery, btnChat].forEach(b => b.style.color = '#888');
            [surpriseContainer, galleryContainer, chatContainer].forEach(c => c.classList.add('hidden'));
        }

        btnSurprise.addEventListener('click', () => {
            resetNav(); btnSurprise.style.color = '#cc0033'; surpriseContainer.classList.remove('hidden');
        });

        btnGallery.addEventListener('click', () => {
            resetNav(); btnGallery.style.color = '#cc0033'; galleryContainer.classList.remove('hidden');
        });

        btnChat.addEventListener('click', () => {
            resetNav(); btnChat.style.color = '#cc0033'; chatContainer.classList.remove('hidden'); renderChatUI(); 
        });
    }

    // --- 8. LOVE BOOTH LOGIC (CAMERA, FRAMES & THUMBNAILS) ---
    function setupLoveBooth() {
        const video = document.getElementById('video-preview');
        const canvasOutput = document.getElementById('canvas-output');
        const ctxOutput = canvasOutput ? canvasOutput.getContext('2d') : null;
        let stream = null;
        let userImage = null; 

        // 🔴 INJECT UPLOADED PHOTOS AS THUMBNAILS
        const thumbContainer = document.getElementById('booth-thumbnails');
        thumbContainer.innerHTML = '';
        for(let i=1; i<=5; i++) {
            if(memoryData[`image_${i}_url`]) {
                const imgUrl = memoryData[`image_${i}_url`];
                const thumb = document.createElement('img');
                thumb.src = imgUrl;
                thumb.style = "width: 60px; height: 60px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 2px solid #ccc;";
                thumb.title = "Click to edit in Love Booth";
                thumb.onclick = () => loadThumbnailToCanvas(imgUrl);
                thumbContainer.appendChild(thumb);
            }
        }

        // Load thumbnail into canvas
        function loadThumbnailToCanvas(url) {
            const img = new Image();
            img.crossOrigin = "Anonymous"; // Fixes download canvas error
            img.onload = () => {
                if(stream) { stream.getTracks().forEach(t=>t.stop()); video.style.display='none'; stream=null; }
                document.getElementById('camera-placeholder').style.display = 'none';
                canvasOutput.style.display = 'block';
                canvasOutput.width = 800; canvasOutput.height = 600; 
                
                const ratio = Math.max(canvasOutput.width / img.width, canvasOutput.height / img.height);
                const cx = (canvasOutput.width - img.width * ratio) / 2;
                const cy = (canvasOutput.height - img.height * ratio) / 2;  

                userImage = document.createElement('canvas'); userImage.width = 800; userImage.height = 600;
                userImage.getContext('2d').drawImage(img, 0, 0, img.width, img.height, cx, cy, img.width * ratio, img.height * ratio);
                applyFrame();
            };
            img.src = url;
        }

        document.getElementById('btn-start-cam').addEventListener('click', async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
                video.srcObject = stream; video.style.display = 'block';
                canvasOutput.style.display = 'none'; document.getElementById('camera-placeholder').style.display = 'none';
            } catch (err) { alert("Camera access denied. Please upload a photo instead!"); }
        });

        document.getElementById('btn-snap').addEventListener('click', () => {
            if(!stream || video.style.display === 'none') return alert("Please start camera first!");
            canvasOutput.width = 800; canvasOutput.height = 600;
            userImage = document.createElement('canvas'); userImage.width = 800; userImage.height = 600;
            const uCtx = userImage.getContext('2d');
            uCtx.translate(800, 0); uCtx.scale(-1, 1); uCtx.drawImage(video, 0, 0, 800, 600);
            
            video.style.display = 'none'; canvasOutput.style.display = 'block';
            stream.getTracks().forEach(t => t.stop()); stream = null;
            applyFrame();
        });

        document.getElementById('frame-select').addEventListener('change', () => { if(userImage) applyFrame(); });

        document.getElementById('btn-save-photo').addEventListener('click', () => {
            if(!userImage) return alert("Take or select a photo first!");
            const link = document.createElement('a'); link.download = 'Our_Memory_Booth.png';
            link.href = canvasOutput.toDataURL("image/png"); link.click();
        });

        function applyFrame() {
            const frameStyle = document.getElementById('frame-select').value;
            ctxOutput.clearRect(0,0, canvasOutput.width, canvasOutput.height);
            ctxOutput.drawImage(userImage, 0, 0);
            ctxOutput.save();

            if(frameStyle === 'valentine') {
                ctxOutput.lineWidth = 30; ctxOutput.strokeStyle = '#cc0033'; ctxOutput.strokeRect(15, 15, canvasOutput.width-30, canvasOutput.height-30);
                for(let i=0; i<8; i++) { ctxOutput.font = "50px Arial"; ctxOutput.fillText("❤️", 20+i*100, 60); ctxOutput.fillText("❤️", 20+i*100, canvasOutput.height-20); }
            } else if (frameStyle === 'polaroid-love') {
                ctxOutput.lineWidth = 40; ctxOutput.strokeStyle = '#ffffff'; ctxOutput.strokeRect(20, 20, canvasOutput.width-40, canvasOutput.height-100);
                ctxOutput.fillStyle = '#ffffff'; ctxOutput.fillRect(0, canvasOutput.height-120, canvasOutput.width, 120);
                ctxOutput.font = "bold 50px 'Dancing Script'"; ctxOutput.fillStyle = '#cc0033';
                ctxOutput.fillText("Our Beautiful Memory", canvasOutput.width/2 - 200, canvasOutput.height - 40);
            } else if (frameStyle === 'cute') {
                ctxOutput.lineWidth = 20; ctxOutput.strokeStyle = '#ff4d79'; ctxOutput.setLineDash([30, 30]); ctxOutput.strokeRect(20, 20, canvasOutput.width-40, canvasOutput.height-40);
                ctxOutput.font = "italic bold 50px 'Playfair Display'"; ctxOutput.fillStyle = 'white'; ctxOutput.shadowColor = '#ff4d79'; ctxOutput.shadowBlur = 10;
                ctxOutput.fillText("Cuties forever ✨", canvasOutput.width - 400, canvasOutput.height - 50);
            }
            ctxOutput.restore();
        }
    }

    // --- 9. SECRET CHAT SYSTEM ---
    function startChatSystem() {
        fetchChatData(); chatInterval = setInterval(fetchChatData, 5000); 
    }

    async function fetchChatData() {
        try {
            const res = await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`);
            const data = await res.json();
            if(data) { memoryData = data; renderChatUI(); }
        } catch(e) {}
    }

    function renderChatUI() {
        const count = memoryData.message_count || 0;
        document.getElementById('msg-count-display').innerText = `Messages: ${count} / 100`;
        const chatArea = document.getElementById('chat-messages-area');
        const chatList = memoryData.chat || [];
        
        chatArea.innerHTML = '';
        if(chatList.length === 0) {
            chatArea.innerHTML = '<p style="text-align:center; color:#888; font-size:13px; margin-top:50px;">Send a message to start the conversation...</p>'; return;
        }

        chatList.forEach(msgObj => {
            let decryptedText = "";
            try {
                const bytes = CryptoJS.AES.decrypt(msgObj.text, userPasscode);
                decryptedText = bytes.toString(CryptoJS.enc.Utf8);
            } catch(e) { decryptedText = ""; }
            
            if(!decryptedText || mode === 'admin_preview') { decryptedText = "<i>🔒 Encrypted Message</i>"; }

            const isGf = msgObj.sender === 'gf';
            const align = isGf ? 'flex-end' : 'flex-start';
            const bg = isGf ? '#cc0033' : '#fff';
            const color = isGf ? '#fff' : '#333';
            const radius = isGf ? '15px 15px 0 15px' : '15px 15px 15px 0';

            chatArea.innerHTML += `
                <div style="align-self: ${align}; background: ${bg}; color: ${color}; padding: 10px 15px; border-radius: ${radius}; max-width: 80%; font-size: 14px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #fce4ec;">
                    ${decryptedText}
                </div>
            `;
        });
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    document.getElementById('send-msg-btn').addEventListener('click', async () => {
        const inputEl = document.getElementById('live-msg-input');
        const msgText = inputEl.value.trim();
        
        if(!msgText) return;
        if(mode === 'admin_preview') return alert("Admin cannot send messages.");

        let currentCount = memoryData.message_count || 0;
        if(currentCount >= 100) return alert("Message limit reached (100/100).");

        const btn = document.getElementById('send-msg-btn');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; btn.disabled = true;

        try {
            const res = await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`);
            const latestData = await res.json();
            
            let chatList = latestData.chat || [];
            let newCount = (latestData.message_count || 0) + 1;
            
            if(newCount > 100) throw new Error("Limit");
            const encryptedMsg = CryptoJS.AES.encrypt(msgText, userPasscode).toString();
            
            chatList.push({ sender: 'gf', text: encryptedMsg, timestamp: new Date().toISOString() });
            if(chatList.length > 5) chatList = chatList.slice(chatList.length - 5);

            await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat: chatList, message_count: newCount })
            });

            inputEl.value = ''; await fetchChatData(); 
        } catch(e) { alert(e.message === "Limit" ? "100 Messages Limit Reached!" : "Error sending message."); }
        
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; btn.disabled = false;
    });
});
