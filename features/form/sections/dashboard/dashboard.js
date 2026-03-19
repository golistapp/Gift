(function() {
    const state = window.formState;
    if (!state || !state.memoryData) return;

    const lockScreen = document.getElementById('dash-lock-screen');
    const dashMain = document.getElementById('dash-main-screen');
    const passInput = document.getElementById('check-passcode');
    const unlockBtn = document.getElementById('verify-passcode-btn');
    const errorMsg = document.getElementById('passcode-error');

    // Helper: Time Formatting
    function formatTime(isoString) {
        if(!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // 1. Passcode Unlock Logic
    unlockBtn.addEventListener('click', () => {
        if (passInput.value === state.memoryData.passcode) {
            state.userPasscode = passInput.value;
            lockScreen.classList.add('hidden');
            dashMain.classList.remove('hidden');

            renderDashboardUI();
            startRealtimeDashboard(); // 🚀 Start WebSockets Connection
        } else {
            errorMsg.classList.remove('hidden');
        }
    });

    // 2. 🚀 NEW: WhatsApp Style Real-Time WebSockets (SSE)
    function startRealtimeDashboard() {
        const dbUrl = `${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`;
        const chatStream = new EventSource(dbUrl); // 24/7 Zero-delay listener

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
                } else if (payload.path === "/scanned_at") {
                    state.memoryData.scanned_at = payload.data;
                } else if (payload.path === "/proposal_accepted_at") {
                    state.memoryData.proposal_accepted_at = payload.data;
                }
                renderDashboardUI();
            } catch(err) {}
        });

        chatStream.addEventListener('patch', (e) => {
            try {
                const payload = JSON.parse(e.data);
                if (payload.path === "/") {
                    state.memoryData = { ...state.memoryData, ...payload.data };
                    renderDashboardUI();
                }
            } catch(err) {}
        });
    }

    // 3. Render Dashboard UI
    function renderDashboardUI() {
        // Update Stats
        document.getElementById('track-scanned').innerText = state.memoryData.scanned_at ? formatTime(state.memoryData.scanned_at) : "Waiting...";
        document.getElementById('track-proposal').innerText = state.memoryData.proposal_accepted_at ? formatTime(state.memoryData.proposal_accepted_at) : "Waiting...";

        const chatArea = document.getElementById('bf-chat-area');
        const chatList = state.memoryData.chat || [];
        const count = state.memoryData.message_count || 0;

        document.getElementById('bf-msg-count').innerText = `Messages: ${count} / 300`;

        const inputEl = document.getElementById('bf-chat-input');
        const sendBtn = document.getElementById('bf-send-btn');

        // Check limits & active status
        if(chatList.length > 0 && count < 300) {
            inputEl.disabled = false; sendBtn.disabled = false;
            inputEl.placeholder = "Type your reply...";
        } else if (count >= 300) {
            inputEl.disabled = true; sendBtn.disabled = true;
            inputEl.placeholder = "300 message limit reached!";
        }

        if(chatList.length === 0) {
            chatArea.innerHTML = '<div class="waiting-msg">Waiting for her to start the conversation...</div>';
            return;
        }

        // Render Chat Bubbles
        let newHtml = '';
        chatList.forEach(msgObj => {
            let decryptedText = "";
            try {
                const bytes = CryptoJS.AES.decrypt(msgObj.text, state.userPasscode);
                decryptedText = bytes.toString(CryptoJS.enc.Utf8);
            } catch(e) { decryptedText = "<i>🔒 Encrypted Error</i>"; }

            const isBf = msgObj.sender === 'bf';
            const timeStr = formatTime(msgObj.timestamp);

            newHtml += `
                <div class="msg-wrapper ${isBf ? 'bf' : 'gf'}">
                    <div class="msg-bubble">
                        ${decryptedText}
                        <span class="msg-time">${timeStr}</span>
                    </div>
                </div>`;
        });

        chatArea.innerHTML = newHtml;
        chatArea.scrollTop = chatArea.scrollHeight; // Auto-scroll to bottom
    }

    // 4. Send Message Logic
    const sendBtn = document.getElementById('bf-send-btn');
    const inputEl = document.getElementById('bf-chat-input');

    if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
            const msgText = inputEl.value.trim();
            if(!msgText) return;

            let currentCount = state.memoryData.message_count || 0;
            if(currentCount >= 300) return alert("Message limit reached (300/300)."); 

            sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; 
            sendBtn.disabled = true;

            try {
                const res = await fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`);
                const latestData = await res.json();

                let chatList = latestData.chat || [];
                let newCount = (latestData.message_count || 0) + 1;
                if(newCount > 300) throw new Error("Limit");

                const encryptedMsg = CryptoJS.AES.encrypt(msgText, state.userPasscode).toString();
                chatList.push({ sender: 'bf', text: encryptedMsg, timestamp: new Date().toISOString() });

                if(chatList.length > 100) chatList = chatList.slice(chatList.length - 100);

                await fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, {
                    method: 'PATCH', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat: chatList, message_count: newCount })
                });

                inputEl.value = ''; 
                // SSE will automatically fetch and render the new message!
            } catch(err) { 
                alert(err.message === "Limit" ? "300 Messages Limit Reached!" : "Error sending message."); 
            }

            sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; 
            sendBtn.disabled = false;
        });

        inputEl.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') sendBtn.click();
        });
    }

})();