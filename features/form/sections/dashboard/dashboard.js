(function() {
    const state = window.formState;
    if (!state || !state.memoryData) return;

    // --- FIREBASE INITIALIZATION ---
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.database();

    // 🔴 Global variables for logic
    let currentReplyQuote = ""; 
    let dashLastMsgTime = "";

    const dashWrapper = document.getElementById('dash-wrapper');
    const lockScreen = document.getElementById('dash-lock-screen');
    const dashMain = document.getElementById('dash-main-screen');
    const passInput = document.getElementById('check-passcode');
    const unlockBtn = document.getElementById('verify-passcode-btn');
    const errorMsg = document.getElementById('passcode-error');

    // DOM Elements
    const chatArea = document.getElementById('bf-chat-area');
    const inputEl = document.getElementById('bf-chat-input');
    const sendBtn = document.getElementById('bf-send-btn');
    const galleryBtn = document.getElementById('bf-gallery-btn');
    const replyPreviewBox = document.getElementById('reply-preview-box');
    const replyTextPreview = document.getElementById('reply-text-preview');
    const cancelReplyBtn = document.getElementById('cancel-reply-btn');
    const scrollArrows = document.getElementById('scroll-arrows');
    const scrollTopBtn = document.getElementById('scroll-top-btn');
    const scrollBottomBtn = document.getElementById('scroll-bottom-btn');

    function playDashSound(type) {
        try {
            let soundId = type === 'send' ? 'dash-sound-send' : 'dash-sound-receive';
            let soundEl = document.getElementById(soundId);
            if(!soundEl) {
                soundEl = document.createElement('audio');
                soundEl.id = soundId;
                soundEl.src = type === 'send' ? "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3" : "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3";
                document.body.appendChild(soundEl);
            }
            soundEl.currentTime = 0;
            soundEl.play();
        } catch(e) { }
    }

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            dashWrapper.style.height = window.visualViewport.height + 'px';
            if(chatArea) chatArea.scrollTop = chatArea.scrollHeight;
        });
    }

    function formatTime(isoString) {
        if(!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // --- FIREBASE REALTIME WRITES ---
    function updateBFStatus(statusStr) {
        if (state.memoryId) {
            db.ref(`memories/${state.memoryId}/bf_status`).set(statusStr).catch(e=>{});
        }
    }

    function updateBFReadReceipt() {
        if (document.hidden || !state.memoryId) return; 
        db.ref(`memories/${state.memoryId}/bf_last_read`).set(new Date().toISOString()).catch(e=>{});
    }

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) { updateBFReadReceipt(); updateBFStatus('online'); } 
        else { updateBFStatus(new Date().toISOString()); }
    });
    window.addEventListener('beforeunload', () => updateBFStatus(new Date().toISOString()));

    unlockBtn.addEventListener('click', () => {
        const storedPass = state.memoryData.passcode || "";
        const enteredPass = passInput.value.trim();

        if (storedPass === enteredPass || (enteredPass !== "" && storedPass.endsWith(enteredPass))) {
            state.userPasscode = enteredPass;
            lockScreen.classList.add('hidden');
            dashMain.classList.remove('hidden');
            document.getElementById('chat-person-name').innerText = state.memoryData.girlfriend_name || "My Love ❤️";

            updateBFStatus('online'); updateBFReadReceipt(); 
            renderDashboardUI(); 
            startRealtimeDashboard(); 
        } else {
            errorMsg.classList.remove('hidden');
        }
    });

    function updateHeaderStatus() {
        const statusEl = document.getElementById('live-status');
        if (!statusEl) return;
        let statusHtml = "";
        const gfStatus = state.memoryData.gf_status;

        if (gfStatus === 'typing...') statusHtml = '<span style="color:#a7f3d0;">typing...</span>';
        else if (gfStatus === 'online') statusHtml = '<span style="color:#a7f3d0;">online</span>';
        else if (gfStatus && gfStatus !== 'offline') {
            let dateObj = new Date(gfStatus);
            if(!isNaN(dateObj)) statusHtml = `<span style="color:#e2e8f0; opacity:0.9;">last seen at ${formatTime(gfStatus)}</span>`;
        }
        statusEl.innerHTML = statusHtml;

        document.getElementById('track-scanned').innerText = state.memoryData.scanned_at ? formatTime(state.memoryData.scanned_at) : "Wait...";
        document.getElementById('track-proposal').innerText = state.memoryData.proposal_accepted_at ? formatTime(state.memoryData.proposal_accepted_at) : "Wait...";
    }

    function syncWithLocalStorage(firebaseChat) {
        if (!firebaseChat || !Array.isArray(firebaseChat)) return [];
        const localKey = 'secret_chat_' + state.memoryId;
        let localChat = [];
        try {
            const stored = localStorage.getItem(localKey);
            if (stored) localChat = JSON.parse(stored);
        } catch(e) {}

        const chatMap = new Map();
        localChat.forEach(msg => chatMap.set(msg.timestamp, msg));
        firebaseChat.forEach(msg => chatMap.set(msg.timestamp, msg)); 

        let combinedChat = Array.from(chatMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        if (combinedChat.length > 2000) combinedChat = combinedChat.slice(combinedChat.length - 2000);
        try { localStorage.setItem(localKey, JSON.stringify(combinedChat)); } catch(e) {}

        return combinedChat;
    }

    // --- FIREBASE NATIVE LISTENERS (WEBSOCKETS) ---
    function startRealtimeDashboard() {
        const memRef = db.ref(`memories/${state.memoryId}`);

        // Listen for Chat Array Updates
        memRef.child('chat').on('value', (snapshot) => {
            state.memoryData.chat = snapshot.val() || [];
            renderDashboardUI();
        });

        // Listen for GF Status Updates
        memRef.child('gf_status').on('value', (snapshot) => {
            state.memoryData.gf_status = snapshot.val();
            updateHeaderStatus();
        });

        // Listen for GF Read Receipt
        memRef.child('gf_last_read').on('value', (snapshot) => {
            state.memoryData.gf_last_read = snapshot.val();
            renderDashboardUI(); // Update Blue Ticks
        });

        // Listen for message counts
        memRef.child('message_count').on('value', (snapshot) => {
            state.memoryData.message_count = snapshot.val() || 0;
            renderDashboardUI();
        });
    }

    function renderDashboardUI() {
        updateHeaderStatus(); 

        let rawChat = state.memoryData.chat || [];
        let firebaseChat = Array.isArray(rawChat) ? rawChat : Object.values(rawChat);
        firebaseChat = firebaseChat.filter(msg => msg !== null && msg.sender);

        const chatList = syncWithLocalStorage(firebaseChat); 
        const count = state.memoryData.message_count || 0;

        document.getElementById('bf-msg-count').innerHTML = `<i class="fa-solid fa-lock" style="font-size:9px;"></i> End-to-End Encrypted &bull; Cloud: ${firebaseChat.length}/100 (Total: ${count})`;

        if(chatList.length > 0) {
            inputEl.disabled = false; sendBtn.disabled = false; if(galleryBtn) galleryBtn.disabled = false;
            if(inputEl.placeholder === "Waiting for her reply...") inputEl.placeholder = "Type a message...";
        } else {
            inputEl.disabled = true; sendBtn.disabled = true; if(galleryBtn) galleryBtn.disabled = true;
            inputEl.placeholder = "Waiting for her reply...";
            chatArea.innerHTML = '<div style="text-align:center; padding: 20px; color: #666; font-size: 13px; background: rgba(255,255,255,0.7); border-radius: 10px; margin: auto;">Waiting for her to start the conversation...</div>';
            return;
        }

        const currentLastMsg = chatList[chatList.length - 1];
        const isNewMessage = dashLastMsgTime !== "" && dashLastMsgTime !== currentLastMsg.timestamp;

        if(currentLastMsg.sender === 'gf') {
            const bfReadTime = state.memoryData.bf_last_read ? new Date(state.memoryData.bf_last_read).getTime() : 0;
            const msgTime = new Date(currentLastMsg.timestamp).getTime();
            if (msgTime > bfReadTime) updateBFReadReceipt(); 
        }

        if(isNewMessage && currentLastMsg.sender === 'gf') playDashSound('receive');

        const gfReadTime = state.memoryData.gf_last_read ? new Date(state.memoryData.gf_last_read).getTime() : 0;

        let newHtml = '';
        chatList.forEach(msgObj => {
            let decryptedText = "";
            try {
                const bytes = CryptoJS.AES.decrypt(msgObj.text, state.userPasscode);
                decryptedText = bytes.toString(CryptoJS.enc.Utf8);
            } catch(e) { decryptedText = ""; }

            let quoteHtml = "";
            const quoteRegex = /\[QUOTE\](.*?)\[\/QUOTE\]/s;
            const match = decryptedText.match(quoteRegex);
            if (match) {
                quoteHtml = `<div class="quote-box">${match[1]}</div>`;
                decryptedText = decryptedText.replace(quoteRegex, '').trim();
            }
            decryptedText = decryptedText.replace(/\n/g, '<br>');

            let imageHtml = "";
            if (decryptedText.startsWith("[IMG_") && decryptedText.endsWith("]")) {
                let idx = parseInt(decryptedText.substring(5, decryptedText.length - 1));
                let imgUrl = state.memoryData[`image_${idx}_url`];
                if(imgUrl) {
                    imageHtml = `<img src="${imgUrl}" class="chat-img-msg">`;
                    decryptedText = ""; 
                } else {
                    decryptedText = "<i>📷 Image Missing</i>";
                }
            } else if(!decryptedText && !quoteHtml) { 
                decryptedText = "<i>🔒 Encrypted Message</i>"; 
            }

            const isBf = msgObj.sender === 'bf';
            const timeStr = formatTime(msgObj.timestamp);
            const msgTime = new Date(msgObj.timestamp).getTime();

            let tickHtml = '';
            if (isBf) {
                const isRead = gfReadTime >= msgTime;
                tickHtml = `<span class="msg-tick ${isRead ? 'tick-blue' : 'tick-grey'}"><i class="fa-solid fa-check-double"></i></span>`;
            }

            const bubblePadding = imageHtml ? 'padding: 4px 4px 20px 4px;' : '';

            newHtml += `
                <div class="msg-wrapper ${isBf ? 'bf' : 'gf'}">
                    <div class="msg-bubble" style="${bubblePadding}">
                        ${quoteHtml}
                        ${imageHtml}
                        <span class="msg-raw-text">${decryptedText}</span>
                        <div class="msg-meta">
                            <span class="msg-time">${timeStr}</span>
                            ${tickHtml}
                        </div>
                    </div>
                </div>`;
        });

        if (chatArea.innerHTML !== newHtml) {
            chatArea.innerHTML = newHtml;
            if (isNewMessage || dashLastMsgTime === "") chatArea.scrollTop = chatArea.scrollHeight; 
        }
        dashLastMsgTime = currentLastMsg.timestamp;
    }

    // --- FIREBASE NATIVE PUSH (Transaction for Safety) ---
    function sendMessageToFirebase(rawText) {
        if(!rawText && !currentReplyQuote) return;

        let finalMsgText = rawText;
        if(currentReplyQuote) {
            finalMsgText = `[QUOTE]${currentReplyQuote}[/QUOTE] ${rawText}`;
        }

        playDashSound('send');
        if(navigator.vibrate) navigator.vibrate(40);

        sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; 
        sendBtn.disabled = true;

        const memRef = db.ref(`memories/${state.memoryId}`);
        const encryptedMsg = CryptoJS.AES.encrypt(finalMsgText, state.userPasscode).toString();
        const newMsgObj = { sender: 'bf', text: encryptedMsg, timestamp: new Date().toISOString() };

        // Use transaction to safely append message and avoid overwrites
        memRef.child('chat').transaction((currentChat) => {
            let chatList = currentChat || [];
            if (!Array.isArray(chatList)) chatList = Object.values(chatList);
            chatList.push(newMsgObj);
            if (chatList.length > 100) chatList = chatList.slice(chatList.length - 100);
            return chatList;
        }, (error, committed) => {
            if (error) {
                alert("Error sending message. Check connection.");
            } else if (committed) {
                // Update Message Count Safely
                memRef.child('message_count').transaction(c => (c || 0) + 1);

                inputEl.value = ''; inputEl.style.height = 'auto'; 
                currentReplyQuote = "";
                if(replyPreviewBox) replyPreviewBox.classList.add('hidden');
                updateBFStatus('online'); 
            }
            sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; 
            sendBtn.disabled = false;
        });
    }

    // Gallery Popup Logic
    const imgPopup = document.getElementById('bf-img-popup');
    const closePopup = document.getElementById('bf-close-popup');
    const imgGrid = document.getElementById('bf-img-grid');

    if(galleryBtn) {
        galleryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            imgGrid.innerHTML = '';
            let found = false;
            for(let i=1; i<=5; i++) {
                let imgUrl = state.memoryData[`image_${i}_url`];
                if(imgUrl) {
                    found = true;
                    let imgEl = document.createElement('img');
                    imgEl.src = imgUrl;
                    imgEl.onclick = () => { imgPopup.classList.add('hidden'); sendMessageToFirebase(`[IMG_${i}]`); };
                    imgGrid.appendChild(imgEl);
                }
            }
            if(!found) imgGrid.innerHTML = '<span style="font-size:12px; color:#888; padding: 10px;">No memories uploaded.</span>';
            imgPopup.classList.remove('hidden');
        });
        closePopup.addEventListener('click', () => imgPopup.classList.add('hidden'));
    }

    let typingTimer;
    if (sendBtn) {
        sendBtn.addEventListener('mousedown', (e) => e.preventDefault());
        sendBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if(!sendBtn.disabled) sendBtn.click(); });
        sendBtn.addEventListener('click', () => sendMessageToFirebase(inputEl.value.trim()));

        inputEl.addEventListener('input', function() {
            this.style.height = 'auto'; this.style.height = (this.scrollHeight) + 'px';
            updateBFStatus('typing...');
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => updateBFStatus('online'), 1500);
        });
        inputEl.addEventListener('focus', () => { updateBFReadReceipt(); updateBFStatus('online'); });
    }

    let scrollTimeout;
    if(chatArea && scrollArrows) {
        chatArea.addEventListener('scroll', () => {
            scrollArrows.classList.remove('hidden');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => scrollArrows.classList.add('hidden'), 1500);
        });
        if(scrollTopBtn) scrollTopBtn.addEventListener('click', () => chatArea.scrollTo({top: 0, behavior: 'smooth'}));
        if(scrollBottomBtn) scrollBottomBtn.addEventListener('click', () => chatArea.scrollTo({top: chatArea.scrollHeight, behavior: 'smooth'}));
    }

    let touchStartX = 0, touchStartY = 0, swipedMsg = null;
    if(chatArea) {
        chatArea.addEventListener('touchstart', e => {
            const msg = e.target.closest('.msg-wrapper');
            if(!msg) return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            swipedMsg = msg;
        }, {passive: true});

        chatArea.addEventListener('touchmove', e => {
            if(!swipedMsg) return;
            let diffX = e.touches[0].clientX - touchStartX;
            let diffY = e.touches[0].clientY - touchStartY;
            if(Math.abs(diffX) > Math.abs(diffY) && diffX > 15) { 
                swipedMsg.style.transform = `translateX(${Math.min(diffX, 50)}px)`;
            }
        }, {passive: true});

        chatArea.addEventListener('touchend', e => {
            if(!swipedMsg) return;
            let diffX = e.changedTouches[0].clientX - touchStartX;
            if(diffX > 40) {
                let rawTextEl = swipedMsg.querySelector('.msg-raw-text');
                let imgEl = swipedMsg.querySelector('.chat-img-msg');

                let quoteText = rawTextEl ? rawTextEl.innerText : "";
                if(imgEl) quoteText = "📷 Photo";

                if(quoteText) {
                    currentReplyQuote = quoteText.substring(0, 40) + (quoteText.length > 40 ? "..." : "");
                    if(replyTextPreview) replyTextPreview.innerText = currentReplyQuote;
                    if(replyPreviewBox) replyPreviewBox.classList.remove('hidden');
                    if(inputEl) inputEl.focus();
                    if(navigator.vibrate) navigator.vibrate(50);
                }
            }
            swipedMsg.style.transform = 'translateX(0)';
            swipedMsg = null;
        });

        if(cancelReplyBtn) {
            cancelReplyBtn.addEventListener('click', () => {
                currentReplyQuote = "";
                replyPreviewBox.classList.add('hidden');
            });
        }
    }
})();