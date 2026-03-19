(function() {
    const state = window.formState;
    if (!state || !state.memoryData) return;

    const lockScreen = document.getElementById('dash-lock-screen');
    const dashMain = document.getElementById('dash-main-screen');
    const passInput = document.getElementById('check-passcode');
    const unlockBtn = document.getElementById('verify-passcode-btn');
    const errorMsg = document.getElementById('passcode-error');

    function formatTime(isoString) {
        if(!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    unlockBtn.addEventListener('click', () => {
        if (passInput.value === state.memoryData.passcode) {
            state.userPasscode = passInput.value;
            lockScreen.classList.add('hidden');
            dashMain.classList.remove('hidden');

            renderDashboardUI();
            startRealtimeDashboard(); 
        } else {
            errorMsg.classList.remove('hidden');
        }
    });

    function startRealtimeDashboard() {
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
                } else if (payload.path === "/scanned_at") {
                    state.memoryData.scanned_at = payload.data;
                } else if (payload.path === "/proposal_accepted_at") {
                    state.memoryData.proposal_accepted_at = payload.data;
                } else if (payload.path === "/gf_last_read") {
                    state.memoryData.gf_last_read = payload.data;
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

    function renderDashboardUI() {
        document.getElementById('track-scanned').innerText = state.memoryData.scanned_at ? formatTime(state.memoryData.scanned_at) : "Waiting...";
        document.getElementById('track-proposal').innerText = state.memoryData.proposal_accepted_at ? formatTime(state.memoryData.proposal_accepted_at) : "Waiting...";

        const chatArea = document.getElementById('bf-chat-area');
        const chatList = state.memoryData.chat || [];
        const count = state.memoryData.message_count || 0;

        document.getElementById('bf-msg-count').innerText = `Messages: ${chatList.length} / 100 (Total Sent: ${count})`;

        const inputEl = document.getElementById('bf-chat-input');
        const sendBtn = document.getElementById('bf-send-btn');

        if(chatList.length > 0) {
            inputEl.disabled = false; 
            sendBtn.disabled = false;
            if(inputEl.placeholder === "Waiting for her reply...") inputEl.placeholder = "Type your reply...";
        } else {
            inputEl.disabled = true; 
            sendBtn.disabled = true;
            inputEl.placeholder = "Waiting for her reply...";
            chatArea.innerHTML = '<div class="waiting-msg">Waiting for her to start the conversation...</div>';
            return;
        }

        const gfReadTime = state.memoryData.gf_last_read ? new Date(state.memoryData.gf_last_read).getTime() : 0;

        let newHtml = '';
        chatList.forEach(msgObj => {
            let decryptedText = "";
            try {
                const bytes = CryptoJS.AES.decrypt(msgObj.text, state.userPasscode);
                decryptedText = bytes.toString(CryptoJS.enc.Utf8);

                // 🔴 NAYA FIX: Line Breaks ko <br> me convert karna taki paragraph sahi dikhe
                decryptedText = decryptedText.replace(/\n/g, '<br>');
            } catch(e) { decryptedText = "<i>🔒 Encrypted Error</i>"; }

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

            newHtml += `
                <div class="msg-wrapper ${isBf ? 'bf' : 'gf'}">
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
        chatArea.scrollTop = chatArea.scrollHeight; 
    }

    const sendBtn = document.getElementById('bf-send-btn');
    const inputEl = document.getElementById('bf-chat-input');

    if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
            const msgText = inputEl.value.trim();
            if(!msgText) return;

            sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; 
            sendBtn.disabled = true;

            try {
                const res = await fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`);
                const latestData = await res.json();

                let chatList = latestData.chat || [];
                let newCount = (latestData.message_count || 0) + 1;

                const encryptedMsg = CryptoJS.AES.encrypt(msgText, state.userPasscode).toString();
                chatList.push({ sender: 'bf', text: encryptedMsg, timestamp: new Date().toISOString() });

                if(chatList.length > 100) {
                    chatList = chatList.slice(chatList.length - 100);
                }

                await fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, {
                    method: 'PATCH', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat: chatList, message_count: newCount })
                });

                inputEl.value = ''; 
                inputEl.style.height = 'auto'; // Reset box size after send
                inputEl.focus(); // Keep keyboard open
            } catch(err) { 
                alert("Error sending message."); 
            }

            sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; 
            sendBtn.disabled = false;
        });

        // 🔴 NAYA FIX: Keyboard "Enter" Auto-send hata diya gaya hai
        // Aur input box type karte waqt apne aap lamba ho jayega (Max 100px tak)
        inputEl.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });

        // Mobile keyboard open hone par chat auto-scroll hogi
        inputEl.addEventListener('focus', () => {
            setTimeout(() => {
                const chatArea = document.getElementById('bf-chat-area');
                if(chatArea) chatArea.scrollTop = chatArea.scrollHeight;
            }, 300);
        });
    }
})();