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

    // 🔴 MAGIC API: Mobile Keyboard Gap Fixer for GF
    if (window.visualViewport && gfChatWrapper) {
        window.visualViewport.addEventListener('resize', () => {
            // Shrink chat window dynamically avoiding bottom nav
            gfChatWrapper.style.height = (window.visualViewport.height - 75) + 'px'; 
            if(chatArea) chatArea.scrollTop = chatArea.scrollHeight;
        });
    }

    function formatTime(isoString) {
        if(!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // GF Read Receipt Update
    function updateGFReadReceipt() {
        if (state.mode === 'admin_preview') return; 
        if (typeof firebaseConfig !== 'undefined' && state.memoryId) {
            fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gf_last_read: new Date().toISOString() })
            }).catch(e => console.log("Read receipt silently failed."));
        }
    }

    updateGFReadReceipt();
    if(inputEl) inputEl.addEventListener('focus', updateGFReadReceipt);

    // Real-Time WebSockets
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
                    // 🔴 Get BF's last read time!
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

        // BF ka read time fetch karo (Ticks logic)
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

            let tickHtml = '';
            if (isGf) {
                const isRead = bfReadTime >= msgTime;
                tickHtml = `<span class="msg-tick ${isRead ? 'tick-blue' : 'tick-grey'}">
                                ${isRead ? '<i class="fa-solid fa-check-double"></i>' : '<i class="fa-solid fa-check"></i>'}
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

    // Send Message Logic
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

        // Auto-resize textarea
        inputEl.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    startRealtimeChat(); 
})();