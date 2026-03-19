(function() {
    const state = window.formState;
    if (!state || !state.memoryData) return;

    const dashWrapper = document.getElementById('dash-wrapper');
    const lockScreen = document.getElementById('dash-lock-screen');
    const dashMain = document.getElementById('dash-main-screen');
    const passInput = document.getElementById('check-passcode');
    const unlockBtn = document.getElementById('verify-passcode-btn');
    const errorMsg = document.getElementById('passcode-error');

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            dashWrapper.style.height = window.visualViewport.height + 'px';
            const chatArea = document.getElementById('bf-chat-area');
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
        else { updateBFStatus('offline'); }
    });
    window.addEventListener('beforeunload', () => updateBFStatus('offline'));

    unlockBtn.addEventListener('click', () => {
        if (passInput.value === state.memoryData.passcode) {
            state.userPasscode = passInput.value;
            lockScreen.classList.add('hidden');
            dashMain.classList.remove('hidden');
            updateBFStatus('online'); updateBFReadReceipt(); 
            renderDashboardUI(); startRealtimeDashboard(); 
        } else {
            errorMsg.classList.remove('hidden');
        }
    });

    function startRealtimeDashboard() {
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
                else if (payload.path === "/gf_last_read") state.memoryData.gf_last_read = payload.data;
                else if (payload.path === "/gf_status") state.memoryData.gf_status = payload.data; 
                renderDashboardUI();
            } catch(err) {}
        });
        chatStream.addEventListener('patch', (e) => {
            try {
                const payload = JSON.parse(e.data);
                if (payload.path === "/") { state.memoryData = { ...state.memoryData, ...payload.data }; renderDashboardUI(); }
            } catch(err) {}
        });
    }

    let dashLastMsgTime = "";

    function renderDashboardUI() {
        document.getElementById('track-scanned').innerText = state.memoryData.scanned_at ? formatTime(state.memoryData.scanned_at) : "Waiting...";
        document.getElementById('track-proposal').innerText = state.memoryData.proposal_accepted_at ? formatTime(state.memoryData.proposal_accepted_at) : "Waiting...";

        const titleEl = document.querySelector('.header-info h2');
        let statusHtml = "";
        if (state.memoryData.gf_status === 'typing...') statusHtml = ' <span style="color:#a7f3d0; font-size:13px; font-weight:normal; text-transform:lowercase; margin-left:5px;">typing...</span>';
        else if (state.memoryData.gf_status === 'online') statusHtml = ' <span style="color:#a7f3d0; font-size:13px; font-weight:normal; margin-left:5px;">online</span>';
        if(titleEl) titleEl.innerHTML = 'Secret Chat Room' + statusHtml;

        const chatArea = document.getElementById('bf-chat-area');
        const chatList = state.memoryData.chat || [];
        const count = state.memoryData.message_count || 0;

        document.getElementById('bf-msg-count').innerText = `Messages: ${chatList.length} / 100 (Total Sent: ${count})`;

        const inputEl = document.getElementById('bf-chat-input');
        const sendBtn = document.getElementById('bf-send-btn');
        const galleryBtn = document.getElementById('bf-gallery-btn');

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

        const gfReadTime = state.memoryData.gf_last_read ? new Date(state.memoryData.gf_last_read).getTime() : 0;

        let newHtml = '';
        chatList.forEach(msgObj => {
            let decryptedText = "";
            try {
                const bytes = CryptoJS.AES.decrypt(msgObj.text, state.userPasscode);
                decryptedText = bytes.toString(CryptoJS.enc.Utf8);
                decryptedText = decryptedText.replace(/\n/g, '<br>');
            } catch(e) { decryptedText = "<i>🔒 Encrypted Error</i>"; }

            // 🔴 NAYA: IMAGE DECRYPTION LOGIC
            let imageHtml = "";
            if (decryptedText.startsWith("[IMG_") && decryptedText.endsWith("]")) {
                let idx = parseInt(decryptedText.substring(5, decryptedText.length - 1));
                let mems = state.memoryData.memories || [];
                let imgUrl = mems[idx] ? (typeof mems[idx] === 'string' ? mems[idx] : (mems[idx].image || mems[idx].url)) : '';
                if(imgUrl) {
                    imageHtml = `<img src="${imgUrl}" class="chat-img-msg">`;
                    decryptedText = ""; // Hide the code text
                } else {
                    decryptedText = "<i>📷 Image Missing</i>";
                }
            }

            const isBf = msgObj.sender === 'bf';
            const timeStr = formatTime(msgObj.timestamp);
            const msgTime = new Date(msgObj.timestamp).getTime();

            let tickHtml = '';
            if (isBf) {
                const isRead = gfReadTime >= msgTime;
                tickHtml = `<span class="msg-tick ${isRead ? 'tick-blue' : 'tick-grey'}">
                                ${isRead ? '<i class="fa-solid fa-check-double"></i>' : '<i class="fa-solid fa-check"></i>'}
                            </span>`;
            }

            // Adjust padding if it's an image
            const bubblePadding = imageHtml ? 'padding: 4px 4px 20px 4px;' : '';

            newHtml += `
                <div class="msg-wrapper ${isBf ? 'bf' : 'gf'}">
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
        if (isNewMessage || dashLastMsgTime === "") chatArea.scrollTop = chatArea.scrollHeight; 
        dashLastMsgTime = currentLastMsg.timestamp;
    }

    // 🔴 NAYA: Shared Function to Send Messages (Text or Image Code)
    async function sendMessageToFirebase(msgText) {
        if(!msgText) return;
        const sendBtn = document.getElementById('bf-send-btn');
        sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; 
        sendBtn.disabled = true;

        try {
            const res = await fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`);
            const latestData = await res.json();

            let chatList = latestData.chat || [];
            let newCount = (latestData.message_count || 0) + 1;

            const encryptedMsg = CryptoJS.AES.encrypt(msgText, state.userPasscode).toString();
            chatList.push({ sender: 'bf', text: encryptedMsg, timestamp: new Date().toISOString() });
            if(chatList.length > 100) chatList = chatList.slice(chatList.length - 100);

            await fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat: chatList, message_count: newCount })
            });

            const inputEl = document.getElementById('bf-chat-input');
            inputEl.value = ''; inputEl.style.height = 'auto'; 
            updateBFStatus('online'); // Reset typing status
        } catch(err) { alert("Error sending message."); }

        sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; 
        sendBtn.disabled = false;
    }

    // 🔴 NAYA: Image Popup Logic
    const galleryBtn = document.getElementById('bf-gallery-btn');
    const imgPopup = document.getElementById('bf-img-popup');
    const closePopup = document.getElementById('bf-close-popup');
    const imgGrid = document.getElementById('bf-img-grid');

    if(galleryBtn) {
        galleryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            imgGrid.innerHTML = '';
            const memories = state.memoryData.memories || [];
            if(memories.length === 0) {
                imgGrid.innerHTML = '<span style="font-size:12px; color:#888; padding: 10px;">No memories uploaded.</span>';
            } else {
                memories.forEach((mem, index) => {
                    let imgUrl = mem ? (typeof mem === 'string' ? mem : (mem.image || mem.url)) : '';
                    if(imgUrl) {
                        let imgEl = document.createElement('img');
                        imgEl.src = imgUrl;
                        imgEl.onclick = () => { imgPopup.classList.add('hidden'); sendMessageToFirebase(`[IMG_${index}]`); };
                        imgGrid.appendChild(imgEl);
                    }
                });
            }
            imgPopup.classList.remove('hidden');
        });
        closePopup.addEventListener('click', () => imgPopup.classList.add('hidden'));
    }

    const sendBtn = document.getElementById('bf-send-btn');
    const inputEl = document.getElementById('bf-chat-input');
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
})();