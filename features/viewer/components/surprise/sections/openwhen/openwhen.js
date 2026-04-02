(function() {
    const state = window.viewerState;
    if (!state || !state.memoryData) return;
    const memoryData = state.memoryData;

    // 1. Dynamic Name Injection
    const gfName = memoryData.girlfriend_name || "Ananya"; 
    document.querySelectorAll('.dynamic-gf-name').forEach(el => { el.innerText = gfName; });

    // Forced Pyare Messages
    const forcedMessages = [
        `"I am so incredibly proud of you! Let's celebrate your beautiful smile!"`,
        `"Close your eyes and remember how tightly I hold you. You are never alone."`,
        `"Imagine me playing with your hair and whispering I love you. Relax your mind."`,
        `"Look up at the moon. We are sharing the exact same view right now."`,
        `"Wrap your arms around yourself and squeeze tight. That is a big, warm hug from me! ❤️"`
    ];

    for(let i = 1; i <= 5; i++) {
        const msgEl = document.getElementById(`ow-msg-${i}`);
        if(msgEl) msgEl.innerText = forcedMessages[i-1];
    }

    // Local Sounds
    const scratchSound = document.getElementById('sound-scratch-card');
    const revealSound = document.getElementById('sound-reveal-card');
    const clickSound = document.getElementById('sound-click-card');

    // Load Logo First
    const logoImg = new Image();
    logoImg.src = 'assets/image/logo.png';
    
    // 2. Google Pay Style Scratch Engine
    function setupMagicalCard(index, logo) {
        const canvas = document.getElementById(`canvas-ow-${index}`);
        const wrapper = document.getElementById(`ow-wrapper-${index}`);
        if(!canvas || !wrapper) return;
        
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const width = 480;
        const height = 270;
        canvas.width = width;
        canvas.height = height;

        // Premium Pink Gradient
        let gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#FF6699"); 
        gradient.addColorStop(0.5, "#FF8DA1"); 
        gradient.addColorStop(1, "#FFB6C1"); 
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Draw Floating Small Textures
        const icons = ['❤️', '✨', '🌸', '💖', '⭐'];
        ctx.save();
        ctx.globalAlpha = 0.15; 
        for(let j=0; j<18; j++) {
            let icon = icons[Math.floor(Math.random() * icons.length)];
            let x = Math.random() * width;
            let y = Math.random() * height;
            ctx.font = `${Math.random() * 20 + 10}px 'Arial'`; 
            ctx.fillText(icon, x, y);
        }
        ctx.restore();

        // Logo Visualization
        if (logo && logo.complete && logo.naturalWidth !== 0) {
            ctx.save();
            ctx.globalAlpha = 0.22; 
            
            let logoWidth = 200; 
            let logoHeight = (logo.height / logo.width) * logoWidth;
            
            let xPos = (width - logoWidth) / 2;
            let yPos = (height - logoHeight) / 2;
            
            ctx.drawImage(logo, xPos, yPos - 10, logoWidth, logoHeight); 
            ctx.restore();
        }

        // Foreground Text
        ctx.font = "bold 24px 'Poppins'";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 2;
        ctx.fillText("Scratch me ✨", width / 2, height / 2 + 15);
        ctx.shadowBlur = 0; // Reset shadow

        let isDrawing = false;
        let isRevealed = false;
        let scratchStrokes = 0; 
        wrapper.dataset.readyToFlip = "false"; 

        function getMousePos(e) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) * (canvas.width / rect.width),
                y: (clientY - rect.top) * (canvas.height / rect.height)
            };
        }

        function startDrawing(e) {
            if(isRevealed) return;
            isDrawing = true;
            scratch(e);
            
            if (scratchSound) {
                if (index === 1 && scratchSound.paused) {
                    scratchSound.currentTime = 0;
                    scratchSound.play().catch(e => console.log(e));
                } else {
                    scratchSound.currentTime = 0;
                    scratchSound.play().catch(e=>{});
                }
            }
        }

        function stopDrawing() {
            isDrawing = false;
            if (scratchSound) scratchSound.pause();
        }

        function scratch(e) {
            if (!isDrawing || isRevealed) return;
            e.preventDefault(); 

            const pos = getMousePos(e);
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.lineWidth = 50; 
            
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(pos.x + 1, pos.y + 1); 
            ctx.stroke();

            scratchStrokes++;

            // Reveal Auto-Pop Logic
            if (scratchStrokes > 45 && !isRevealed) {
                isRevealed = true;
                stopDrawing();
                
                canvas.classList.add('revealed');
                
                if (revealSound) {
                    revealSound.currentTime = 0;
                    revealSound.play().catch(e=>{});
                }
                
                wrapper.dataset.readyToFlip = "true";
            }
        }

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', scratch);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);
        canvas.addEventListener('touchstart', startDrawing, {passive: false});
        canvas.addEventListener('touchmove', scratch, {passive: false});
        canvas.addEventListener('touchend', stopDrawing);

        // Click to Flip Logic
        wrapper.addEventListener('click', () => {
            if (wrapper.dataset.readyToFlip === "true") {
                if(clickSound) {
                    clickSound.currentTime = 0;
                    clickSound.play().catch(e => console.log(e));
                }
                
                if(navigator.vibrate) navigator.vibrate(40); 
                wrapper.classList.toggle('flipped');
            }
        });
    }

    // Logo load hone ka wait karo
    logoImg.onload = () => {
        setTimeout(() => { for(let i=1; i<=5; i++) { setupMagicalCard(i, logoImg); } }, 200);
    };
    
    // Fallback if logo fails
    logoImg.onerror = () => {
        setTimeout(() => { for(let i=1; i<=5; i++) { setupMagicalCard(i, null); } }, 200);
    };

    // ==========================================
    // 🔴 NEW: BINA BLINK WALA SMOOTH SCROLL REVEAL
    // ==========================================
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Thoda delay add kiya hai taaki ek-ek karke cards aayein
                setTimeout(() => {
                    entry.target.classList.add('ow-show');
                }, index * 150);
                
                observer.unobserve(entry.target); 
            }
        });
    }, {
        threshold: 0.1, // Jaise hi card 10% dikhega, animation chalu ho jayega
        rootMargin: "0px 0px -50px 0px" // thoda pehle hi trigger karega
    });

    // Sabhi cards ko observe karna start karo
    document.querySelectorAll('.ow-card-wrapper').forEach((card) => {
        observer.observe(card);
    });

})();
