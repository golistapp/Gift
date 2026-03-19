(function() {
    const state = window.viewerState;
    if (!state) return;

    let lastMsgTime = ""; // Naye messages track karne ke liye
    const chatArea = document.getElementById('chat-messages-area');
    const inputEl = document.getElementById('live-msg-input');
    const sendBtn = document.getElementById('send-msg-btn');
    const countDisplay = document.getElementById('msg-count-display');
    const soundSend = document.getElementById('sound-send');
    const soundReceive = document.getElementById('sound-receive');

    // Helper: Time format
    function formatTime(isoString) {
        if(!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // --- 🚀 NEW: WhatsApp Style Real-Time WebSockets (SSE) ---
    function startRealtimeChat() {
        const dbUrl = `${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`;

        // EventSource server ke sath 24/7 free connection open rakhta hai
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

        chatStream.onerror = () => {
            console.log("Reconnecting to chat server smoothly...");
        };
    }

    function renderChatUI() {
        if(!chatArea) return;
        const memoryData = state.memoryData || {};
        const count = memoryData.message_count || 0;

        if(countDisplay) countDisplay.innerText = `Messages: ${count} / 300`;

        const chatList = memoryData.chat || [];

        if(chatList.length === 0) {
            chatArea.innerHTML = '<p class="chat-empty-text">Send a message to start the conversation...</p>'; 
            lastMsgTime = "";
            return;
        }

        const currentLastMsg = chatList[chatList.length - 1];
        const isNewMessage = lastMsgTime !== "" && lastMsgTime !== currentLastMsg.timestamp;

        // 🎵 Play Receive Sound ONLY agar naya message aaya ho (aur samne wale ne bheja ho)
        if(isNewMessage && currentLastMsg.sender !== 'gf') {
            if(soundReceive) { soundReceive.currentTime = 0; soundReceive.play().catch(()=>{}); }
        }

        let newHtml = '';
        chatList.forEach((msgObj, index) => {
            let decryptedText = "";
            try {
                const bytes = CryptoJS.AES.decrypt(msgObj.text, state.userPasscode);
                decryptedText = bytes.toString(CryptoJS.enc.Utf8);
            } catch(e) { decryptedText = ""; }

            if(!decryptedText || state.mode === 'admin_preview') { 
                decryptedText = "<i>🔒 Encrypted Message</i>"; 
            }

            const timeStr = formatTime(msgObj.timestamp);
            const senderClass = msgObj.sender === 'gf' ? 'gf' : 'bf';

            // 🔴 FIX: Sirf naye message par animation lagayenge, purane walon ko static rakhenge
            const isLatest = (index === chatList.length - 1) && isNewMessage;
            const animStyle = isLatest ? '' : 'style="animation: none;"';

            newHtml += `
                <div class="msg-wrapper ${senderClass}" ${animStyle}>
                    <div class="msg-bubble">
                        ${decryptedText}
                        <span class="msg-time">${timeStr}</span>
                    </div>
                </div>`;
        });

        chatArea.innerHTML = newHtml;

        // Naya message aane par automatically niche scroll karo
        if (isNewMessage || lastMsgTime === "") {
            chatArea.scrollTop = chatArea.scrollHeight;
        }

        lastMsgTime = currentLastMsg.timestamp;
    }

    // 2. Send Message Logic
    if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
            const msgText = inputEl.value.trim();
            if(!msgText) return;
            if(state.mode === 'admin_preview') return alert("Admin cannot send messages.");

            let currentCount = state.memoryData.message_count || 0;
            if(currentCount >= 300) return alert("Message limit reached (300/300)."); 

            // 🎵 Play Send Sound instantly
            if(soundSend) { soundSend.currentTime = 0; soundSend.play().catch(()=>{}); }

            sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; 
            sendBtn.disabled = true;

            try {
                const res = await fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`);
                const latestData = await res.json();

                let chatList = latestData.chat || [];
                let newCount = (latestData.message_count || 0) + 1;

                if(newCount > 300) throw new Error("Limit");

                const encryptedMsg = CryptoJS.AES.encrypt(msgText, state.userPasscode).toString();
                chatList.push({ sender: 'gf', text: encryptedMsg, timestamp: new Date().toISOString() });

                // 100 messages hi database mein store honge taaki speed fast rahe
                if(chatList.length > 100) chatList = chatList.slice(chatList.length - 100);

                await fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, {
                    method: 'PATCH', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat: chatList, message_count: newCount })
                });

                inputEl.value = ''; 
                // 🔴 Note: Ab yahan fetchChatData() call karne ki zarurat nahi hai, EventSource khud handle kar lega!
            } catch(err) { 
                alert(err.message === "Limit" ? "300 Messages Limit Reached!" : "Error sending message."); 
            }

            sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; 
            sendBtn.disabled = false;
        });

        if (inputEl) {
            inputEl.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') sendBtn.click();
            });
        }
    }

    // 🚀 Start the highly efficient WebSockets Listener
    startRealtimeChat(); 
})();