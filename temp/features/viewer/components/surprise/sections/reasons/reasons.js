(function() {
    // 👑 PHASED EMOTIONAL DATA STRUCTURE
    const reasonsDB = {
        cute: [
            "I love how you smile at the smallest things. 😊",
            "Your laugh is my absolute favorite sound in the world.",
            "You make even boring days feel incredibly special.",
            "The way your nose scrunches when you laugh.",
            "I love how you get excited about the things you love.",
            "You have the most beautiful eyes I have ever seen. ✨",
            "I love the adorable way you text me.",
            "You look perfect even when you just wake up.",
            "I love your silly jokes and your beautiful smile.",
            "Just seeing your name on my phone makes my day."
        ],
        comfort: [
            "With you, I feel completely safe and at peace. 🕊️",
            "You understand me even when I say absolutely nothing.",
            "Being with you feels exactly like coming home.",
            "I love how comfortable I feel when I'm in your arms.",
            "Your hugs have the power to fix my worst days.",
            "You are my safe place and my biggest adventure.",
            "You accept me exactly for who I am, flaws and all.",
            "You always know exactly how to make me feel special.",
            "Your kindness and beautiful heart amaze me every day.",
            "You are my calm in the middle of life's chaos. 💖"
        ],
        deep: [
            "You changed my life in the most beautiful way possible.",
            "I fall for you a little more every single day. 🌹",
            "I cannot imagine my future without you in it.",
            "You inspire me to be the best version of myself.",
            "Every moment with you feels like a beautiful dream.",
            "You make me believe in true, unconditional love.",
            "I love how we can talk about everything and nothing for hours.",
            "You are the most beautiful part of my entire life.",
            "My love for you grows stronger with every heartbeat.",
            "You are my best friend, my partner, and my whole world."
        ],
        soulmate: [
            "Loving you feels like destiny. We were meant to be. ✨",
            "You are not just my love, you are my forever.",
            "My heart chose you, and it will always choose you.",
            "In this lifetime and the next, I will always find you.",
            "You are the missing piece I searched for my whole life.",
            "I promise to choose you, every single day, forever. 💍",
            "You are my soulmate in every sense of the word.",
            "I love you more than words could ever explain.",
            "Because simply... you are YOU. And I am yours.",
            "Together, we are writing the most beautiful love story. 📖"
        ]
    };

    // Flatten logic array to 100 items for the loop
    let allReasons = [];
    
    // Fill first 20 structured (5 Cute, 5 Comfort, 5 Deep, 5 Soulmate)
    allReasons.push(...reasonsDB.cute.slice(0, 5));
    allReasons.push(...reasonsDB.comfort.slice(0, 5));
    allReasons.push(...reasonsDB.deep.slice(0, 5));
    allReasons.push(...reasonsDB.soulmate.slice(0, 5));

    // Gather remaining to fill up to 100 randomly
    let remaining = [
        ...reasonsDB.cute.slice(5), ...reasonsDB.comfort.slice(5),
        ...reasonsDB.deep.slice(5), ...reasonsDB.soulmate.slice(5)
    ];
    
    // Fill the rest with random remaining, looping if necessary
    for(let i = 20; i < 100; i++) {
        let randomPick = remaining[Math.floor(Math.random() * remaining.length)];
        allReasons.push(randomPick);
    }

    let clickCount = 0;
    let isAnimating = false; 

    const btnNext = document.getElementById('btn-next-reason');
    const textContainer = document.getElementById('reason-text-container');
    const btnWrapper = document.querySelector('.reason-btn-wrapper');
    const counterBadge = document.getElementById('reason-counter-badge');
    
    const clickSound = document.getElementById('reason-click-sound');
    const typeSound = document.getElementById('reason-type-sound');

    if(clickSound) clickSound.volume = 0.5;
    if(typeSound) { typeSound.volume = 0.4; typeSound.loop = true; }

    function spawnButtonHearts() {
        for(let i=0; i<3; i++) {
            const heart = document.createElement('i');
            heart.className = 'fa-solid fa-heart floating-btn-heart';
            heart.style.left = (Math.random() * 80 + 10) + '%';
            heart.style.top = '-10px';
            const duration = Math.random() * 0.4 + 0.6;
            heart.style.animationDuration = duration + 's';
            btnWrapper.appendChild(heart);
            setTimeout(() => heart.remove(), duration * 1000);
        }
    }

    function spawnPremiumSparkles() {
        const card = document.getElementById('reason-card');
        for(let i=0; i<4; i++) { // Reduced to 4 for premium minimalist feel
            const sparkle = document.createElement('div');
            sparkle.className = 'text-magic-sparkle';
            sparkle.innerHTML = '✨';
            sparkle.style.left = '50%';
            sparkle.style.top = '50%';
            sparkle.style.fontSize = (Math.random() * 12 + 10) + 'px';
            sparkle.style.color = '#ffd700';
            
            const tx = (Math.random() - 0.5) * 200 + 'px';
            const ty = (Math.random() - 0.5) * 100 + 'px';
            sparkle.style.setProperty('--tx', tx);
            sparkle.style.setProperty('--ty', ty);
            
            card.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 600);
        }
    }

    // ✍️ SMOOTH EMOJI-SAFE TYPING EFFECT (Fast 1.5s reveal)
    function typeReasonEffect(text) {
        isAnimating = true;
        btnNext.disabled = true;
        textContainer.innerHTML = '<span class="typing-cursor-reason"></span>';
        
        if (typeSound) typeSound.play().catch(()=>{});

        // Emojis ko protect karne ke liye Array.from
        const chars = Array.from(text);
        const cursor = textContainer.querySelector('.typing-cursor-reason');
        
        let i = 0;
        // Total time around ~1.2 seconds regardless of length
        let speed = Math.max(15, 1200 / chars.length); 

        const timer = setInterval(() => {
            if (i < chars.length) {
                const charNode = document.createTextNode(chars[i]);
                textContainer.insertBefore(charNode, cursor);
                i++;
            } else {
                clearInterval(timer);
                if(cursor) cursor.remove();
                if(typeSound) { typeSound.pause(); typeSound.currentTime = 0; }
                
                spawnPremiumSparkles(); // Light sparkle at the exact moment of completion
                
                isAnimating = false;
                btnNext.disabled = false;
            }
        }, speed);
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            if (isAnimating) return;

            // Update Counter
            clickCount++;
            if(clickCount > 100) clickCount = 1; // Loop back just in case
            counterBadge.innerHTML = `Reason ${clickCount} / 100 ❤️`;
            counterBadge.style.transform = 'scale(1.05)';
            setTimeout(() => counterBadge.style.transform = 'scale(1)', 200);

            // Sounds & Haptics
            if (navigator.vibrate) navigator.vibrate(40);
            if (clickSound) { clickSound.currentTime = 0; clickSound.play().catch(()=>{}); }

            spawnButtonHearts();

            // Card Bounce
            const card = document.getElementById('reason-card');
            card.style.transform = 'scale(0.97)';
            setTimeout(() => card.style.transform = 'scale(1)', 150);

            // Get phased reason
            const textToReveal = allReasons[clickCount - 1];

            // Start typing
            typeReasonEffect(textToReveal);
        });
    }
})();
