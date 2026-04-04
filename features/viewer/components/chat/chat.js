(function() {
    const state = window.viewerState;
    if (!state) return;

    const DOM = {
        wrapper: document.getElementById('gf-chat-wrapper'),
        chatArea: document.getElementById('chat-messages-area'),
        inputEl: document.getElementById('live-msg-input'),
        sendBtn: document.getElementById('send-msg-btn'),
        countDisplay: document.getElementById('msg-count-display'),
        soundSend: document.getElementById('sound-send'),
        soundReceive: document.getElementById('sound-receive'),
        statusEl: document.getElementById('live-status'),
        userNameEl: document.getElementById('chat-user-name'), 
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
                    // Pata lagana ki keyboard khula hai ya nahi (Focus check karna sabse safe hai)
                    const isKeyboardActive = document.activeElement === DOM.inputEl;

                    if (isKeyboardActive || window.visualViewport.height < window.screen.height - 100) {
                        // 🔴 KEYBOARD OPEN: Poori screen le lo (100%), 70px ki gap hata do
                        DOM.wrapper.style.height = `${window.visualViewport.height}px`;
                    } else {
                        // 🔴 KEYBOARD CLOSED: Wapas 70px gap chhod do footer ke liye
                        DOM.wrapper.style.height = `calc(100dvh - 70px)`; 
                    }
                    if(DOM.chatArea) DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;
                });
            }
        },


        updateHeader: function() {
            if (!DOM.statusEl) return;
            const bfStatus = (state.memoryData || {}).bf_status;

            if(DOM.userNameEl && state.memoryData) {
                DOM.userNameEl.innerText = state.memoryData.customer_name || "My Love ❤️";
            }

            if (bfStatus === 'typing...') DOM.statusEl.innerHTML = '<span style="color:#D81B60; font-style: italic;">typing...</span>';
            else if (bfStatus === 'online') DOM.statusEl.innerHTML = '<span style="color:#10b981; font-weight: 600;">online</span>'; 
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

            const bfReadTime = memoryData.bf_last_read ? new Date(memoryData.bf_last_read).getTime() : 0;

            // 🔴 FLY AWAY ANIMATION LOGIC
            if (isNewMessage && !DOM.chatArea.classList.contains('history-mode')) {
                if(DOM.soundReceive && currentLastMsg.sender === 'bf') { DOM.soundReceive.currentTime = 0; DOM.soundReceive.play().catch(()=>{}); }

                const oldLiveMsg = DOM.chatArea.querySelector(`.msg-wrapper.${currentLastMsg.sender}.live-active`);
                if (oldLiveMsg) {
                    const rect = oldLiveMsg.getBoundingClientRect();
                    const clone = oldLiveMsg.cloneNode(true);
                    clone.classList.remove('live-active');
                    clone.classList.add('fly-away');
                    clone.style.position = 'fixed';
                    clone.style.left = rect.left + 'px';
                    clone.style.top = rect.top + 'px';
                    clone.style.margin = '0';
                    document.body.appendChild(clone);
                    setTimeout(() => clone.remove(), 850);
                }
            }

            // 🔴 FIND LATEST MESSAGES FOR 'LIVE MODE'
            let lastBfIdx = -1, lastGfIdx = -1;
            for (let i = 0; i < chatList.length; i++) {
                if (chatList[i].sender === 'bf') lastBfIdx = i;
                if (chatList[i].sender === 'gf') lastGfIdx = i;
            }

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

                const bubblePadding = imageHtml ? 'padding: 4px 4px 20px 4px;' : '';

                               // 🔴 ADD 'live-active' TO LATEST 2 MESSAGES ONLY
                let liveClass = (index === lastBfIdx || index === lastGfIdx) ? ' live-active' : '';

                // 🔴 ONLY ANIMATE THE NEWLY ARRIVED MESSAGE
                let animClass = (isNewMessage && index === chatList.length - 1) ? ' animate-pop' : '';

                newHtml += `
                    <div class="msg-wrapper ${isGf ? 'gf' : 'bf'}${liveClass}${animClass}">


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
                const oldScrollHeight = DOM.chatArea.scrollHeight;
                DOM.chatArea.innerHTML = newHtml;

                if (DOM.chatArea.classList.contains('history-mode')) {
                    DOM.chatArea.scrollTop += (DOM.chatArea.scrollHeight - oldScrollHeight);
                } else if (isNewMessage || lastMsgTime === "") {
                    DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;
                }
            }
            lastMsgTime = currentLastMsg.timestamp;
        }
    };

        const ChatNetwork = {
        // 🔴 BUG FIXED: Status direct gf_status file mein update hoga
        updateStatus: function(statusStr) {
            if (!state.memoryId || typeof firebaseConfig === 'undefined') return;
            fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}/gf_status.json`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(statusStr)
            }).catch(e => {});
        },

        // 🔴 BUG FIXED: Read receipt direct file mein update hoga
        updateReadReceipt: function() {
            if (document.hidden || typeof firebaseConfig === 'undefined' || !state.memoryId) return; 
            fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}/gf_last_read.json`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(new Date().toISOString())
            }).catch(e => {});
        },


        startRealtime: function() {
            if (window.gfChatStream) window.gfChatStream.close();
            if (window.bfStatusStream) window.bfStatusStream.close();
            if (window.bfReadStream) window.bfReadStream.close();

            // 🚀 SUPERFAST SSE STREAMING
            window.gfChatStream = new EventSource(`${firebaseConfig.databaseURL}/memories/${state.memoryId}/chat.json`);
            const handleChatData = (e) => {
                try {
                    const payload = JSON.parse(e.data);
                    if (payload && payload.data !== null) {
                        if (payload.path === "/") { 
                            state.memoryData.chat = Array.isArray(payload.data) ? payload.data : Object.values(payload.data);
                        } else {
                            if (!state.memoryData.chat) state.memoryData.chat = [];
                            state.memoryData.chat.push(payload.data);
                        }
                        ChatUI.renderMessages();
                    }
                } catch(err) {}
            };
            window.gfChatStream.addEventListener('put', handleChatData);
            window.gfChatStream.addEventListener('patch', handleChatData);

            window.bfStatusStream = new EventSource(`${firebaseConfig.databaseURL}/memories/${state.memoryId}/bf_status.json`);
            window.bfStatusStream.addEventListener('put', (e) => {
                try { const p = JSON.parse(e.data); if (p.data !== null) { state.memoryData.bf_status = p.data; ChatUI.updateHeader(); } } catch(err) {}
            });

            window.bfReadStream = new EventSource(`${firebaseConfig.databaseURL}/memories/${state.memoryId}/bf_last_read.json`);
            window.bfReadStream.addEventListener('put', (e) => {
                try { const p = JSON.parse(e.data); if (p.data !== null) { state.memoryData.bf_last_read = p.data; ChatUI.renderMessages(); } } catch(err) {}
            });
        },

        sendMessage: async function(rawText) {
            if(!rawText && !currentReplyQuote) return false;

            let finalMsgText = rawText;
            if(currentReplyQuote) { finalMsgText = `[QUOTE]${currentReplyQuote}[/QUOTE] ${rawText}`; }

            if(DOM.soundSend) { DOM.soundSend.currentTime = 0; DOM.soundSend.play().catch(()=>{}); }
            if(navigator.vibrate) navigator.vibrate(40); 

            try {
                const encryptedMsg = CryptoJS.AES.encrypt(finalMsgText, state.userPasscode).toString();
                const newMsgObj = { sender: 'gf', text: encryptedMsg, timestamp: new Date().toISOString() };

                // 🚀 FAST UI UPDATE: Turant screen se input hat jayega
                if(DOM.inputEl) { DOM.inputEl.value = ''; DOM.inputEl.style.height = 'auto'; }
                                currentReplyQuote = "";
                if(DOM.replyPreviewBox) DOM.replyPreviewBox.classList.add('hidden');

                // 🔴 NEW: Bhejte waqt History Mode hata do
                if (DOM.chatArea) DOM.chatArea.classList.remove('history-mode');

                this.updateStatus('online'); 


                // 🚀 SUPERFAST POST: Firebase seedha naya push karega
                fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}/chat.json`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMsgObj)
                });

                // Message count update
                fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}/message_count.json`)
                    .then(res => res.json())
                    .then(count => {
                        fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}/message_count.json`, {
                            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify((count || 0) + 1)
                        });
                    });

                return true;
            } catch(err) { 
                console.error(err);
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

      let scrollTimeout;
    let lastScrollTop = 0;

    if(DOM.chatArea && DOM.scrollArrows) {
        DOM.chatArea.addEventListener('scroll', () => {
            DOM.scrollArrows.classList.remove('hidden');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => DOM.scrollArrows.classList.add('hidden'), 1500);

            // 🔴 HISTORY MODE TOGGLE LOGIC
            const currentScrollTop = DOM.chatArea.scrollTop;
            const isScrollingUp = currentScrollTop < lastScrollTop;
            const isAtBottom = DOM.chatArea.scrollHeight - currentScrollTop - DOM.chatArea.clientHeight <= 10;

                        if (isScrollingUp && !DOM.chatArea.classList.contains('history-mode') && currentScrollTop > 0) {
                // Upar Scroll karne par purani chat dikhao
                const oldHeight = DOM.chatArea.scrollHeight;
                DOM.chatArea.classList.add('history-mode');
                // 🔴 Scroll karte hi animation class hata do taaki wapas niche aane par dubara popup na ho
                DOM.chatArea.querySelectorAll('.animate-pop').forEach(el => el.classList.remove('animate-pop'));
                const newHeight = DOM.chatArea.scrollHeight;


                DOM.chatArea.scrollTop = currentScrollTop + (newHeight - oldHeight); 
            } else if (isAtBottom && DOM.chatArea.classList.contains('history-mode')) {
                // Niche aane par History mode band kardo
                DOM.chatArea.classList.remove('history-mode');
            }

            lastScrollTop = currentScrollTop;
        });

        DOM.scrollTopBtn.addEventListener('click', () => {
            DOM.chatArea.classList.add('history-mode');
            setTimeout(() => DOM.chatArea.scrollTo({top: 0, behavior: 'smooth'}), 50);
        });

        DOM.scrollBottomBtn.addEventListener('click', () => {
            DOM.chatArea.scrollTo({top: DOM.chatArea.scrollHeight, behavior: 'smooth'});
            setTimeout(() => DOM.chatArea.classList.remove('history-mode'), 300);
        });
    }


        function initApp() {
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

        if(DOM.inputEl) {
            DOM.inputEl.addEventListener('focus', () => {
                ChatNetwork.updateReadReceipt();
                const bottomNav = document.querySelector('.bottom-nav-bar');
                if(bottomNav) bottomNav.style.display = 'none';

                // 🔴 GAP FIX: Jaise hi keyboard khule, chat wrapper ko poora faila do (gap khatam)
                if (DOM.wrapper) {
                    DOM.wrapper.style.height = window.visualViewport ? `${window.visualViewport.height}px` : '100dvh';
                }
            });

            DOM.inputEl.addEventListener('blur', () => {
                const bottomNav = document.querySelector('.bottom-nav-bar');
                if(bottomNav) bottomNav.style.display = 'flex';

                // 🔴 KEYBOARD CLOSE: Wapas 70px gap chhod do taaki footer dikh sake
                if (DOM.wrapper) {
                    DOM.wrapper.style.height = 'calc(100dvh - 70px)';
                }
            });
        }

        if(DOM.galleryBtn) {


            DOM.galleryBtn.addEventListener('click', (e) => {
                e.preventDefault();

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
                if(!DOM.sendBtn.disabled) ChatNetwork.sendMessage(DOM.inputEl.value.trim()); 
            });

            DOM.sendBtn.addEventListener('click', () => {
                ChatNetwork.sendMessage(DOM.inputEl.value.trim());
            });

            DOM.inputEl.addEventListener('input', function() {
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