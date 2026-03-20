(function() {
    const state = window.viewerState;
    if (!state) return;

     // --- 1. DOM Elements ---
    const DOM = {
        wrapper: document.getElementById('gf-chat-wrapper'),
        chatArea: document.getElementById('chat-messages-area'),
        inputEl: document.getElementById('live-msg-input'),
        sendBtn: document.getElementById('send-msg-btn'),
        countDisplay: document.getElementById('msg-count-display'),
        soundSend: document.getElementById('sound-send'),
        soundReceive: document.getElementById('sound-receive'),
        statusEl: document.getElementById('live-status'),
        galleryBtn: document.getElementById('gf-gallery-btn'),
        imgPopup: document.getElementById('gf-img-popup'),
        imgGrid: document.getElementById('gf-img-grid'),
        closePopup: document.getElementById('gf-close-popup'),
        replyPreviewBox: document.getElementById('reply-preview-box'),
        replyTextPreview: document.getElementById('reply-text-preview'),
        cancelReplyBtn: document.getElementById('cancel-reply-btn'),
        scrollArrows: document.getElementById('scroll-arrows'),
        scrollTopBtn: document.getElementById('scroll-top-btn'),
        scrollBottomBtn: document.getElementById('scroll-bottom-btn')
    };


    // --- 2. Global Variables ---
    let currentReplyQuote = ""; // Store active reply
    let lastMsgTime = "";

    // --- 3. Storage Manager (Infinite Chat) ---
    const ChatStorage = {
        sync: function(firebaseChat) {
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
    };

    // --- 4. UI Renderer & Formatters ---
    const ChatUI = {
        formatTime: function(isoString) {
            if(!isoString) return '';
            return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        },

        initViewportFix: function() {
            if (window.visualViewport && DOM.wrapper) {
                window.visualViewport.addEventListener('resize', () => {
                    if (window.visualViewport.height < window.innerHeight - 50) {
                        DOM.wrapper.style.cssText = `position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: ${window.visualViewport.height}px !important; z-index: 999999 !important; border-radius: 0 !important; border: none !important; margin: 0 !important; background: #fdf2f5 !important;`;
                        const footer = document.getElementById('footer-mount');
                        if (footer) footer.style.display = 'none';
                        const floatBtns = document.querySelectorAll('.music-float-btn, .floating-btn, [id*="music"]');
                        floatBtns.forEach(btn => { if(btn.style) btn.style.display = 'none'; });
                        window.scrollTo(0, 0); 
                    } else {
                        DOM.wrapper.style.cssText = `position: relative; height: calc(100dvh - 100px); z-index: 1; border-radius: 16px; border: 1px solid #fce4ec; margin-bottom: 15px;`;
                        const footer = document.getElementById('footer-mount');
                        if (footer) footer.style.display = '';
                        const floatBtns = document.querySelectorAll('.music-float-btn, .floating-btn, [id*="music"]');
                        floatBtns.forEach(btn => { if(btn.style) btn.style.display = ''; });
                    }
                    if(DOM.chatArea) DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;
                });
            }
        },

        updateHeader: function() {
            if (!DOM.statusEl) return;
            const bfStatus = (state.memoryData || {}).bf_status;
            if (bfStatus === 'typing...') DOM.statusEl.innerHTML = '<span style="color:#40c4ff;">typing...</span>';
            else if (bfStatus === 'online') DOM.statusEl.innerHTML = '<span style="color:#40c4ff;">online</span>';
            else if (bfStatus && bfStatus !== 'offline') {
                let dateObj = new Date(bfStatus);
                if(!isNaN(dateObj)) DOM.statusEl.innerHTML = `<span style="color:#fce4ec; opacity:0.9;">last seen at ${this.formatTime(bfStatus)}</span>`;
                else DOM.statusEl.innerHTML = '';
            } else DOM.statusEl.innerHTML = '';
        },

        renderMessages: function() {
            if(!DOM.chatArea) return;
            this.updateHeader(); 

            const memoryData = state.memoryData || {};
            const count = memoryData.message_count || 0;

            let firebaseChat = Array.isArray(memoryData.chat) ? memoryData.chat : Object.values(memoryData.chat || []);
            firebaseChat = firebaseChat.filter(msg => msg !== null && msg.sender);

            const chatList = ChatStorage.sync(firebaseChat);

            if(DOM.countDisplay) DOM.countDisplay.innerHTML = `<i class="fa-solid fa-lock" style="font-size:9px;"></i> End-to-End Encrypted SMS: ${firebaseChat.length}/100 (Total: ${count})`;

            if(chatList.length === 0) {
                if(DOM.galleryBtn) DOM.galleryBtn.disabled = true;
                DOM.chatArea.innerHTML = '<p class="chat-empty-text">Send a message to start the conversation...</p>'; 
                lastMsgTime = ""; return;
            } else {
                if(DOM.galleryBtn) DOM.galleryBtn.disabled = false;
            }

            const currentLastMsg = chatList[chatList.length - 1];
            const isNewMessage = lastMsgTime !== "" && lastMsgTime !== currentLastMsg.timestamp;

            if(currentLastMsg.sender === 'bf') {
                const gfReadTime = memoryData.gf_last_read ? new Date(memoryData.gf_last_read).getTime() : 0;
                if (new Date(currentLastMsg.timestamp).getTime() > gfReadTime) ChatNetwork.updateReadReceipt();
            }

            if(isNewMessage && currentLastMsg.sender === 'bf') {
                if(DOM.soundReceive) { DOM.soundReceive.currentTime = 0; DOM.soundReceive.play().catch(()=>{}); }
            }

            const bfReadTime = memoryData.bf_last_read ? new Date(memoryData.bf_last_read).getTime() : 0;

            let newHtml = '';
            chatList.forEach((msgObj, index) => {
                let decryptedText = "";
                try {
                    const bytes = CryptoJS.AES.decrypt(msgObj.text, state.userPasscode);
                    decryptedText = bytes.toString(CryptoJS.enc.Utf8);
                } catch(e) { decryptedText = ""; }

                // Parse Custom Quote Format: [QUOTE]text[/QUOTE] Msg
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
                    if(imgUrl) { imageHtml = `<img src="${imgUrl}" class="chat-img-msg">`; decryptedText = ""; } 
                    else { decryptedText = "<i>📷 Image Missing</i>"; }
                } else if(!decryptedText && !quoteHtml) { 
                    decryptedText = "<i>🔒 Encrypted Message</i>"; 
                }

                const timeStr = this.formatTime(msgObj.timestamp);
                const isGf = msgObj.sender === 'gf';
                let tickHtml = '';
                if (isGf) {
                    const isRead = bfReadTime >= new Date(msgObj.timestamp).getTime();
                    tickHtml = `<span class="msg-tick ${isRead ? 'tick-blue' : 'tick-grey'}"><i class="fa-solid fa-check-double"></i></span>`;
                }

                const animStyle = ((index === chatList.length - 1) && isNewMessage) ? '' : 'style="animation: none;"';
                const bubblePadding = imageHtml ? 'padding: 4px 4px 20px 4px;' : '';

                newHtml += `
                    <div class="msg-wrapper ${isGf ? 'gf' : 'bf'}" ${animStyle}>
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

            if (DOM.chatArea.innerHTML !== newHtml) {
                DOM.chatArea.innerHTML = newHtml;
                if (isNewMessage || lastMsgTime === "") DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;
            }
            lastMsgTime = currentLastMsg.timestamp;
        }
    };

    // --- 5. Network & Firebase ---
    const ChatNetwork = {
        updateStatus: function(statusStr) {
            if (state.mode === 'admin_preview' || !state.memoryId || typeof firebaseConfig === 'undefined') return;
            fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gf_status: statusStr })
            }).catch(e => {});
        },

        updateReadReceipt: function() {
            if (state.mode === 'admin_preview' || document.hidden || typeof firebaseConfig === 'undefined' || !state.memoryId) return; 
            fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gf_last_read: new Date().toISOString() })
            }).catch(e => {});
        },

        startRealtime: function() {
            if (window.gfChatStream) window.gfChatStream.close();
            window.gfChatStream = new EventSource(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`);

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
                    } 
                    else if (payload.path === "/message_count") state.memoryData.message_count = payload.data;
                    else if (payload.path === "/bf_last_read") state.memoryData.bf_last_read = payload.data;
                    else if (payload.path === "/bf_status") { state.memoryData.bf_status = payload.data; needChatRender = false; } 
                    else needChatRender = false;

                    if(needChatRender) ChatUI.renderMessages();
                    ChatUI.updateHeader();
                } catch(err) {}
            });

            window.gfChatStream.addEventListener('patch', (e) => {
                try {
                    const payload = JSON.parse(e.data);
                    if (payload.path === "/") {
                        state.memoryData = { ...state.memoryData, ...payload.data };
                        if (!Object.keys(payload.data).every(k => k === 'gf_status' || k === 'bf_status')) ChatUI.renderMessages();
                        ChatUI.updateHeader();
                    }
                } catch(err) {}
            });
        },

        sendMessage: async function(rawText) {
            if(!rawText && !currentReplyQuote) return false;

            // Format Quote if exists
            let finalMsgText = rawText;
            if(currentReplyQuote) {
                finalMsgText = `[QUOTE]${currentReplyQuote}[/QUOTE] ${rawText}`;
            }

            if(DOM.soundSend) { DOM.soundSend.currentTime = 0; DOM.soundSend.play().catch(()=>{}); }
            if(navigator.vibrate) navigator.vibrate(40); 
            if(DOM.sendBtn) { DOM.sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; DOM.sendBtn.disabled = true; }

            try {
                const res = await fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`);
                const latestData = await res.json();

                let chatList = Array.isArray(latestData.chat) ? latestData.chat : Object.values(latestData.chat || []);
                chatList = chatList.filter(msg => msg !== null && msg.sender);
                let newCount = (latestData.message_count || 0) + 1;

                const encryptedMsg = CryptoJS.AES.encrypt(finalMsgText, state.userPasscode).toString();
                chatList.push({ sender: 'gf', text: encryptedMsg, timestamp: new Date().toISOString() });
                if(chatList.length > 100) chatList = chatList.slice(chatList.length - 100);

                await fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat: chatList, message_count: newCount })
                });

                if(DOM.inputEl) { DOM.inputEl.value = ''; DOM.inputEl.style.height = 'auto'; }

                // Reset Reply Box
                currentReplyQuote = "";
                DOM.replyPreviewBox.classList.add('hidden');

                this.updateStatus('online'); 
                if(DOM.sendBtn) { DOM.sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; DOM.sendBtn.disabled = false; }
                return true;
            } catch(err) { 
                if(DOM.sendBtn) { DOM.sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; DOM.sendBtn.disabled = false; }
                return false; 
            }
        }
    };

    // --- 6. Swipe To Reply Logic ---
    let touchStartX = 0, touchStartY = 0, swipedMsg = null;
    if(DOM.chatArea) {
        DOM.chatArea.addEventListener('touchstart', e => {
            const msg = e.target.closest('.msg-wrapper');
            if(!msg) return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            swipedMsg = msg;
        }, {passive: true});

        DOM.chatArea.addEventListener('touchmove', e => {
            if(!swipedMsg) return;
            let diffX = e.touches[0].clientX - touchStartX;
            let diffY = e.touches[0].clientY - touchStartY;
            // Only swipe right if horizontal movement is greater than vertical
            if(Math.abs(diffX) > Math.abs(diffY) && diffX > 15) { 
                swipedMsg.style.transform = `translateX(${Math.min(diffX, 50)}px)`;
            }
        }, {passive: true});

        DOM.chatArea.addEventListener('touchend', e => {
            if(!swipedMsg) return;
            let diffX = e.changedTouches[0].clientX - touchStartX;
            if(diffX > 40) {
                // Trigger Reply
                let rawTextEl = swipedMsg.querySelector('.msg-raw-text');
                let imgEl = swipedMsg.querySelector('.chat-img-msg');

                let quoteText = rawTextEl ? rawTextEl.innerText : "";
                if(imgEl) quoteText = "📷 Photo";

                if(quoteText) {
                    currentReplyQuote = quoteText.substring(0, 40) + (quoteText.length > 40 ? "..." : "");
                    DOM.replyTextPreview.innerText = currentReplyQuote;
                    DOM.replyPreviewBox.classList.remove('hidden');
                    DOM.inputEl.focus();
                    if(navigator.vibrate) navigator.vibrate(50);
                }
            }
            swipedMsg.style.transform = 'translateX(0)';
            swipedMsg = null;
        });

        DOM.cancelReplyBtn.addEventListener('click', () => {
            currentReplyQuote = "";
            DOM.replyPreviewBox.classList.add('hidden');
        });
    }

     // --- 7. Scroll Arrows Logic ---
    let scrollTimeout;
    if(DOM.chatArea && DOM.scrollArrows) {
        DOM.chatArea.addEventListener('scroll', () => {
            DOM.scrollArrows.classList.remove('hidden');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => DOM.scrollArrows.classList.add('hidden'), 1500);
        });
        DOM.scrollTopBtn.addEventListener('click', () => DOM.chatArea.scrollTo({top: 0, behavior: 'smooth'}));
        DOM.scrollBottomBtn.addEventListener('click', () => DOM.chatArea.scrollTo({top: DOM.chatArea.scrollHeight, behavior: 'smooth'}));
    }


          // ==========================================
    // MAIN CONTROLLER (Section 8: Main Init & Events)
    // ==========================================
    function initApp() {
        // 🔴 NAYA FIX: Admin Mode Security Block (Strict Lock)
        if (state.mode === 'admin_preview') {
            if(DOM.inputEl) { 
                DOM.inputEl.disabled = true; 
                DOM.inputEl.placeholder = "Admin Preview (Read Only)"; 
            }
            if(DOM.sendBtn) DOM.sendBtn.disabled = true;
            if(DOM.galleryBtn) DOM.galleryBtn.disabled = true;
        }

        ChatUI.initViewportFix();

        // Visibility & Focus Events
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) { 
                ChatNetwork.updateReadReceipt(); 
                ChatNetwork.updateStatus('online'); 
            } else { 
                ChatNetwork.updateStatus(new Date().toISOString()); 
            }
        });
        window.addEventListener('beforeunload', () => ChatNetwork.updateStatus(new Date().toISOString()));
        if(DOM.inputEl) DOM.inputEl.addEventListener('focus', () => ChatNetwork.updateReadReceipt());

        // Gallery Events
        if(DOM.galleryBtn) {
            DOM.galleryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // 🔴 Extra Security: Agar Admin hai toh gallery popup nahi khulega
                if(state.mode === 'admin_preview') return; 

                DOM.imgGrid.innerHTML = '';
                let found = false;
                const memoryData = state.memoryData || {};

                for(let i=1; i<=5; i++) {
                    let imgUrl = memoryData[`image_${i}_url`];
                    if(imgUrl) {
                        found = true;
                        let imgEl = document.createElement('img');
                        imgEl.src = imgUrl;
                        imgEl.onclick = () => { DOM.imgPopup.classList.add('hidden'); ChatNetwork.sendMessage(`[IMG_${i}]`); };
                        DOM.imgGrid.appendChild(imgEl);
                    }
                }
                if(!found) DOM.imgGrid.innerHTML = '<span style="font-size:12px; color:#888; padding:10px;">No memories found.</span>';
                DOM.imgPopup.classList.remove('hidden');
            });
            if(DOM.closePopup) DOM.closePopup.addEventListener('click', () => DOM.imgPopup.classList.add('hidden'));
        }

        // Typing & Sending Events
        let typingTimer;
        if (DOM.sendBtn) {
            DOM.sendBtn.addEventListener('mousedown', (e) => e.preventDefault());
            DOM.sendBtn.addEventListener('touchstart', (e) => { 
                e.preventDefault(); 
                if(!DOM.sendBtn.disabled && state.mode !== 'admin_preview') ChatNetwork.sendMessage(DOM.inputEl.value.trim()); 
            });

            DOM.sendBtn.addEventListener('click', () => {
                if(state.mode !== 'admin_preview') ChatNetwork.sendMessage(DOM.inputEl.value.trim());
            });

            DOM.inputEl.addEventListener('input', function() {
                if(state.mode === 'admin_preview') return;
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
                ChatNetwork.updateStatus('typing...');
                clearTimeout(typingTimer);
                typingTimer = setTimeout(() => ChatNetwork.updateStatus('online'), 1500);
            });
        }

        // Startup Network Call
        ChatNetwork.updateStatus('online');
        ChatNetwork.updateReadReceipt();
        ChatNetwork.startRealtime(); 
    }

    initApp();

})();


