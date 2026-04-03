(function() {
    const state = window.formState;
    if (!state || !state.memoryData) return;

    // 🔴 Global variables for logic
    let currentReplyQuote = ""; 
    let dashLastMsgTime = "";

    const dashWrapper = document.getElementById('dash-wrapper');
    const lockScreen = document.getElementById('dash-lock-screen');
    const dashMain = document.getElementById('dash-main-screen');
    const passInput = document.getElementById('check-passcode');
    const unlockBtn = document.getElementById('verify-passcode-btn');
    const errorMsg = document.getElementById('passcode-error');

    // Naye DOM Elements
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

    function updateBFStatus(statusStr) {
        if (typeof firebaseConfig !== 'undefined' && state.memoryId) {
            fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bf_status: statusStr })
            }).catch(e => {});
        }
    }

    function updateBFReadReceipt() {
        if (document.hidden) return; 
        if (typeof firebaseConfig !== 'undefined' && state.memoryId) {
            fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bf_last_read: new Date().toISOString() })
            }).catch(e => {});
        }
    }

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) { updateBFReadReceipt(); updateBFStatus('online'); } 
        else { updateBFStatus(new Date().toISOString()); }
    });
    window.addEventListener('beforeunload', () => updateBFStatus(new Date().toISOString()));

            unlockBtn.addEventListener('click', async () => {
        const enteredPass = passInput.value.trim();
        if (!enteredPass) return;

        // Button Loading State
        unlockBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking...';
        unlockBtn.disabled = true;
        errorMsg.classList.add('hidden');

        try {
            // 🚀 SERVER SE PASSWORD VERIFY KARNA
            const response = await fetch('/api/verify-passcode', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memoryId: state.memoryId, enteredPasscode: enteredPass, requestType: 'unlock' })
            });
            const resData = await response.json();

            if (resData.success) {
                // Password match ho gaya! Ab backend ne full data (chat/photos) de diya hai
                state.memoryData = resData.memoryData;
                state.userPasscode = enteredPass;

                lockScreen.classList.add('hidden');
                dashMain.classList.remove('hidden');

                document.getElementById('chat-person-name').innerText = state.memoryData.girlfriend_name || "My Love ❤️";

                updateBFStatus('online'); updateBFReadReceipt(); 
                renderDashboardUI(); startRealtimeDashboard(); 
            } else {
                errorMsg.innerText = "Incorrect Passcode!";
                errorMsg.classList.remove('hidden');
            }
        } catch (e) {
            errorMsg.innerText = "Network Error! Try again.";
            errorMsg.classList.remove('hidden');
        }

        // Button Reset
        unlockBtn.innerHTML = 'Verify <i class="fa-solid fa-arrow-right"></i>';
        unlockBtn.disabled = false;
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

        function startRealtimeDashboard() {
        // 1. Sirf Chat ko suno
        const chatStream = new EventSource(`${firebaseConfig.databaseURL}/memories/${state.memoryId}/chat.json`);
        chatStream.addEventListener('put', (e) => {
            try {
                const payload = JSON.parse(e.data);
                if (payload.path === "/") { state.memoryData.chat = payload.data; } 
                else {
                    const idx = parseInt(payload.path.split('/')[1]);
                    if (!state.memoryData.chat) state.memoryData.chat = [];
                    state.memoryData.chat[idx] = payload.data;
                }
                renderDashboardUI();
            } catch(err) {}
        });

        // 2. Sirf GF ke Status ko suno
        const statusStream = new EventSource(`${firebaseConfig.databaseURL}/memories/${state.memoryId}/gf_status.json`);
        statusStream.addEventListener('put', (e) => {
            try {
                const payload = JSON.parse(e.data);
                if (payload.data !== undefined) {
                    state.memoryData.gf_status = payload.data;
                    updateHeaderStatus();
                }
            } catch(err) {}
        });

        // 3. GF ke Read Receipt ko suno
        const readStream = new EventSource(`${firebaseConfig.databaseURL}/memories/${state.memoryId}/gf_last_read.json`);
        readStream.addEventListener('put', (e) => {
            try {
                const payload = JSON.parse(e.data);
                if (payload.data !== undefined) {
                    state.memoryData.gf_last_read = payload.data;
                    renderDashboardUI();
                }
            } catch(err) {}
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

            // 🔴 NAYA: Parse Quote Text
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

    async function sendMessageToFirebase(rawText) {
        if(!rawText && !currentReplyQuote) return;

        // 🔴 NAYA: Add quote wrapper if reply is active
        let finalMsgText = rawText;
        if(currentReplyQuote) {
            finalMsgText = `[QUOTE]${currentReplyQuote}[/QUOTE] ${rawText}`;
        }

        playDashSound('send');
        if(navigator.vibrate) navigator.vibrate(40);

        sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; 
        sendBtn.disabled = true;

        try {
            const res = await fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`);
            const latestData = await res.json();

            let rawChat = latestData.chat || [];
            let chatList = Array.isArray(rawChat) ? rawChat : Object.values(rawChat);
            chatList = chatList.filter(msg => msg !== null && msg.sender);

            let newCount = (latestData.message_count || 0) + 1;

            const encryptedMsg = CryptoJS.AES.encrypt(finalMsgText, state.userPasscode).toString();
            chatList.push({ sender: 'bf', text: encryptedMsg, timestamp: new Date().toISOString() });

            if(chatList.length > 100) chatList = chatList.slice(chatList.length - 100);

            await fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat: chatList, message_count: newCount })
            });

            inputEl.value = ''; inputEl.style.height = 'auto'; 

            // Clear Reply state
            currentReplyQuote = "";
            if(replyPreviewBox) replyPreviewBox.classList.add('hidden');

            updateBFStatus('online'); 
        } catch(err) { alert("Error sending message."); }

        sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; 
        sendBtn.disabled = false;
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

    // 🔴 NAYA: Scroll Arrows Logic
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

    // 🔴 NAYA: Swipe To Reply Logic
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