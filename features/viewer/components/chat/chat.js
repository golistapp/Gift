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

    if (window.visualViewport && gfChatWrapper) {
        window.visualViewport.addEventListener('resize', () => {
            if (window.visualViewport.height < window.innerHeight - 50) {
                gfChatWrapper.style.position = 'fixed'; gfChatWrapper.style.top = '0'; gfChatWrapper.style.left = '0';
                gfChatWrapper.style.width = '100%'; gfChatWrapper.style.height = window.visualViewport.height + 'px';
                gfChatWrapper.style.zIndex = '99999'; gfChatWrapper.style.borderRadius = '0';
                gfChatWrapper.style.border = 'none'; gfChatWrapper.style.marginBottom = '0';
            } else {
                gfChatWrapper.style.position = 'relative'; gfChatWrapper.style.height = 'calc(100dvh - 100px)';
                gfChatWrapper.style.zIndex = '1'; gfChatWrapper.style.borderRadius = '16px';
                gfChatWrapper.style.border = '1px solid #fce4ec'; gfChatWrapper.style.marginBottom = '15px';
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
    updateGFStatus('online'); updateGFReadReceipt();
    if(inputEl) inputEl.addEventListener('focus', updateGFReadReceipt);

    function startRealtimeChat() {
        const chatStream = new EventSource(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`);
        chatStream.addEventListener('put', (e) => {
            try {
                const payload = JSON.parse(e.data);
                if (payload.path === "/") { if (payload.data) state.memoryData = payload.data; } 
                else if (payload.path === "/chat") { state.memoryData.chat = payload.data; } 
                else if (payload.path.startsWith("/chat/")) {
                    const index = parseInt(payload.path.split('/')[2]);
                    if (!state.memoryData.chat) state.memoryData.chat = [];
                    state.memoryData.chat[index] = payload.data;
                } 
                else if (payload.path === "/message_count") state.memoryData.message_count = payload.data;
                else if (payload.path === "/bf_last_read") state.memoryData.bf_last_read = payload.data;
                else if (payload.path === "/bf_status") state.memoryData.bf_status = payload.data; 
                renderChatUI();
            } catch(err) {}
        });
        chatStream.addEventListener('patch', (e) => {
            try {
                const payload = JSON.parse(e.data);
                if (payload.path === "/") { state.memoryData = { ...state.memoryData, ...payload.data }; renderChatUI(); }
            } catch(err) {}
        });
    }

    function renderChatUI() {
        if(!chatArea) return;
        const memoryData = state.memoryData || {};
        const count = memoryData.message_count || 0;
        const chatList = memoryData.chat || [];

        if(countDisplay) countDisplay.innerText = `Messages: ${chatList.length} / 100 (Total Sent: ${count})`;

        const statusEl = document.querySelector('.header-status');
        if (statusEl) {
            const bfStatus = memoryData.bf_status;
            if (bfStatus === 'typing...') {
                statusEl.innerHTML = '<span style="color:#40c4ff; font-size:12px; text-transform:lowercase; font-weight:normal;">typing...</span>';
            } else if (bfStatus === 'online') {
                statusEl.innerHTML = '<span style="color:#40c4ff; font-size:12px; font-weight:normal;">online</span>';
            } else if (bfStatus && bfStatus !== 'offline') {
                let dateObj = new Date(bfStatus);
                if(!isNaN(dateObj)) {
                    statusEl.innerHTML = `<span style="color:#fce4ec; font-size:10px; font-weight:normal; opacity:0.9;">last seen at ${formatTime(bfStatus)}</span>`;
                } else {
                    statusEl.innerHTML = '<i class="fa-solid fa-lock" style="font-size:10px;"></i> End-to-End Encrypted';
                }
            } else {
                statusEl.innerHTML = '<i class="fa-solid fa-lock" style="font-size:10px;"></i> End-to-End Encrypted';
            }
        }

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
                tickHtml = `<span class="msg-tick ${isRead ? 'tick-blue' : 'tick-grey'}"><i class="fa-solid fa-check-double"></i></span>`;
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

        chatArea.innerHTML = newHtml;
        if (isNewMessage || lastMsgTime === "") chatArea.scrollTop = chatArea.scrollHeight;
        lastMsgTime = currentLastMsg.timestamp;
    }

    async function sendMessageToFirebase(msgText) {
        if(!msgText) return;
        if(state.mode === 'admin_preview') return alert("Admin cannot send messages.");

        if(soundSend) { soundSend.currentTime = 0; soundSend.play().catch(()=>{}); }
        if(navigator.vibrate) navigator.vibrate(40); 

        const sendBtn = document.getElementById('send-msg-btn');
        sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; 
        sendBtn.disabled = true;

        try {
            const res = await fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`);
            const latestData = await res.json();

            let chatList = latestData.chat || [];
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
        } catch(err) { alert("Error sending message."); }

        sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; 
        sendBtn.disabled = false;
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
            if(!found) imgGrid.innerHTML = '<span style="font-size:12px; color:#888; padding:10px;">No memories found.</span>';
            imgPopup.classList.remove('hidden');
        });
        closePopup.addEventListener('click', () => imgPopup.classList.add('hidden'));
    }

    const sendBtn = document.getElementById('send-msg-btn');
    let typingTimer;

    if (sendBtn) {
        sendBtn.addEventListener('mousedown', (e) => e.preventDefault());
        sendBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if(!sendBtn.disabled) sendBtn.click(); });
        sendBtn.addEventListener('click', () => sendMessageToFirebase(inputEl.value.trim()));

        inputEl.addEventListener('input', function() {
            this.style.height = 'auto'; this.style.height = (this.scrollHeight) + 'px';
            updateGFStatus('typing...');
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => updateGFStatus('online'), 1500);
        });
    }

    // 🔴 MAGIC FIX: Server connection se pehle instantly existing data render karega
    renderChatUI(); 
    startRealtimeChat(); 
})();
