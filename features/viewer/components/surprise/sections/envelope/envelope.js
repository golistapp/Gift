(function() {
    const state = window.viewerState;
    if (!state || !state.memoryData) return;

    const envelope = document.getElementById('envelope');
    const instructions = document.getElementById('env-instructions');
    const notesSection = document.getElementById('love-notes-section');
    const letterContainer = document.getElementById('dynamic-letter-container');
    const signature = document.getElementById('letter-sig');
    
    const envClickSound = document.getElementById('env-click-sound');
    if (envClickSound) {
        envClickSound.volume = 0.5;
    }
    
    let typingActive = false; 
    let petalInterval; 

    const typingSound = new Audio('assets/audio/pen.mp3'); 
    typingSound.loop = true; 
    typingSound.volume = 0.5;

    const envCardImg = document.getElementById('envelope-dynamic-card');
    if (envCardImg && state.memoryData.occasion) {
        const occasionLower = state.memoryData.occasion.toLowerCase();
        if (occasionLower.includes("birthday")) envCardImg.src = "assets/image/happy birthday.jpg";
        else if (occasionLower.includes("anniversary")) envCardImg.src = "assets/image/happy anniversary.jpg";
        else if (occasionLower.includes("love") || occasionLower.includes("valentine")) envCardImg.src = "assets/image/I love you.jpg";
        else envCardImg.src = "assets/image/you are happy.jpg";
    }

    function fireMagicDust(parentEl) {
        const symbols = ['✨', '💖', '🌟', '❤️'];
        for(let i = 0; i < 20; i++) {
            let dust = document.createElement('div');
            dust.className = 'magic-dust';
            dust.innerText = symbols[Math.floor(Math.random() * symbols.length)];
            
            dust.style.position = 'absolute';
            dust.style.left = '50%'; 
            dust.style.top = '50%';
            dust.style.pointerEvents = 'none';
            dust.style.zIndex = '50';
            
            const tx = (Math.random() - 0.5) * 300; 
            const ty = (Math.random() - 0.5) * 300 - 50; 
            dust.style.setProperty('--tx', `${tx}px`);
            dust.style.setProperty('--ty', `${ty}px`);
            parentEl.appendChild(dust);
            
            setTimeout(() => dust.remove(), 1200);
        }
    }

    function startFallingPetals() {
        petalInterval = setInterval(() => {
            const petal = document.createElement('div');
            petal.className = 'css-petal';
            petal.style.left = Math.random() * 100 + 'vw';
            
            const duration = Math.random() * 4 + 5; 
            petal.style.animationDuration = duration + 's';
            
            const colors = ['#ff4d79', '#cc0033', '#e60039', '#ffb3c6'];
            petal.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            const size = Math.random() * 12 + 10;
            petal.style.width = size + 'px';
            petal.style.height = size + 'px';
            
            document.body.appendChild(petal);
            setTimeout(() => { if (petal.parentNode) petal.remove(); }, duration * 1000);
        }, 900); 
    }

    function stopFallingPetals() {
        clearInterval(petalInterval);
    }

    async function typeWriterEffect(lines) {
        letterContainer.innerHTML = '';
        signature.style.opacity = '0';
        
        typingSound.play().catch(e => console.log("Typing sound blocked", e));

        for (let i = 0; i < lines.length; i++) {
            if (!typingActive) break; 
            if (lines[i].trim() === "") continue;
            
            const p = document.createElement('p');
            p.className = 'letter-line';
            letterContainer.appendChild(p);
            
            p.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            await typeLine(lines[i], p);
        }
        
        if (typingActive) {
            stopFallingPetals(); 
            
            typingSound.pause();
            typingSound.currentTime = 0;

            setTimeout(() => { 
                signature.scrollIntoView({ behavior: 'smooth', block: 'center' });
                signature.style.opacity = '1'; 
            }, 500); 
        }
    }

    // 🔴 NEW UPDATE: typeLine function ko update kiya gaya taaki emojis detect karke chhota kar sake
    function typeLine(text, element) {
        return new Promise(resolve => {
            let i = 0;
            element.innerHTML = '<span class="typing-cursor-letter"></span>';
            const cursor = element.querySelector('.typing-cursor-letter');
            
            const chars = Array.from(text); 
            // Regular Expression to detect emojis
            const emojiRegex = /[\p{Extended_Pictographic}]/u; 
            
            const timer = setInterval(() => {
                if (!typingActive) {
                    clearInterval(timer);
                    resolve();
                    return;
                }
                if (i < chars.length) {
                    let charNode;
                    
                    // 🔴 Check if the character is an emoji
                    if (emojiRegex.test(chars[i])) {
                        charNode = document.createElement('span');
                        charNode.className = 'small-emoji';
                        charNode.innerText = chars[i];
                    } else {
                        charNode = document.createTextNode(chars[i]);
                    }

                    element.insertBefore(charNode, cursor);
                    i++;
                } else {
                    clearInterval(timer);
                    if (cursor) cursor.remove(); 
                    setTimeout(resolve, 300); 
                }
            }, 55); 
        });
    }

    if (envelope) {
        envelope.addEventListener('click', function() {
            
            if (envClickSound) {
                envClickSound.currentTime = 0;
                envClickSound.play().catch(e => console.log(e));
            }
            
            const isOpen = this.classList.contains('open');

            if (!isOpen) {
                this.classList.add('open');
                if (instructions) instructions.innerText = "Tap again to close 💌";

                fireMagicDust(this); 
                typingActive = true; 
                startFallingPetals(); 

                const bgMusic = document.getElementById('bg-music');
                if (bgMusic && bgMusic.paused) {
                    bgMusic.volume = 0.05; 
                    bgMusic.play().then(() => {
                        state.isMusicPlaying = true;
                        document.dispatchEvent(new Event('musicStarted'));
                    }).catch(e => console.log(e));
                }
                              
                setTimeout(() => {
                    document.getElementById('surprise-gallery-mount').classList.remove('hidden');
                    document.getElementById('surprise-reasons-mount').classList.remove('hidden'); 
                    document.getElementById('surprise-openwhen-mount').classList.remove('hidden'); 
                    document.getElementById('surprise-proposal-mount').classList.remove('hidden');
                    document.getElementById('surprise-gift-mount').classList.remove('hidden');
                    document.getElementById('surprise-futureplans-mount').classList.remove('hidden');
                    
                    setTimeout(() => {
                        if (!typingActive) return;

                        notesSection.style.display = 'flex';
                        setTimeout(() => { notesSection.style.opacity = '1'; }, 50);

                        const lines = (state.memoryData.message_text || "I love you.").split('\n');
                        typeWriterEffect(lines);

                    }, 1200); 

                }, 800); 

            } else {
                this.classList.remove('open');
                if (instructions) instructions.innerText = "Tap to open my heart 💌";
                
                typingActive = false; 
                stopFallingPetals(); 
                
                typingSound.pause();
                typingSound.currentTime = 0;

                notesSection.style.opacity = '0';
                setTimeout(() => { 
                    notesSection.style.display = 'none'; 
                    letterContainer.innerHTML = ''; 
                    signature.style.opacity = '0';
                }, 800);
            }
        });
    }
})();
