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

    // 🔴 MAGIC API: Mobile Keyboard Gap Fixer (Full Screen Override)
    if (window.visualViewport && gfChatWrapper) {
        window.visualViewport.addEventListener('resize', () => {
            if (window.visualViewport.height < window.innerHeight - 50) {
                // Keyboard Opened - Go Full Screen Native App Style!
                gfChatWrapper.style.position = 'fixed';
                gfChatWrapper.style.top = '0';
                gfChatWrapper.style.left = '0';
                gfChatWrapper.style.width = '100%';
                gfChatWrapper.style.height = window.visualViewport.height + 'px';
                gfChatWrapper.style.zIndex = '99999'; // Cover everything including bottom menu
                gfChatWrapper.style.borderRadius = '0';
                gfChatWrapper.style.border = 'none';
                gfChatWrapper.style.marginBottom = '0';
            } else {
                // Keyboard Closed - Return to normal card shape
                gfChatWrapper.style.position = 'relative';
                gfChatWrapper.style.height = 'calc(100dvh - 100px)';
                gfChatWrapper.style.zIndex = '1';
                gfChatWrapper.style.borderRadius = '16px';
                gfChatWrapper.style.border = '1px solid #fce4ec';
                gfChatWrapper.style.marginBottom = '15px';
            }
            if(chatArea) chatArea.scrollTop = chatArea.scrollHeight;
        });
    }

    function formatTime(isoString) {
        if(!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function updateGFReadReceipt() {
        if (state.mode === 'admin_preview') return; 
        if (typeof firebaseConfig !== 'undefined' && state.memoryId) {
            fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gf_last_read: new Date().toISOString() })
            }).catch(e => {});
        }
    }

    updateGFReadReceipt();
    if(inputEl) inputEl.addEventListener('focus', updateGFReadReceipt);

    function startRealtimeChat() {
        const dbUrl = `${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`;
        const chatStream = new EventSource(dbUrl);

        chatStream.addEventListener('put', (e) => {
            try {
                const payload = JSON.parse(e.data);
                if (payload.path === "/") {
                    if (payload.data) state.memoryData = payload.data;
                } else if (payload.path === "/chat") {
                    state.memoryData.chat = payload.data;
                } else if (payload.path.startsWith("/chat/")) {
                    const index = parseInt(payload.path.split('/')[2]);
                    if (!state.memoryData.chat) state.memoryData.chat = [];
                    state.memoryData.chat[index] = payload.data;
                } else if (payload.path === "/message_count") {
                    state.memoryData.message_count = payload.data;
                } else if (payload.path === "/bf_last_read") {
                    state.memoryData.bf_last_read = payload.data;
                }
                renderChatUI();
            } catch(err) {}
        });

        chatStream.addEventListener('patch', (e) => {
            try {
                const payload = JSON.parse(e.data);
                if (payload.path === "/") {
                    state.memoryData = { ...state.memoryData, ...payload.data };
                    renderChatUI();
                }
            } catch(err) {}
        });
    }

    function renderChatUI() {
        if(!chatArea) return;
        const memoryData = state.memoryData || {};
        const count = memoryData.message_count || 0;
        const chatList = memoryData.chat || [];

        if(countDisplay) countDisplay.innerText = `Messages: ${chatList.length} / 100 (Total Sent: ${count})`;

        if(chatList.length === 0) {
            chatArea.innerHTML = '<p class="chat-empty-text">Send a message to start the conversation...</p>'; 
            lastMsgTime = "";
            return;
        }

        const currentLastMsg = chatList[chatList.length - 1];
        const isNewMessage = lastMsgTime !== "" && lastMsgTime !== currentLastMsg.timestamp;

        if(isNewMessage && currentLastMsg.sender === 'bf') {
            if(soundReceive) { soundReceive.currentTime = 0; soundReceive.play().catch(()=>{}); }
            updateGFReadReceipt();
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

            if(!decryptedText || state.mode === 'admin_preview') { 
                decryptedText = "<i>🔒 Encrypted Message</i>"; 
            }

            const timeStr = formatTime(msgObj.timestamp);
            const msgTime = new Date(msgObj.timestamp).getTime();
            const isGf = msgObj.sender === 'gf';

            // 🔴 NAYA: Hamesha Double Tick Dikhayega GF ke messages par
            let tickHtml = '';
            if (isGf) {
                const isRead = bfReadTime >= msgTime;
                tickHtml = `<span class="msg-tick ${isRead ? 'tick-blue' : 'tick-grey'}">
                                <i class="fa-solid fa-check-double"></i>
                            </span>`;
            }

            const animStyle = ((index === chatList.length - 1) && isNewMessage) ? '' : 'style="animation: none;"';

            newHtml += `
                <div class="msg-wrapper ${isGf ? 'gf' : 'bf'}" ${animStyle}>
                    <div class="msg-bubble">
                        ${decryptedText}
                        <div class="msg-meta">
                            <span class="msg-time">${timeStr}</span>
                            ${tickHtml}
                        </div>
                    </div>
                </div>`;
        });

        chatArea.innerHTML = newHtml;

        if (isNewMessage || lastMsgTime === "") {
            chatArea.scrollTop = chatArea.scrollHeight;
        }

        lastMsgTime = currentLastMsg.timestamp;
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
            const msgText = inputEl.value.trim();
            if(!msgText) return;
            if(state.mode === 'admin_preview') return alert("Admin cannot send messages.");

            if(soundSend) { soundSend.currentTime = 0; soundSend.play().catch(()=>{}); }

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

                inputEl.value = ''; 
                inputEl.style.height = 'auto'; 
                inputEl.focus(); 
            } catch(err) { 
                alert("Error sending message."); 
            }

            sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; 
            sendBtn.disabled = false;
        });

        inputEl.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    startRealtimeChat(); 
})();