(function() {
    const state = window.viewerState;
    if (!state) return;

    let lastMsgTime = ""; 
    const gfChatWrapper = document.getElementById('gf-chat-wrapper');
    const chatArea = document.getElementById('chat-messages-area');
    const inputEl = document.getElementById('live-msg-input');
    const sendBtn = document.getElementById('send-msg-btn');
    const countDisplay = document.getElementById('msg-count-display');
    const soundSend = document.getElementById('sound-send');
    const soundReceive = document.getElementById('sound-receive');

    // 🔴 1. THE GAP FIX: Ultimate Keyboard & Viewport Fix
    if (window.visualViewport && gfChatWrapper) {
        window.visualViewport.addEventListener('resize', () => {
            if (window.visualViewport.height < window.innerHeight - 50) {
                // Keyboard OPEN - Force Full Screen & Hide other elements
                gfChatWrapper.style.cssText = `
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100vw !important;
                    height: ${window.visualViewport.height}px !important;
                    z-index: 999999 !important;
                    border-radius: 0 !important;
                    border: none !important;
                    margin: 0 !important;
                    background: #fdf2f5 !important;
                `;

                // Niche ka Menu (Footer) aur Music button hide kardo taaki Gap na aaye
                const footer = document.getElementById('footer-mount');
                if (footer) footer.style.display = 'none';

                // Music button ko hide karne ka try karega
                const floatBtns = document.querySelectorAll('.music-float-btn, .floating-btn, [id*="music"]');
                floatBtns.forEach(btn => { if(btn.style) btn.style.display = 'none'; });

                window.scrollTo(0, 0); // Scroll lock fix
            } else {
                // Keyboard CLOSED - Wapas Normal UI
                gfChatWrapper.style.cssText = `
                    position: relative;
                    height: calc(100dvh - 100px);
                    z-index: 1;
                    border-radius: 16px;
                    border: 1px solid #fce4ec;
                    margin-bottom: 15px;
                `;

                // Wapas Menu aur Music le aao
                const footer = document.getElementById('footer-mount');
                if (footer) footer.style.display = '';

                const floatBtns = document.querySelectorAll('.music-float-btn, .floating-btn, [id*="music"]');
                floatBtns.forEach(btn => { if(btn.style) btn.style.display = ''; });
            }
            if(chatArea) chatArea.scrollTop = chatArea.scrollHeight;
        });
    }

    function formatTime(isoString) {
        if(!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function updateGFStatus(statusStr) {
        if (state.mode === 'admin_preview' || !state.memoryId) return;
        fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gf_status: statusStr })
        }).catch(e => {});
    }

    function updateGFReadReceipt() {
        if (state.mode === 'admin_preview' || document.hidden) return; 
        if (typeof firebaseConfig !== 'undefined' && state.memoryId) {
            fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gf_last_read: new Date().toISOString() })
            }).catch(e => {});
        }
    }

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) { updateGFReadReceipt(); updateGFStatus('online'); } 
        else { updateGFStatus(new Date().toISOString()); }
    });
    window.addEventListener('beforeunload', () => updateGFStatus(new Date().toISOString()));

    if(inputEl) inputEl.addEventListener('focus', updateGFReadReceipt);

    function updateHeaderStatus() {
        const statusEl = document.getElementById('live-status');
        if (!statusEl) return;

        const memoryData = state.memoryData || {}; 
        const bfStatus = memoryData.bf_status;

        if (bfStatus === 'typing...') {
            statusEl.innerHTML = '<span style="color:#40c4ff;">typing...</span>';
        } else if (bfStatus === 'online') {
            statusEl.innerHTML = '<span style="color:#40c4ff;">online</span>';
        } else if (bfStatus && bfStatus !== 'offline') {
            let dateObj = new Date(bfStatus);
            if(!isNaN(dateObj)) statusEl.innerHTML = `<span style="color:#fce4ec; opacity:0.9;">last seen at ${formatTime(bfStatus)}</span>`;
            else statusEl.innerHTML = '';
        } else {
            statusEl.innerHTML = '';
        }
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

    function startRealtimeChat() {
        if (window.gfChatStream) window.gfChatStream.close();
        const dbUrl = `${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`;
        window.gfChatStream = new EventSource(dbUrl);

        window.gfChatStream.addEventListener('put', (e) => {
            try {
                const payload = JSON.parse(e.data);
                let needChatRender = true;

                if (payload.path === "/") { if (payload.data) state.memoryData = payload.data; } 
                else if (payload.path === "/chat") { state.memoryData.chat = payload.data; } 
                else if (payload.path.startsWith("/chat/")) {
                    const index = parseInt(payload.path.split('/')[2]);
                    if (!state.memoryData.chat) state.memoryData.chat = [];
                    state.memoryData.chat[index] = payload.data;
                } else if (payload.path === "/message_count") { state.memoryData.message_count = payload.data; }
                else if (payload.path === "/bf_last_read") { state.memoryData.bf_last_read = payload.data; }
                else if (payload.path === "/bf_status") { state.memoryData.bf_status = payload.data; needChatRender = false; } 
                else { needChatRender = false; }

                if(needChatRender) renderChatUI();
                updateHeaderStatus();
            } catch(err) {}
        });

        window.gfChatStream.addEventListener('patch', (e) => {
            try {
                const payload = JSON.parse(e.data);
                if (payload.path === "/") {
                    state.memoryData = { ...state.memoryData, ...payload.data };
                    const keys = Object.keys(payload.data);
                    const onlyStatus = keys.every(k => k === 'gf_status' || k === 'bf_status');
                    if (!onlyStatus) renderChatUI();
                    updateHeaderStatus();
                }
            } catch(err) {}
        });
    }

    function renderChatUI() {
        if(!chatArea) return;
        updateHeaderStatus(); 

        const memoryData = state.memoryData || {};
        const count = memoryData.message_count || 0;

        let rawChat = memoryData.chat || [];
        let firebaseChat = Array.isArray(rawChat) ? rawChat : Object.values(rawChat);
        firebaseChat = firebaseChat.filter(msg => msg !== null && msg.sender);

        const chatList = syncWithLocalStorage(firebaseChat);

        if(countDisplay) countDisplay.innerHTML = `<i class="fa-solid fa-lock" style="font-size:9px;"></i> End-to-End Encrypted SMS: ${firebaseChat.length}/100 (Total: ${count})`;

        const galleryBtn = document.getElementById('gf-gallery-btn');
        if(chatList.length === 0) {
            if(galleryBtn) galleryBtn.disabled = true;
            chatArea.innerHTML = '<p class="chat-empty-text">Send a message to start the conversation...</p>'; 
            lastMsgTime = "";
            return;
        } else {
            if(galleryBtn) galleryBtn.disabled = false;
        }

        const currentLastMsg = chatList[chatList.length - 1];
        const isNewMessage = lastMsgTime !== "" && lastMsgTime !== currentLastMsg.timestamp;

        if(currentLastMsg.sender === 'bf') {
            const gfReadTime = memoryData.gf_last_read ? new Date(memoryData.gf_last_read).getTime() : 0;
            const msgTime = new Date(currentLastMsg.timestamp).getTime();
            if (msgTime > gfReadTime) updateGFReadReceipt();
        }

        if(isNewMessage && currentLastMsg.sender === 'bf') {
            if(soundReceive) { soundReceive.currentTime = 0; soundReceive.play().catch(()=>{}); }
        }

        const bfReadTime = memoryData.bf_last_read ? new Date(memoryData.bf_last_read).getTime() : 0;

        let newHtml = '';
        chatList.forEach((msgObj, index) => {
            let decryptedText = "";
            try {
                const bytes = CryptoJS.AES.decrypt(msgObj.text, state.userPasscode);
                decryptedText = bytes.toString(CryptoJS.enc.Utf8);
                decryptedText = decryptedText.replace(/\n/g, '<br>'); 
            } catch(e) { decryptedText = ""; }

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
            } else if(!decryptedText || state.mode === 'admin_preview') { 
                decryptedText = "<i>🔒 Encrypted Message</i>"; 
            }

            const timeStr = formatTime(msgObj.timestamp);
            const msgTime = new Date(msgObj.timestamp).getTime();
            const isGf = msgObj.sender === 'gf';

            let tickHtml = '';
            if (isGf) {
                const isRead = bfReadTime >= msgTime;
                tickHtml = `<span class="msg-tick ${isRead ? 'tick-blue' : 'tick-grey'}">
                                <i class="fa-solid fa-check-double"></i>
                            </span>`;
            }

            const animStyle = ((index === chatList.length - 1) && isNewMessage) ? '' : 'style="animation: none;"';
            const bubblePadding = imageHtml ? 'padding: 4px 4px 20px 4px;' : '';

            newHtml += `
                <div class="msg-wrapper ${isGf ? 'gf' : 'bf'}" ${animStyle}>
                    <div class="msg-bubble" style="${bubblePadding}">
                        ${imageHtml}
                        ${decryptedText}
                        <div class="msg-meta">
                            <span class="msg-time">${timeStr}</span>
                            ${tickHtml}
                        </div>
                    </div>
                </div>`;
        });

        if (chatArea.innerHTML !== newHtml) {
            chatArea.innerHTML = newHtml;
            if (isNewMessage || lastMsgTime === "") chatArea.scrollTop = chatArea.scrollHeight;
        }

        lastMsgTime = currentLastMsg.timestamp;
    }

    async function sendMessageToFirebase(msgText) {
        if(!msgText) return;
        if(state.mode === 'admin_preview') return alert("Admin cannot send messages.");

        if(soundSend) { soundSend.currentTime = 0; soundSend.play().catch(()=>{}); }
        if(navigator.vibrate) navigator.vibrate(40); 

        const sendBtn = document.getElementById('send-msg-btn');
        if(sendBtn) {
            sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; 
            sendBtn.disabled = true;
        }

        try {
            const res = await fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`);
            const latestData = await res.json();

            let rawChat = latestData.chat || [];
            let chatList = Array.isArray(rawChat) ? rawChat : Object.values(rawChat);
            chatList = chatList.filter(msg => msg !== null && msg.sender);

            let newCount = (latestData.message_count || 0) + 1;

            const encryptedMsg = CryptoJS.AES.encrypt(msgText, state.userPasscode).toString();
            chatList.push({ sender: 'gf', text: encryptedMsg, timestamp: new Date().toISOString() });

            if(chatList.length > 100) chatList = chatList.slice(chatList.length - 100);

            await fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, {
                method: 'PATCH', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat: chatList, message_count: newCount })
            });

            if(inputEl) { inputEl.value = ''; inputEl.style.height = 'auto'; }
            updateGFStatus('online'); 
        } catch(err) { 
            alert("Error sending message."); 
        }

        if(sendBtn) {
            sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; 
            sendBtn.disabled = false;
        }
    }

    const galleryBtn = document.getElementById('gf-gallery-btn');
    const imgPopup = document.getElementById('gf-img-popup');
    const closePopup = document.getElementById('gf-close-popup');
    const imgGrid = document.getElementById('gf-img-grid');

    if(galleryBtn) {
        galleryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            imgGrid.innerHTML = '';
            let found = false;

            const memoryData = state.memoryData || {};
            for(let i=1; i<=5; i++) {
                let imgUrl = memoryData[`image_${i}_url`];
                if(imgUrl) {
                    found = true;
                    let imgEl = document.createElement('img');
                    imgEl.src = imgUrl;
                    imgEl.onclick = () => { imgPopup.classList.add('hidden'); sendMessageToFirebase(`[IMG_${i}]`); };
                    imgGrid.appendChild(imgEl);
                }
            }

            if(!found) {
                imgGrid.innerHTML = '<span style="font-size:12px; color:#888; padding:10px;">No memories found.</span>';
            }
            imgPopup.classList.remove('hidden');
        });
        if(closePopup) closePopup.addEventListener('click', () => imgPopup.classList.add('hidden'));
    }

    let typingTimer;
    if (sendBtn) {
        sendBtn.addEventListener('mousedown', (e) => e.preventDefault());
        sendBtn.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            if(!sendBtn.disabled) sendBtn.click(); 
        });

        sendBtn.addEventListener('click', () => sendMessageToFirebase(inputEl.value.trim()));

        inputEl.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            updateGFStatus('typing...');
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => updateGFStatus('online'), 1500);
        });
    }

    updateGFStatus('online');
    updateGFReadReceipt();
    startRealtimeChat(); 

})();