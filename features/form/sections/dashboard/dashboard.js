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
        if (window.bfChatStream) window.bfChatStream.close();
        if (window.gfStatusStream) window.gfStatusStream.close();
        if (window.gfReadStream) window.gfReadStream.close();

        window.bfChatStream = new EventSource(`${firebaseConfig.databaseURL}/memories/${state.memoryId}/chat.json`);
        const handleChatData = (e) => {
            try {
                const payload = JSON.parse(e.data);
                if (payload && payload.data !== null) {
                    if (payload.path === "/") { 
                        state.memoryData.chat = payload.data; 
                    } else {
                        const idx = parseInt(payload.path.replace(/[^0-9]/g, ''));
                        if (!state.memoryData.chat) state.memoryData.chat = [];
                        if (!isNaN(idx)) state.memoryData.chat[idx] = payload.data;
                    }
                    renderDashboardUI();
                }
            } catch(err) {}
        };
        // NAYA: Ab put aur patch dono event sunega
        window.bfChatStream.addEventListener('put', handleChatData);
        window.bfChatStream.addEventListener('patch', handleChatData);

        window.gfStatusStream = new EventSource(`${firebaseConfig.databaseURL}/memories/${state.memoryId}/gf_status.json`);
        window.gfStatusStream.addEventListener('put', (e) => {
            try { const p = JSON.parse(e.data); if (p.data !== null) { state.memoryData.gf_status = p.data; updateHeaderStatus(); } } catch(err) {}
        });

        window.gfReadStream = new EventSource(`${firebaseConfig.databaseURL}/memories/${state.memoryId}/gf_last_read.json`);
        window.gfReadStream.addEventListener('put', (e) => {
            try { const p = JSON.parse(e.data); if (p.data !== null) { state.memoryData.gf_last_read = p.data; renderDashboardUI(); } } catch(err) {}
        });
    }

    async function sendMessageToFirebase(rawText) {
        if(!rawText && !currentReplyQuote) return;

        let finalMsgText = rawText;
        if(currentReplyQuote) { finalMsgText = `[QUOTE]${currentReplyQuote}[/QUOTE] ${rawText}`; }

        playDashSound('send');
        if(navigator.vibrate) navigator.vibrate(40);

        try {
            const encryptedMsg = CryptoJS.AES.encrypt(finalMsgText, state.userPasscode).toString();
            const newMsgObj = { sender: 'bf', text: encryptedMsg, timestamp: new Date().toISOString() };

            // 🚀 1. INSTANT UI UPDATE (0 seconds delay)
            if (!state.memoryData.chat) state.memoryData.chat = [];
            const newIndex = state.memoryData.chat.length; 
            state.memoryData.chat.push(newMsgObj); // Local array me joda
            renderDashboardUI(); // Turant screen par dikha diya!

            // 🚀 2. UI CLEAR 
            inputEl.value = ''; inputEl.style.height = 'auto'; 
            currentReplyQuote = "";
            if(replyPreviewBox) replyPreviewBox.classList.add('hidden');
            updateBFStatus('online');

            // 🚀 3. BACKGROUND UPLOAD (Sirf ek akela naya message bheja)
            fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}/chat/${newIndex}.json`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMsgObj)
            });
            fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}/message_count.json`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newIndex + 1)
            });

        } catch(err) { console.error("Error sending", err); }
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