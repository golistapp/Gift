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
        userNameEl: document.getElementById('chat-user-name'), // 🔴 New Element
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

    let currentReplyQuote = ""; 
    let lastMsgTime = "";

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

    const ChatUI = {
        formatTime: function(isoString) {
            if(!isoString) return '';
            return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        },

        initViewportFix: function() {
            if (window.visualViewport && DOM.wrapper) {
                window.visualViewport.addEventListener('resize', () => {
                    // Mobile keyboard adjustment
                    if (window.visualViewport.height < window.innerHeight - 50) {
                        DOM.wrapper.style.height = `${window.visualViewport.height}px`;
                    } else {
                        DOM.wrapper.style.height = `calc(100dvh - 70px)`; // Nav bar space
                    }
                    if(DOM.chatArea) DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;
                });
            }
        },

        // 🔴 Status Update for Native Layout
        updateHeader: function() {
            if (!DOM.statusEl) return;
            const bfStatus = (state.memoryData || {}).bf_status;
            
            // Set dynamic Name if available
            if(DOM.userNameEl && state.memoryData && state.memoryData.girlfriend_name) {
                DOM.userNameEl.innerText = state.memoryData.girlfriend_name;
            }

            if (bfStatus === 'typing...') DOM.statusEl.innerHTML = '<span style="color:#D81B60; font-style: italic;">typing...</span>';
            else if (bfStatus === 'online') DOM.statusEl.innerHTML = '<span style="color:#10b981; font-weight: 600;">online</span>'; // Green online indicator
            else if (bfStatus && bfStatus !== 'offline') {
                let dateObj = new Date(bfStatus);
                if(!isNaN(dateObj)) DOM.statusEl.innerHTML = `last seen at ${this.formatTime(bfStatus)}`;
                else DOM.statusEl.innerHTML = 'offline';
            } else DOM.statusEl.innerHTML = 'offline';
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
                    else { decryptedText = "<i>📸 Image Missing</i>"; }
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
            if(Math.abs(diffX) > Math.abs(diffY) && diffX > 15) { 
                swipedMsg.style.transform = `translateX(${Math.min(diffX, 50)}px)`;
            }
        }, {passive: true});

        DOM.chatArea.addEventListener('touchend', e => {
            if(!swipedMsg) return;
            let diffX = e.changedTouches[0].clientX - touchStartX;
            if(diffX > 40) {
                let rawTextEl = swipedMsg.querySelector('.msg-raw-text');
                let imgEl = swipedMsg.querySelector('.chat-img-msg');
                
                let quoteText = rawTextEl ? rawTextEl.innerText : "";
                if(imgEl) quoteText = "📸 Photo";
                
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

    function initApp() {
        if (state.mode === 'admin_preview') {
            if(DOM.inputEl) { 
                DOM.inputEl.disabled = true; 
                DOM.inputEl.placeholder = "Admin Preview (Read Only)"; 
            }
            if(DOM.sendBtn) DOM.sendBtn.disabled = true;
            if(DOM.galleryBtn) DOM.galleryBtn.disabled = true;
        }

        ChatUI.initViewportFix();

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

        if(DOM.galleryBtn) {
            DOM.galleryBtn.addEventListener('click', (e) => {
                e.preventDefault();
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

        ChatNetwork.updateStatus('online');
        ChatNetwork.updateReadReceipt();
        ChatNetwork.startRealtime(); 
    }

    initApp();

})();
