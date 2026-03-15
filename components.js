// ==========================================
// 🧩 THE COMPONENT SYSTEM 
// ==========================================

const AppComponents = {

    // ------------------------------------------
    // 1. THE VAULT COMPONENT (Passcode Screen)
    // ------------------------------------------
    getVaultHTML: function() {
        return `
        <div class="vault-screen" style="position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
            <div class="glass-card" style="padding: 40px 30px; text-align: center; width: 90%; max-width: 350px;">
                <i class="fa-solid fa-lock" style="font-size: 40px; color: #cc0033; margin-bottom: 10px;"></i>
                <h2 style="font-family: 'Dancing Script'; font-size: 35px; color: #cc0033;">The Vault</h2>
                <p style="font-size: 13px; color: #555; margin-bottom: 20px;">Enter the secret passcode to unlock</p>
                
                <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 30px;" id="dots-container">
                    <div class="dot" style="width:15px; height:15px; border-radius:50%; background:rgba(0,0,0,0.1);"></div>
                    <div class="dot" style="width:15px; height:15px; border-radius:50%; background:rgba(0,0,0,0.1);"></div>
                    <div class="dot" style="width:15px; height:15px; border-radius:50%; background:rgba(0,0,0,0.1);"></div>
                    <div class="dot" style="width:15px; height:15px; border-radius:50%; background:rgba(0,0,0,0.1);"></div>
                    <div class="dot" style="width:15px; height:15px; border-radius:50%; background:rgba(0,0,0,0.1);"></div>
                    <div class="dot" style="width:15px; height:15px; border-radius:50%; background:rgba(0,0,0,0.1);"></div>
                </div>

                <div class="keypad">
                    <button class="key magic-key" data-number="1">1</button>
                    <button class="key magic-key" data-number="2">2</button>
                    <button class="key magic-key" data-number="3">3</button>
                    <button class="key magic-key" data-number="4">4</button>
                    <button class="key magic-key" data-number="5">5</button>
                    <button class="key magic-key" data-number="6">6</button>
                    <button class="key magic-key" data-number="7">7</button>
                    <button class="key magic-key" data-number="8">8</button>
                    <button class="key magic-key" data-number="9">9</button>
                    <button class="key clear-btn magic-key"><i class="fa-solid fa-delete-left"></i></button>
                    <button class="key magic-key" data-number="0">0</button>
                    <button class="key" style="visibility:hidden;"></button>
                </div>

                <button id="unlock-btn" style="width: 100%; padding: 15px; border: none; border-radius: 25px; background: #ccc; color: white; font-weight: 600; font-size: 16px; margin-top:20px; transition: 0.3s;" disabled>UNLOCK GIFT</button>
            </div>
        </div>
        `;
    },

    // ✨ Vault Magic Animation & Sound
    attachVaultMagic: function() {
        const keys = document.querySelectorAll('.magic-key');
        const tickSound = document.getElementById('tick-sound');

        keys.forEach(key => {
            key.addEventListener('click', function(e) {
                // 1. Play Sound
                tickSound.currentTime = 0;
                tickSound.play().catch(err => console.log("Sound blocked"));

                // 2. Heart Pop Animation
                const heart = document.createElement('div');
                heart.innerHTML = '❤️';
                heart.style.position = 'absolute';
                heart.style.left = '50%';
                heart.style.top = '10%';
                heart.style.transform = 'translate(-50%, -50%)';
                heart.style.fontSize = '20px';
                heart.style.pointerEvents = 'none';
                heart.style.transition = 'all 0.6s ease-out';
                heart.style.opacity = '1';
                
                this.style.position = 'relative'; // Keypad button position
                this.appendChild(heart);

                // Animate up and fade out
                setTimeout(() => {
                    heart.style.top = '-30px';
                    heart.style.opacity = '0';
                    heart.style.transform = 'translate(-50%, -50%) scale(1.5)';
                }, 10);

                // Remove from DOM after animation
                setTimeout(() => { heart.remove(); }, 600);
            });
        });
    },

    // ------------------------------------------
    // 2. THE SURPRISE COMPONENT (Envelope, Gallery)
    // ------------------------------------------
    getSurpriseHTML: function() {
        return `
        <div class="viewer-section" style="min-height: 80vh; padding-top:40px; text-align:center;">
            <h1 class="hero-title" id="dynamic-gf-name" style="font-family: 'Dancing Script'; font-size: 5rem; color: #cc0033;">My Love</h1>
            <p class="hero-subtitle" style="font-family: 'Playfair Display'; font-size: 1.5rem; margin-top:10px;">"My heart beats only for you."</p>
            <i class="fa-solid fa-arrow-down" style="font-size: 24px; color: #cc0033; animation: bounce 2s infinite; margin-top:30px;"></i>
        </div>

        <div class="viewer-section" id="envelope-section" style="padding: 40px 20px; text-align:center;">
            <div class="envelope-wrapper" style="cursor:pointer; display:inline-block;">
                <div class="envelope" style="width: 320px; height: 220px; background: #a80026; position: relative; border-radius: 8px; box-shadow: 0 15px 35px rgba(0,0,0,0.2);">
                    <div class="env-flap" style="position: absolute; border-left: 160px solid transparent; border-right: 160px solid transparent; border-top: 130px solid #e60039; z-index: 4; transition: transform 0.6s; transform-origin: top;"></div>
                    <div class="env-front" style="position: absolute; border-left: 160px solid #cc0033; border-right: 160px solid #cc0033; border-bottom: 110px solid #b3002d; border-top: 110px solid transparent; z-index: 3; width:0; height:0;"></div>
                    <div class="heart-seal" style="position: absolute; top: 115px; left: 50%; transform: translateX(-50%); color: white; font-size: 30px; z-index: 5;"><i class="fa-solid fa-heart"></i></div>
                </div>
            </div>
            <p style="margin-top: 30px; font-weight: 500;">Tap to open my heart 💌</p>
        </div>

        <div id="hidden-surprise-content" class="hidden">
            <div style="padding: 20px;">
                <div class="glass-card" style="padding: 30px; text-align: left;">
                    <h3 style="font-family: 'Dancing Script'; font-size: 30px; color: #cc0033; margin-bottom: 20px; text-align: center;">A Letter For You</h3>
                    <p id="dynamic-letter-text" style="font-family: 'Playfair Display'; font-size: 16px; line-height: 1.8; white-space: pre-wrap;"></p>
                    <p style="text-align: right; font-family: 'Dancing Script'; font-size: 24px; color: #cc0033; margin-top: 20px;">Forever Yours ❤️</p>
                </div>
            </div>

            <div style="padding: 40px 20px; text-align:center;">
                <h3 style="font-family: 'Dancing Script'; font-size: 35px; color: #cc0033; margin-bottom: 40px;">Our Memories</h3>
                <div id="polaroid-container" style="display: flex; flex-direction: column; gap: 30px; align-items: center;">
                    </div>
            </div>
        </div>
        `;
    },

    // ------------------------------------------
    // 3. THE CHAT COMPONENT (Secret Messages)
    // ------------------------------------------
    getChatHTML: function() {
        return `
        <div style="padding: 20px; min-height: 80vh;">
            <h2 style="font-family: 'Dancing Script'; font-size: 35px; color: #cc0033; text-align: center; margin-bottom: 10px;">Secret Chat Room <i class="fa-solid fa-lock" style="font-size:18px;"></i></h2>
            <p style="text-align:center; font-size:12px; color:#666; margin-bottom: 20px;">End-to-End Encrypted. Auto-deletes old messages.</p>
            
            <div id="chat-messages-area" style="background: rgba(255,255,255,0.6); backdrop-filter: blur(10px); border-radius: 15px; padding: 15px; min-height: 300px; max-height: 50vh; overflow-y: auto; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.8); display:flex; flex-direction:column; gap:10px;">
                <p style="text-align:center; color:#888; font-size:13px; margin-top:50px;">Send a message to start the conversation...</p>
            </div>

            <div class="glass-card" style="padding: 15px; border-radius:15px; display:flex; gap:10px; align-items:center;">
                <textarea id="live-msg-input" rows="1" placeholder="Type a message..." style="flex:1; padding:10px; border-radius:10px; border:1px solid #ff4d79; outline:none; resize:none; font-family:'Poppins';"></textarea>
                <button id="send-msg-btn" style="background: #cc0033; color:white; border:none; width:45px; height:45px; border-radius:50%; font-size:18px; cursor:pointer; box-shadow: 0 4px 10px rgba(204,0,51,0.3);"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
            <p id="msg-count-display" style="text-align:center; font-size:11px; color:#888; margin-top:10px;">Messages: 0 / 100</p>
        </div>
        `;
    },

    // ------------------------------------------
    // 4. THE FOOTER COMPONENT (Bottom Nav & Music)
    // ------------------------------------------
    getFooterHTML: function() {
        return `
        <button id="music-toggle-btn" style="position: fixed; bottom: 80px; right: 20px; width: 45px; height: 45px; border-radius: 50%; background: white; color: #cc0033; border: 2px solid #cc0033; font-size: 18px; z-index: 1000; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: 0.3s;">
            <i class="fa-solid fa-music"></i>
        </button>

        <div class="glass-card" style="position: fixed; bottom: 10px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 400px; display: flex; justify-content: space-around; padding: 10px 0; border-radius: 30px; z-index: 999; box-shadow: 0 10px 30px rgba(204,0,51,0.2);">
            
            <button id="nav-surprise" style="background:none; border:none; display:flex; flex-direction:column; align-items:center; color:#cc0033; cursor:pointer; font-family:'Poppins'; width:50%;">
                <i class="fa-solid fa-gift" style="font-size:22px; margin-bottom:4px;"></i>
                <span style="font-size:12px; font-weight:600;">Surprise</span>
            </button>

            <div style="width:1px; background:rgba(204,0,51,0.2); height:30px; align-self:center;"></div>

            <button id="nav-chat" style="background:none; border:none; display:flex; flex-direction:column; align-items:center; color:#888; cursor:pointer; font-family:'Poppins'; width:50%; transition:0.3s;">
                <i class="fa-solid fa-comment-dots" style="font-size:22px; margin-bottom:4px;"></i>
                <span style="font-size:12px; font-weight:600;">Chat</span>
            </button>

        </div>
        `;
    }
};
