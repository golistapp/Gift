// ==========================================
// 🧩 THE ADVANCED COMPONENT SYSTEM (UI)
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

    attachVaultMagic: function() {
        const keys = document.querySelectorAll('.magic-key');
        const tickSound = document.getElementById('tick-sound');

        keys.forEach(key => {
            key.addEventListener('click', function(e) {
                if(tickSound) {
                    tickSound.currentTime = 0;
                    tickSound.play().catch(err => console.log("Sound blocked"));
                }

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
                heart.style.zIndex = '100';
                
                this.style.position = 'relative'; 
                this.appendChild(heart);

                setTimeout(() => {
                    heart.style.top = '-40px';
                    heart.style.opacity = '0';
                    heart.style.transform = 'translate(-50%, -50%) scale(1.5) rotate(15deg)';
                }, 10);

                setTimeout(() => { heart.remove(); }, 600);
            });
        });
    },

    // ------------------------------------------
    // 2. THE SURPRISE COMPONENT
    // ------------------------------------------
    getSurpriseHTML: function() {
        return `
        <div class="viewer-section" style="min-height: 80vh; padding-top:40px; text-align:center;">
            <div class="glass-card" style="padding: 30px; border-radius: 20px;">
                <h1 class="hero-title" id="dynamic-occasion" style="font-family: 'Dancing Script'; font-size: 3.5rem; color: #cc0033; margin-bottom:10px;">A Special Surprise</h1>
                <h1 class="hero-name" id="dynamic-gf-name" style="font-family: 'Dancing Script'; font-size: 4.5rem; color: #ff4d79;">My Love</h1>
                <p class="hero-subtitle" style="font-family: 'Playfair Display'; font-size: 1.2rem; margin-top:15px;">Every moment with you is a beautiful dream come true.</p>
                <i class="fa-solid fa-arrow-down" style="font-size: 24px; color: #cc0033; animation: bounce 2s infinite; margin-top:20px;"></i>
            </div>
        </div>

        <div class="viewer-section" id="envelope-section" style="padding: 40px 20px; text-align:center;">
            <div class="envelope-wrapper" style="cursor:pointer; display:inline-block;">
                <div class="envelope" style="width: 320px; height: 220px; background: #a80026; position: relative; border-radius: 8px; box-shadow: 0 15px 35px rgba(0,0,0,0.2);">
                    <div class="env-flap" style="position: absolute; border-left: 160px solid transparent; border-right: 160px solid transparent; border-top: 130px solid #e60039; z-index: 4; transition: transform 0.6s; transform-origin: top;"></div>
                    <div class="env-front" style="position: absolute; border-left: 160px solid #cc0033; border-right: 160px solid #cc0033; border-bottom: 110px solid #b3002d; border-top: 110px solid transparent; z-index: 3; width:0; height:0;"></div>
                    <div class="heart-seal" style="position: absolute; top: 115px; left: 50%; transform: translateX(-50%); color: white; font-size: 30px; z-index: 5;"><i class="fa-solid fa-heart"></i></div>
                </div>
            </div>
            <p style="margin-top: 30px; font-weight: 500; color:#cc0033;">Tap to open my heart 💌</p>
        </div>

        <div id="hidden-surprise-content" class="hidden">
            
                        <div style="padding: 20px; display:flex; justify-content:center;">
                <div class="notebook-page" style="padding: 40px 20px; max-width:600px; width:100%; text-align: left; position:relative; overflow:hidden;">
                    <div class="romantic-letter">
                        <h3 style="font-family: 'Dancing Script'; font-size: 30px; color: #cc0033; margin-bottom: 20px; text-align: center;">A Letter For You</h3>
                        <div id="dynamic-letter-container" style="padding-left: 10px; font-family: 'Dancing Script'; font-size: 22px; color: #333; line-height: 1.8;">
                        </div>
                        <p class="letter-line signature" style="text-align: right; font-family: 'Dancing Script'; font-size: 28px; color: #cc0033; margin-top: 40px; font-weight:bold;">Forever Yours ❤️</p>
                    </div>
                </div>
            </div>


            <div style="padding: 40px 20px; text-align:center;">
                <h3 style="font-family: 'Dancing Script'; font-size: 35px; color: #cc0033; margin-bottom: 20px;">Our Memories</h3>
                <div class="gallery-grid" id="polaroid-container">
                    </div>
            </div>

            <div style="padding: 40px 20px; text-align:center;">
                <h3 style="font-family: 'Dancing Script'; font-size: 35px; color: #cc0033; margin-bottom: 30px;">Open When...</h3>
                <div class="cards-grid">
                    <div class="airmail-card" onclick="this.classList.toggle('opened');">
                        <div class="airmail-inner">
                            <div class="airmail-front">
                                <div class="airmail-label">To: You</div>
                                <i class="fa-solid fa-face-laugh-beam"></i>
                                <h3>You are happy</h3>
                            </div>
                            <div class="airmail-back airmail-letter" id="dynamic-ow-happy"></div>
                        </div>
                    </div>
                    <div class="airmail-card" onclick="this.classList.toggle('opened');">
                        <div class="airmail-inner">
                            <div class="airmail-front">
                                <div class="airmail-label">To: You</div>
                                <i class="fa-solid fa-face-frown-open"></i>
                                <h3>You are sad</h3>
                            </div>
                            <div class="airmail-back airmail-letter" id="dynamic-ow-sad"></div>
                        </div>
                    </div>
                    <div class="airmail-card" onclick="this.classList.toggle('opened');">
                        <div class="airmail-inner">
                            <div class="airmail-front">
                                <div class="airmail-label">To: You</div>
                                <i class="fa-solid fa-location-dot"></i>
                                <h3>You miss me</h3>
                            </div>
                            <div class="airmail-back airmail-letter" id="dynamic-ow-miss"></div>
                        </div>
                    </div>
                    <div class="airmail-card" onclick="this.classList.toggle('opened');">
                        <div class="airmail-inner">
                            <div class="airmail-front">
                                <div class="airmail-label">To: You</div>
                                <i class="fa-solid fa-bed"></i>
                                <h3>You can't sleep</h3>
                            </div>
                            <div class="airmail-back airmail-letter" id="dynamic-ow-sleep"></div>
                        </div>
                    </div>
                </div>
            </div>

                        <div id="proposal" class="clean-section" style="padding: 40px 20px; text-align: center; margin-top: 40px;">
                <div id="proposal-state">
                    <h2 class="script-heading" style="font-family: 'Dancing Script'; font-size: 3.5rem; color: #ff4d79; margin-bottom: 25px;">Will you be my Valentine? <span style="font-size:2.5rem;">🌹</span></h2>
                    
                    <div class="gif-card hidden-gif" id="question-gif-card" style="display:none; background: #ffffff; border-radius: 16px; padding: 20px; box-shadow: 0 10px 30px rgba(255, 77, 121, 0.1); margin-bottom: 30px;">
                        <img src="" alt="Reaction Bear" class="main-gif" id="proposal-gif" style="width: 280px; height: 280px; object-fit: contain; border-radius: 12px;">
                    </div>

                    <div class="proposal-buttons" style="display: flex; gap: 20px; justify-content: center; align-items: center; position: relative; height: 70px;">
                        <button class="btn-no" id="btn-no" style="background: #9ca3af; color: white; padding: 12px 35px; border-radius: 30px; border: none; font-size: 1.2rem; font-weight: 500; cursor: pointer; position: absolute; left: 20%; z-index: 10;">No 🥺</button>
                        <button class="btn-yes" id="btn-yes" onclick="acceptProposal(event)" style="background: #d81b60; color: white; padding: 12px 35px; border-radius: 30px; border: none; font-size: 1.2rem; font-weight: 500; cursor: pointer; box-shadow: 0 8px 20px rgba(216, 27, 96, 0.3); position: absolute; right: 20%; z-index: 5;">Yes! 💖</button>
                    </div>
                </div>

                <div id="success-state" style="display:none;">
                    <h2 class="script-heading accent-pink" style="font-family: 'Dancing Script'; font-size: 4.5rem; color: #ff3366; margin-bottom: 10px;">✨ Yayyyyyy! ✨</h2>
                    <p class="success-subtext" style="font-family: 'Poppins'; color: #333; font-size: 1.2rem; margin-bottom: 30px;">"I knew you'd say yes! I love you! 💖"</p>
                    <div class="gif-card success-card" style="background: #ffffff; border-radius: 16px; padding: 20px; border: 2px solid #ff1a53; box-shadow: 0 15px 40px rgba(255, 26, 83, 0.2); display: inline-block;">
                        <img src="https://media.tenor.com/T0bSg1H9b4MAAAAj/cute-bear.gif" alt="Happy Bears" class="main-gif" style="width: 280px; height: 280px; object-fit: contain; border-radius: 12px;">
                    </div>
                </div>
            </div>


            <div id="final-surprise" class="clean-section" style="padding: 60px 20px; text-align: center; padding-bottom: 150px; border-top: 2px dashed #ffe6ea;">
                <h2 style="font-family: 'Dancing Script'; font-size: 3.5rem; color: #4a1525; margin-bottom: 10px;">One Last Surprise...</h2>
                <p style="color: #ff4d79; font-family: 'Poppins'; font-size: 1.1rem; margin-bottom: 40px;">Click the box to open</p>
                
                <div class="minimal-gift-container" id="final-gift-box-trigger" onclick="openGift()" style="cursor: pointer; perspective: 1000px; margin-bottom: 20px; display:inline-block;">
                    <div class="minimal-gift-box" id="minimal-gift" style="position: relative; width: 140px; height: 120px; transition: transform 0.3s ease;">
                        <div class="minimal-gift-lid" style="position: absolute; top: 5px; left: -5%; width: 110%; height: 30px; background: linear-gradient(to bottom, #e60000, #b30000); border-radius: 6px; z-index: 2; box-shadow: 0 5px 10px rgba(0,0,0,0.3); transition: all 0.6s ease;"></div>
                        <div class="minimal-gift-body" style="position: absolute; bottom: 0; width: 100%; height: 100px; background: linear-gradient(to bottom, #cc0000, #4a0000); border-radius: 8px; box-shadow: 0 15px 30px rgba(0,0,0,0.2);"></div>
                    </div>
                </div>

                <div id="surpriseMessage" style="margin-top: 40px; padding: 30px; background: white; border-radius: 20px; box-shadow: 0 20px 50px rgba(255, 77, 121, 0.2); border: 2px solid #ffe6ea; opacity: 0; transform: translateY(40px) scale(0.9); transition: all 0.8s ease; max-width: 500px; margin-left:auto; margin-right:auto; display:none;">
                    <h3 style="font-family: 'Dancing Script'; font-size: 3rem; color: #cc0033; margin-bottom: 15px;">You are the best thing in my life ❤️</h3>
                    <p style="font-size: 1.2rem; color: #3a0a14; line-height: 1.6;">This little website is just a small way to show how special you are.</p>
                </div>
            </div>

        </div>
        `;
    },

    // ------------------------------------------
    // 3. THE GALLERY (LOVE BOOTH) 1:1 RATIO FIX
    // ------------------------------------------
    getGalleryHTML: function() {
        return `
        <div style="padding: 20px; text-align:center; padding-bottom: 120px;">
            <h3 style="font-family: 'Dancing Script'; font-size: 35px; color: #cc0033; margin-bottom: 20px;">Love Booth 📸</h3>
            
            <div class="glass-card" style="padding: 20px; border-radius: 20px; max-width: 500px; margin: 0 auto;">
                
                <div style="position: relative; width: 100%; aspect-ratio: 1/1; background: #1a1a1a; border-radius: 15px; overflow: hidden; margin-bottom:15px; border: 5px solid white; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                    <video id="video-preview" autoplay muted style="display:none; width:100%; height:100%; object-fit:cover;"></video>
                    <canvas id="canvas-output" style="display:none; width:100%; height:100%; object-fit:cover;"></canvas>
                    <p id="camera-placeholder" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:white; font-family:'Poppins'; font-size:14px;">Camera inactive.<br>Start or Select Image.</p>
                </div>

                <div style="margin-bottom:15px;">
                    <select id="frame-select" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ff4d79; outline:none; font-family:'Poppins';">
                        <option value="none">No Frame</option>
                        <option value="valentine" selected>Valentine Special ❤️</option>
                        <option value="polaroid-love">Polaroid Love 📸</option>
                        <option value="cute">Cute Frame ✨</option>
                    </select>
                </div>

                <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-bottom:20px;">
                    <button id="btn-start-cam" style="padding:10px 15px; border-radius:8px; border:none; background:#eee; color:#333; font-weight:bold; cursor:pointer;"><i class="fa-solid fa-video"></i> Start</button>
                    <button id="btn-snap" style="padding:10px 15px; border-radius:8px; border:none; background:#cc0033; color:white; font-weight:bold; cursor:pointer;"><i class="fa-solid fa-camera"></i> Snap</button>
                    <button id="btn-save-photo" style="padding:10px 15px; border-radius:8px; border:none; background:#10b981; color:white; font-weight:bold; cursor:pointer;"><i class="fa-solid fa-download"></i> Save</button>
                </div>

                <hr style="border:none; border-top: 1px dashed #ccc; margin-bottom:15px;">
                <p style="font-size:12px; color:#555; margin-bottom:10px;">Or select a memory to edit:</p>
                
                <div id="booth-thumbnails" style="display:flex; gap:10px; justify-content:center; overflow-x:auto; padding-bottom:10px;">
                </div>
            </div>
        </div>
        `;
    },

    // ------------------------------------------
    // 4. THE CHAT COMPONENT (Full Height Fix)
    // ------------------------------------------
    getChatHTML: function() {
        return `
        <div style="padding: 20px; height: 100vh; display:flex; flex-direction:column; padding-bottom: 100px; box-sizing: border-box;">
            
            <div style="flex-shrink: 0;">
                <h2 style="font-family: 'Dancing Script'; font-size: 35px; color: #cc0033; text-align: center; margin-bottom: 5px;">Secret Chat Room <i class="fa-solid fa-lock" style="font-size:18px;"></i></h2>
                <p style="text-align:center; font-size:11px; color:#666; margin-bottom: 15px;">End-to-End Encrypted. Auto-deletes old messages.</p>
            </div>
            
            <div id="chat-messages-area" class="glass-card" style="flex: 1; border-radius: 15px; padding: 15px; overflow-y: auto; margin-bottom: 15px; display:flex; flex-direction:column; gap:10px;">
                <p style="text-align:center; color:#888; font-size:13px; margin-top:50px;">Send a message to start the conversation...</p>
            </div>

            <div class="glass-card" style="padding: 10px; border-radius:30px; display:flex; gap:10px; align-items:center; flex-shrink: 0;">
                <input type="text" id="live-msg-input" placeholder="Type a message..." style="flex:1; padding:12px 15px; border-radius:20px; border:1px solid #ff4d79; outline:none; font-family:'Poppins';">
                <button id="send-msg-btn" style="background: #cc0033; color:white; border:none; width:45px; height:45px; flex-shrink:0; display:flex; align-items:center; justify-content:center; border-radius:50%; font-size:16px; cursor:pointer; box-shadow: 0 4px 10px rgba(204,0,51,0.3);"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
            
            <p id="msg-count-display" style="text-align:center; font-size:11px; color:#888; margin-top:5px; flex-shrink: 0;">Messages: 0 / 100</p>
        </div>
        `;
    },

    // ------------------------------------------
    // 5. THE FOOTER COMPONENT
    // ------------------------------------------
        getFooterHTML: function() {
        return `
        <div id="music-toggle-btn" class="pill-music-player" onclick="window.toggleMusic()" style="position: fixed; bottom: 85px; left: 15px; background: white; border-radius: 50px; padding: 6px 15px 6px 6px; display: none; align-items: center; gap: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); cursor: pointer; z-index: 1000; transition: transform 0.3s;">
            <div id="music-icon-bg" style="width: 35px; height: 35px; background: #2b1b1b; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: 0.3s;">
                <i class="fa-solid fa-play" id="music-icon" style="color: white; font-size: 0.9rem; margin-left: 2px;"></i>
            </div>
            <div style="display: flex; flex-direction: column;">
                <span style="font-family: 'Poppins'; font-weight: 700; font-size: 11px; color: #2b1b1b; line-height: 1.2;">Love Song</span>
                <span id="music-status-text" style="font-family: 'Poppins'; font-size: 9px; color: #888;">Tap to play</span>
            </div>
        </div>

        <div class="glass-card" style="position: fixed; bottom: 10px; left: 50%; transform: translateX(-50%); width: 95%; max-width: 400px; display: flex; justify-content: space-around; padding: 8px 0; border-radius: 30px; z-index: 999; box-shadow: 0 10px 30px rgba(204,0,51,0.2);">
            <button id="nav-surprise" style="background:none; border:none; display:flex; flex-direction:column; align-items:center; color:#cc0033; cursor:pointer; font-family:'Poppins'; width:33%;">
                <i class="fa-solid fa-gift" style="font-size:20px; margin-bottom:4px;"></i>
                <span style="font-size:10px; font-weight:600;">Surprise</span>
            </button>
            <div style="width:1px; background:rgba(204,0,51,0.2); height:25px; align-self:center;"></div>
            <button id="nav-gallery" style="background:none; border:none; display:flex; flex-direction:column; align-items:center; color:#888; cursor:pointer; font-family:'Poppins'; width:33%; transition:0.3s;">
                <i class="fa-solid fa-camera-retro" style="font-size:20px; margin-bottom:4px;"></i>
                <span style="font-size:10px; font-weight:600;">Gallery</span>
            </button>
            <div style="width:1px; background:rgba(204,0,51,0.2); height:25px; align-self:center;"></div>
            <button id="nav-chat" style="background:none; border:none; display:flex; flex-direction:column; align-items:center; color:#888; cursor:pointer; font-family:'Poppins'; width:33%; transition:0.3s;">
                <i class="fa-solid fa-comment-dots" style="font-size:20px; margin-bottom:4px;"></i>
                <span style="font-size:10px; font-weight:600;">Chat</span>
            </button>
        </div>

        <audio id="bg-music" loop>
            <source src="gift.mp3" type="audio/mpeg">
        </audio>

        <canvas id="confetti-canvas" aria-hidden="true" style="display:none; position:fixed; top:0; left:0; pointer-events:none; z-index:99999;"></canvas>
        `;
    }
