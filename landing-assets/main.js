document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // UTILITIES
    // ==========================================
    const throttle = (func, limit) => {
        let inThrottle;
        return function (...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

       // ==========================================
    // 1. SCROLL SYSTEM (Navbar & Progress)
    // ==========================================
    const initScrollSystem = () => {
        const navbar = document.getElementById('navbar');
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.navbar__link');

        if (!navbar && sections.length === 0) return;

        // Create Progress Bar
        const progressBar = document.createElement('div');

        // 🔴 FIX 1: Position 'absolute' karke isko seedha Navbar ke andar daal diya hai
        progressBar.style.cssText = `
            position: absolute; top: 0; left: 0; height: 3px; 
            background: var(--primary); width: 0%; z-index: 9999; 
            transition: width 0.1s ease-out; pointer-events: none;
            box-shadow: 0 0 10px var(--primary-glow);
        `;

        // Navbar ke andar progress bar ko fit karo
        if (navbar) {
            navbar.appendChild(progressBar);
        } else {
            progressBar.style.position = 'fixed';
            document.body.appendChild(progressBar);
        }

        const onScroll = throttle(() => {
            const scrollY = Math.max(0, window.scrollY); 

            // 🔴 FIX 2: Mobile address bar hide/show hone se calculation kharab na ho, isliye clientHeight use kiya hai
            const docHeight = Math.max(1, document.documentElement.scrollHeight - document.documentElement.clientHeight); 

            // Update Progress Bar
            let progress = (scrollY / docHeight) * 100;
            progress = Math.min(100, Math.max(0, progress)); 

            progressBar.style.width = `${progress}%`;

            // Toggle Navbar Blur
            if (navbar) {
                if (scrollY > 50) navbar.classList.add('scrolled');
                else navbar.classList.remove('scrolled');
            }

            // Update Active Nav Link
            let currentSectionId = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 150; 
                if (scrollY >= sectionTop) {
                    currentSectionId = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentSectionId}`) {
                    link.classList.add('active');
                    link.style.color = 'var(--text-main)';
                } else {
                    link.style.color = ''; 
                }
            });
        }, 50);

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // Init on load
    };


    // ==========================================
    // 2. SMOOTH SCROLL NAVIGATION
    // ==========================================
    const initSmoothScroll = () => {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');

        anchorLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href').substring(1);
                if (!targetId) return; // Skip empty anchors

                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    e.preventDefault();
                    const navHeight = document.getElementById('navbar')?.offsetHeight || 80;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navHeight - 20;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    };

    // ==========================================
    // 3. TYPING EFFECT (Hero Section)
    // ==========================================
    const initTypingEffect = () => {
        const textElement = document.querySelector('.hero__story');
        if (!textElement) return;

        const originalText = textElement.textContent.trim();
        textElement.textContent = '';
        textElement.style.borderRight = '2px solid var(--primary)';
        textElement.style.paddingRight = '5px';
        textElement.style.whiteSpace = 'pre-wrap';

        let charIndex = 0;
        let isCursorBlinking = false;

        // Cursor Blink Animation
        const cursorStyle = document.createElement('style');
        cursorStyle.textContent = `@keyframes blinkCursor { 50% { border-color: transparent; } }`;
        document.head.appendChild(cursorStyle);

        const typeWriter = () => {
            if (charIndex < originalText.length) {
                textElement.textContent += originalText.charAt(charIndex);
                charIndex++;
                setTimeout(typeWriter, 40); // Typing speed
            } else {
                // Done typing, start blinking
                if (!isCursorBlinking) {
                    textElement.style.animation = 'blinkCursor 0.8s infinite step-end';
                    isCursorBlinking = true;

                    // Remove cursor after a few seconds
                    setTimeout(() => {
                        textElement.style.borderRight = 'none';
                        textElement.style.animation = 'none';
                    }, 3000);
                }
            }
        };

        // Start delay
        setTimeout(typeWriter, 600);
    };

    // ==========================================
    // 4. REVEAL ON SCROLL (Intersection Observer)
    // ==========================================
    const initRevealAnimations = () => {
        const elementsToReveal = document.querySelectorAll('.feature-card, .use-case-card, .statement-block, .testimonial-card, .mobile-mockup, .experience-reveal');
        if (elementsToReveal.length === 0) return;

        // Base styles for reveal
        const style = document.createElement('style');
        style.textContent = `
            .js-reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
            .js-reveal.is-visible { opacity: 1; transform: translateY(0); }
        `;
        document.head.appendChild(style);

        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -10% 0px',
            threshold: 0.1
        };

        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // Run once
                }
            });
        }, observerOptions);

        elementsToReveal.forEach((el, index) => {
            el.classList.add('js-reveal');
            // Slight stagger for sibling elements
            el.style.transitionDelay = `${(index % 4) * 0.1}s`;
            revealObserver.observe(el);
        });
    };

    // ==========================================
    // 5. MODAL SYSTEM
    // ==========================================
    const initModalSystem = () => {
        // Build Modal structure
        const modalHTML = `
            <div id="demo-modal" class="modal-overlay" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
                display: flex; align-items: center; justify-content: center;
                opacity: 0; visibility: hidden; transition: all 0.3s ease; z-index: 2000;
            ">
                <div class="modal-content" style="
                    background: var(--bg-secondary); padding: 40px; border-radius: 20px;
                    border: 1px solid var(--glass-border); max-width: 500px; width: 90%;
                    transform: scale(0.95); transition: transform 0.3s ease; text-align: center; position: relative;
                ">
                    <button class="modal-close" aria-label="Close Modal" style="
                        position: absolute; top: 16px; right: 20px; font-size: 28px;
                        background: none; border: none; color: var(--text-muted); cursor: pointer; line-height: 1;
                    ">&times;</button>
                    <h3 style="margin-bottom:16px; font-size: 1.5rem; color: #fff;">Interactive Preview</h3>
                    <p style="color: var(--text-muted); margin-bottom: 32px;">Experience the emotional journey of a GiftoraX surprise exactly as they will see it.</p>
                    <a href="#create" class="btn btn--primary" style="width: 100%;">Start Demo Experience</a>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('demo-modal');
        const modalContent = modal.querySelector('.modal-content');
        const closeBtn = modal.querySelector('.modal-close');

        // Triggers
        const demoTriggers = document.querySelectorAll('a[href="#demo"], .btn--preview');

        const openModal = (e) => {
            if (e) e.preventDefault();
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            modalContent.style.transform = 'scale(1)';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        };

        const closeModal = () => {
            modal.style.opacity = '0';
            modalContent.style.transform = 'scale(0.95)';
            setTimeout(() => {
                modal.style.visibility = 'hidden';
                document.body.style.overflow = '';
            }, 300);
        };

        // Attach Events
        demoTriggers.forEach(btn => btn.addEventListener('click', openModal));
        closeBtn.addEventListener('click', closeModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.visibility === 'visible') {
                closeModal();
            }
        });
    };

    // ==========================================
    // 6. PERSONALIZATION BADGE (URL Params)
    // ==========================================
    const initPersonalization = () => {
        const badge = document.querySelector('.navbar__badge');
        if (!badge) return;

        try {
            const params = new URLSearchParams(window.location.search);
            const toParam = params.get('to');

            if (toParam) {
                // Basic sanitization: alphanumeric and spaces only, max 15 chars
                const cleanName = toParam.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 15).trim();

                if (cleanName.length > 0) {
                    badge.textContent = `Made for ${cleanName} ❤️`;
                    badge.style.display = 'inline-block';
                    badge.setAttribute('aria-hidden', 'false');
                }
            }
        } catch (e) {
            console.warn("Could not parse URL parameters");
        }
    };

    // ==========================================
    // 7. CONFETTI EFFECT (Performance Optimized)
    // ==========================================
    const triggerConfetti = () => {
        const canvas = document.createElement('canvas');
        canvas.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999;`;
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d', { alpha: true });
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#ff4da6', '#9d4edd', '#ffffff', '#ffd1e8'];
        const particleCount = Math.min(window.innerWidth / 10, 80); // Responsive amount

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2 + 50,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 1) * 15 - 5,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rs: (Math.random() - 0.5) * 10 // rotation speed
            });
        }

        let animationFrame;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let hasActiveParticles = false;

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.4; // Gravity
                p.rotation += p.rs;

                if (p.y < canvas.height + p.size) {
                    hasActiveParticles = true;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = Math.max(0, 1 - (p.y / canvas.height)); // Fade out near bottom
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    ctx.restore();
                }
            });

            if (hasActiveParticles) {
                animationFrame = requestAnimationFrame(render);
            } else {
                // Cleanup
                cancelAnimationFrame(animationFrame);
                if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
            }
        };

        requestAnimationFrame(render);
    };

        // Attach Confetti to Final CTA (Direct Link System)
    const initActionButtons = () => {
        const ctaButtons = document.querySelectorAll('.btn--massive');

        ctaButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Click karte hi thoda confetti nikalega, aur link apna kaam karke page change kar dega
                triggerConfetti(); 
            });
        });
    };

    // INITIALIZATION
    // ==========================================
    initScrollSystem();
    initSmoothScroll();
    initTypingEffect();
    initRevealAnimations();   
    initPersonalization();
    initActionButtons();

     // ==========================================
    // 10. PUBLIC REVIEWS (PREMIUM EMOTIONAL FEED)
    // ==========================================
    const initPublicReviews = async () => {
        const reviewsGrid = document.getElementById('reviews-grid');
        if (!reviewsGrid) return;

        let allReviews = [];

        // Helper: Convert ISO Date to Human Readable "Time Ago"
        const timeAgo = (dateString) => {
            if (!dateString) return "Recently";
            const date = new Date(dateString);
            const seconds = Math.floor((new Date() - date) / 1000);
            let interval = seconds / 86400;
            if (interval > 1) return Math.floor(interval) === 1 ? "Yesterday" : Math.floor(interval) + " days ago";
            interval = seconds / 3600;
            if (interval > 1) return Math.floor(interval) + " hours ago";
            interval = seconds / 60;
            if (interval > 1) return Math.floor(interval) + " mins ago";
            return "Just now";
        };

        const renderReviews = () => {
            reviewsGrid.innerHTML = ''; 

            allReviews.forEach((rev, index) => {
                const ratingNum = parseInt(rev.rating) || 5;
                const starsHTML = '⭐'.repeat(ratingNum) + '<span style="opacity:0.2">⭐</span>'.repeat(5 - ratingNum);
                const timeAgoStr = timeAgo(rev.date);

                // 🧠 Auto-Logic: Top Emotion Tag
                let topTag = "💭 A meaningful moment";
                const msgLower = (rev.message || "").toLowerCase();
                const occ = rev.occasion || "";

                if (occ === "Anniversary") topTag = "💑 Anniversary Surprise";
                else if (occ === "Birthday") topTag = "🎂 Birthday Magic";
                else if (msgLower.includes('love') || msgLower.includes('cry') || msgLower.includes('tears')) topTag = "❤️ Felt deeply";
                else if (ratingNum >= 4) topTag = "😍 Made them feel special";

                // 🧠 Auto-Logic: Emotional Context Line
                let contextLine = "A beautiful memory created... 💫";
                if (occ === "Anniversary") contextLine = "Sent this on their anniversary… and this was the reaction ❤️";
                else if (occ === "Birthday") contextLine = "A birthday surprise that turned into a core memory 🎂";
                else if (msgLower.includes('sorry') || msgLower.includes('forgive')) contextLine = "Sometimes an apology needs a little magic 🥺";
                else if (ratingNum === 5) contextLine = "A small surprise… but a massive emotional reaction ✨";

                const card = document.createElement('div');
                card.className = 'review-card js-reveal';
                card.style.transitionDelay = `${index * 0.1}s`; // Staggered entry animation

                // Future Ready: Agar future mein rev.image aati hai toh wo show ho jayegi
                const imageHTML = rev.image ? `<img src="${rev.image}" style="width: 100%; border-radius: 12px; margin-top: 15px; border: 1px solid rgba(255,255,255,0.1); object-fit: cover; max-height: 150px;">` : '';

                card.innerHTML = `
                    <div class="review-top-tag">${topTag}</div>
                    <div class="review-card__header">
                        <div>
                            <div class="review-card__stars">${starsHTML}</div>
                            <div style="font-size: 0.8rem; color: #ffb5c8; margin-top: 6px; font-weight: 500;">Felt everything ❤️</div>
                        </div>
                        <div class="review-card__time">${timeAgoStr}</div>
                    </div>
                    <div class="review-context-line">${contextLine}</div>
                    <blockquote class="review-card__quote">
                        <p class="review-card__text">"${rev.message}"</p>
                        ${imageHTML}
                    </blockquote>
                    <div class="review-card__footer">
                        <div>
                            <span class="author-name" style="display:block; font-weight:600; color:#fff; font-size:1.1rem;">— ${rev.name}</span>
                            <span style="font-size: 0.8rem; color: #cbd5e1; background: rgba(255,255,255,0.1); padding: 3px 10px; border-radius: 12px; display:inline-block; margin-top:8px;">${occ || 'Special Moment'}</span>
                        </div>
                        <div style="font-size:0.8rem; color:#ff4da6; display:flex; align-items:center; gap:5px; font-weight:600; background: rgba(255, 77, 166, 0.1); padding: 5px 12px; border-radius: 20px; border: 1px solid rgba(255,77,166,0.2);">
                            <i class="fa-solid fa-heart-circle-check"></i> Emotion Verified
                        </div>
                    </div>
                `;
                reviewsGrid.appendChild(card);
                setTimeout(() => card.classList.add('is-visible'), 100);
            });

            // Swipe For More End Card
            if (allReviews.length > 2) {
                const endCard = document.createElement('div');
                endCard.className = 'review-card js-reveal is-visible';
                endCard.style.cssText = 'min-width: 200px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; box-shadow: none; backdrop-filter: none;';
                endCard.innerHTML = `<div style="text-align: center; color: var(--gold-primary); opacity: 0.8;"><i class="fa-solid fa-arrow-right-long" style="font-size: 2.5rem; margin-bottom: 10px; animation: pulse 2s infinite;"></i><br><span style="font-weight: 500; font-size: 1.1rem;">Swipe for more ❤️</span></div>`;
                reviewsGrid.appendChild(endCard);
            }
        };

        try {
            reviewsGrid.innerHTML = '<p style="width: 100%; text-align: center; color: var(--text-muted); font-size: 1.1rem; padding: 40px 0;">Loading experiences... <i class="fa-solid fa-spinner fa-spin" style="color: var(--primary);"></i></p>';

            const res = await fetch('https://gift-32f5c-default-rtdb.asia-southeast1.firebasedatabase.app/public_reviews.json');
            const data = await res.json();

            if (data && !data.error) {
                Object.keys(data).forEach(key => {
                    const rev = data[key];
                    if (rev.status === 'approved') allReviews.push(rev);
                });

                // Sort by Latest Date First
                allReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                if (allReviews.length > 0) {
                    renderReviews(); 
                } else {
                    reviewsGrid.innerHTML = '<p style="width: 100%; text-align: center; color: var(--text-muted); padding: 40px 0;">Be the first to create a magical moment!</p>';
                }
            }
        } catch (e) {
            reviewsGrid.innerHTML = '<p style="width: 100%; text-align: center; color: #ef4444; padding: 40px 0;">Could not load experiences at this moment.</p>';
        }

        // 🖱️ Desktop Drag-to-Scroll Logic (Instagram Style)
        let isDown = false;
        let startX;
        let scrollLeft;

        reviewsGrid.addEventListener('mousedown', (e) => {
            isDown = true;
            reviewsGrid.style.cursor = 'grabbing';
            startX = e.pageX - reviewsGrid.offsetLeft;
            scrollLeft = reviewsGrid.scrollLeft;
        });
        reviewsGrid.addEventListener('mouseleave', () => { isDown = false; reviewsGrid.style.cursor = 'grab'; });
        reviewsGrid.addEventListener('mouseup', () => { isDown = false; reviewsGrid.style.cursor = 'grab'; });
        reviewsGrid.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - reviewsGrid.offsetLeft;
            const walk = (x - startX) * 2; // Scroll Speed
            reviewsGrid.scrollLeft = scrollLeft - walk;
        });
    };

    initPublicReviews(); // Functio Call


    // ==========================================
    // 8. LIVE DEMO (BOT + FULL SCREEN PREVIEW)
    // ==========================================
    const initLiveDemo = () => {
        const demoBtn = document.getElementById('start-live-demo-btn');
        const overlay = document.getElementById('demo-overlay');
        const iframe = document.getElementById('live-demo-frame');

        // Full Screen Elements
        const expandBtn = document.getElementById('expand-demo-btn');
        const fsModal = document.getElementById('fullscreen-demo-modal');
        const closeFsBtn = document.getElementById('close-fs-demo-btn');
        const fsIframeContainer = document.getElementById('fs-iframe-container');
        const originalIframeParent = document.getElementById('demo-iframe-container'); 

        if (demoBtn && overlay && iframe) {
            demoBtn.addEventListener('click', () => {
                demoBtn.innerHTML = 'Unlocking Magic... <i class="fa-solid fa-spinner fa-spin"></i>';
                demoBtn.style.opacity = '0.7';

                const demoGiftData = {
                    status: "locked", is_enabled: true, occasion: "A Special Surprise", girlfriend_name: "Priya",
                    message_text: "Hi Priya ❤️,\n\nI made this special digital space just for you. Every moment with you is a beautiful dream come true. You are my everything!",
                    image_1_url: "assets/image/album1.1.jpg", caption_1: "Sweet Memory",
                    image_2_url: "assets/image/album2.jpg", caption_2: "Cutie Pie 🥰",
                    image_3_url: "assets/image/album3.jpg", caption_3: "Golden Moments",
                    image_4_url: "assets/image/album4.jpg", caption_4: "Precious ❤️",
                    image_5_url: "assets/image/album5.jpg", caption_5: "Unforgettable"
                };

                localStorage.setItem('gx_preview_data', JSON.stringify(demoGiftData));
                iframe.src = 'portal.html?mode=preview';

                iframe.onload = () => {
                    try {
                        const doc = iframe.contentDocument || iframe.contentWindow.document;
                        const style = doc.createElement('style');
                        style.innerHTML = '.native-chat-header { z-index: 2000 !important; }';
                        doc.head.appendChild(style);

                        const botScript = doc.createElement('script');
                        botScript.innerHTML = `
                            const checkChat = setInterval(() => {
                                const sendBtn = document.getElementById('send-msg-btn');
                                const inputEl = document.getElementById('live-msg-input');

                                if (sendBtn && inputEl && window.viewerState) {
                                    clearInterval(checkChat); 

                                    let lastTypedText = "";
                                    let sequenceTriggered = false; 

                                    inputEl.addEventListener('input', (e) => { 
                                        lastTypedText = e.target.value.trim(); 
                                    });

                                    const triggerBot = () => {
                                        const userTextOriginal = lastTypedText;
                                        const userText = userTextOriginal.toLowerCase();
                                        if(!userText) return;
                                        lastTypedText = ""; 

                                        setTimeout(() => {
                                            fetch('https://gift-32f5c-default-rtdb.asia-southeast1.firebasedatabase.app/memories/PREVIEW_MODE/bf_status.json', {
                                                method: 'PUT', body: JSON.stringify('typing...')
                                            });

                                            setTimeout(() => {
                                                let botReply = "";
                                                let isMatched = false;

                                               if (userText.match(/hi|hello|hey|hii|hy/)) botReply = "Hii my love! Kaisa raha din? 💖";
                                                else if (userText.match(/morning|good morning/)) botReply = "Good morning! Aaj ka din sirf tumhare liye special ho ✨❤️";
                                                else if (userText.match(/night|good night/)) botReply = "Good night babu! Sapno mein milte hain 🌙❤️";
                                                else if (userText.match(/love|luv u|i love you/)) botReply = "I love you more than you can imagine 💖🌹";
                                                else if (userText.match(/miss|missing you/)) botReply = "I miss you sooo much 🥺❤️ Jaldi milo na...";
                                                else if (userText.match(/kaise ho|how are you|kya haal/)) botReply = "Main theek hu... par tumhare bina thoda incomplete lagta hai ❤️";
                                                else if (userText.match(/kya kar rahe|doing|kya kar rahe ho/)) botReply = "Bas tumhare baare mein soch raha tha 🥰";
                                                else if (userText.match(/khana|khaya|eat/)) botReply = "Tumne khana khaya? Apna khayal rakho na ❤️";
                                                else if (userText.match(/sad|cry|rona|dukhi/)) botReply = "Aww mera babu udaas hai? Aao hug de doon 🥺🤗";
                                                else if (userText.match(/angry|gussa/)) botReply = "Gussa mat ho na... tum haste hue zyada cute lagte ho 😘";
                                                else if (userText.match(/kiss|hug/)) botReply = "Yeh lo ek tight hug aur ek pyara sa kiss 😘🤗";
                                                else if (userText.match(/yaad|remember/)) botReply = "Tumhari har choti baat yaad hai mujhe ❤️";
                                                else if (userText.match(/busy|kaam/)) botReply = "Busy ho kya? Thoda sa time mujhe bhi de do na 🥺❤️";
                                                else if (userText.match(/bored|boring/)) botReply = "Chalo kuch fun karte hain... ek surprise hai tumhare liye 😉🎁";
                                                else if (userText.match(/thank/)) botReply = "Tumhare liye to kuch bhi ❤️";
                                                else if (userText.match(/sorry/)) botReply = "Sorry kis baat ka... tum ho hi itne cute 😘";
                                                else if (userText.match(/acha|hmm/)) botReply = "Itna short reply? Mujhe ignore kar rahe ho kya 😏❤️";
                                                else if (userText.match(/kya|kyun|why/)) botReply = "Kuch nahi... bas tumhari yaadon mein kho gaya tha ❤️";

                                                if(!isMatched) {
                                                    let shortQuote = userTextOriginal.length > 30 ? userTextOriginal.substring(0, 30) + "..." : userTextOriginal;
                                                    const fallbacks = [
                                                        "Aww, you're the sweetest! 🥰",
                                                        "Hehe, I love talking to you ❤️",
                                                        "Tumhari baatein hamesha kitni cute hoti hain ✨",
                                                        "You always know how to make me smile 😘"
                                                    ];
                                                    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
                                                    botReply = \`[QUOTE]\${shortQuote}[/QUOTE] \${randomFallback}\`;
                                                }

                                                const encryptedMsg1 = CryptoJS.AES.encrypt(botReply, window.viewerState.userPasscode || '').toString();

                                                fetch('https://gift-32f5c-default-rtdb.asia-southeast1.firebasedatabase.app/memories/PREVIEW_MODE/chat.json', {
                                                    method: 'POST', body: JSON.stringify({ sender: 'bf', text: encryptedMsg1, timestamp: new Date().toISOString() })
                                                }).then(() => {
                                                    fetch('https://gift-32f5c-default-rtdb.asia-southeast1.firebasedatabase.app/memories/PREVIEW_MODE/bf_status.json', {
                                                        method: 'PUT', body: JSON.stringify('online')
                                                    });

                                                    if (!sequenceTriggered) {
                                                        sequenceTriggered = true; 

                                                        setTimeout(() => {
                                                            fetch('https://gift-32f5c-default-rtdb.asia-southeast1.firebasedatabase.app/memories/PREVIEW_MODE/bf_status.json', {
                                                                method: 'PUT', body: JSON.stringify('typing...')
                                                            });

                                                            setTimeout(() => {
                                                                const msg2 = "Waise... maine tumhare liye kuch banaya hai ❤️";
                                                                const encryptedMsg2 = CryptoJS.AES.encrypt(msg2, window.viewerState.userPasscode || '').toString();

                                                                fetch('https://gift-32f5c-default-rtdb.asia-southeast1.firebasedatabase.app/memories/PREVIEW_MODE/chat.json', {
                                                                    method: 'POST', body: JSON.stringify({ sender: 'bf', text: encryptedMsg2, timestamp: new Date().toISOString() })
                                                                }).then(() => {
                                                                    fetch('https://gift-32f5c-default-rtdb.asia-southeast1.firebasedatabase.app/memories/PREVIEW_MODE/bf_status.json', {
                                                                        method: 'PUT', body: JSON.stringify('online')
                                                                    });

                                                                    setTimeout(() => {
                                                                        fetch('https://gift-32f5c-default-rtdb.asia-southeast1.firebasedatabase.app/memories/PREVIEW_MODE/bf_status.json', {
                                                                            method: 'PUT', body: JSON.stringify('typing...')
                                                                        });

                                                                        setTimeout(() => {
                                                                            const msg3 = "Dekhna hai? Yahan click karo 👉 <br><br> <a href='lead-form.html' target='_parent' style='background: linear-gradient(135deg, #ff4d79, #cc0033); color: white; padding: 8px 16px; border-radius: 20px; text-decoration: none; display: inline-block; font-weight: bold; box-shadow: 0 4px 10px rgba(255, 77, 121, 0.4); font-size: 14px;'>Tap to Open 🎁</a>";
                                                                            const encryptedMsg3 = CryptoJS.AES.encrypt(msg3, window.viewerState.userPasscode || '').toString();

                                                                            fetch('https://gift-32f5c-default-rtdb.asia-southeast1.firebasedatabase.app/memories/PREVIEW_MODE/chat.json', {
                                                                                method: 'POST', body: JSON.stringify({ sender: 'bf', text: encryptedMsg3, timestamp: new Date().toISOString() })
                                                                            }).then(() => {
                                                                                fetch('https://gift-32f5c-default-rtdb.asia-southeast1.firebasedatabase.app/memories/PREVIEW_MODE/bf_status.json', {
                                                                                    method: 'PUT', body: JSON.stringify('online')
                                                                                });
                                                                            });

                                                                        }, 1500); 
                                                                    }, 1500); 
                                                                });

                                                            }, 2000); 
                                                        }, 2000); 
                                                    }
                                                });
                                            }, 2000); 
                                        }, 1000);
                                    };

                                    sendBtn.addEventListener('click', triggerBot);
                                    sendBtn.addEventListener('touchstart', triggerBot, {passive: true});
                                }
                            }, 1000);
                        `;
                        doc.body.appendChild(botScript);
                    } catch(e) { console.warn("Bot injected skipped due to cross-origin restriction"); }
                };


                setTimeout(() => {
                    overlay.style.display = 'none';
                    iframe.style.display = 'block';
                    if (expandBtn) expandBtn.style.display = 'flex'; 
                }, 1000); 
            });
        }

        if (expandBtn && fsModal && closeFsBtn && iframe) {
            expandBtn.addEventListener('click', () => {
                fsIframeContainer.appendChild(iframe);
                iframe.style.setProperty('transform', 'scale(1)', 'important'); 
                iframe.style.setProperty('width', '100%', 'important');
                iframe.style.setProperty('height', '100%', 'important');
                iframe.style.setProperty('border-radius', '20px', 'important');

                fsModal.classList.add('active'); 
                document.body.style.overflow = 'hidden'; 
            });

            closeFsBtn.addEventListener('click', () => {
                originalIframeParent.appendChild(iframe);

                iframe.style.setProperty('width', '375px', 'important');
                iframe.style.setProperty('height', '812px', 'important');
                iframe.style.setProperty('transform', 'scale(0.76)', 'important');
                iframe.style.setProperty('border-radius', '16px', 'important');

                fsModal.classList.remove('active'); 
                document.body.style.overflow = ''; 
            });
        }
    };

    initLiveDemo();

    // ==========================================
    // 9. MOBILE SIDEBAR MENU LOGIC (FINAL)
    // ==========================================
    const initSidebarMenu = () => {
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const closeBtn = document.getElementById('sidebar-close');
        const sidebarLinks = document.querySelectorAll('.sidebar__link');

        if (!menuBtn || !sidebar) return;

        const openMenu = (e) => {
            e.preventDefault();
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; 
        };

        const closeMenu = () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = ''; 
        };

        menuBtn.addEventListener('click', openMenu);
        closeBtn.addEventListener('click', closeMenu);
        overlay.addEventListener('click', closeMenu);

        sidebarLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    };

    initSidebarMenu();

    // ==========================================
    // 11. PREMIUM PWA INSTALL ENGINE
    // ==========================================
    const initPremiumPWA = () => {
        // 1. Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .catch(err => console.warn('PWA Engine offline:', err));
        }

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            return; // App is already running as PWA
        }

        let deferredPrompt;
        let hasPrompted = false;

        // 2. Build the Custom Glassmorphism UI
        const installCardHTML = `
            <div id="pwa-install-card" style="
                position: fixed; bottom: -150px; left: 50%; transform: translateX(-50%);
                width: 90%; max-width: 400px; background: rgba(15, 10, 20, 0.75);
                backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
                border: 1px solid rgba(255, 77, 166, 0.3); border-radius: 24px;
                padding: 28px 24px; text-align: center;
                box-shadow: 0 20px 50px rgba(0,0,0,0.6), inset 0 0 20px rgba(255,77,166,0.05);
                z-index: 9999; opacity: 0; transition: all 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            ">
                <div style="font-size: 2rem; margin-bottom: 10px; animation: pulse 2s infinite;">✨</div>
                <h3 style="font-family: 'Playfair Display', serif; font-size: 1.4rem; color: #fff; margin-bottom: 8px;">Save this feeling forever ❤️</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px; line-height: 1.4;">Install GiftoraX for faster, magical access anytime directly from your home screen.</p>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button id="pwa-accept-btn" style="
                        background: linear-gradient(135deg, #ff4da6, #9d4edd); color: #fff; border: none;
                        padding: 14px; border-radius: 50px; font-weight: 600; font-family: 'Poppins', sans-serif;
                        font-size: 1rem; cursor: pointer; box-shadow: 0 4px 15px rgba(255, 77, 166, 0.3);
                        transition: transform 0.3s;
                    ">Install Now ✨</button>
                    <button id="pwa-decline-btn" style="
                        background: transparent; color: #888; border: none; font-size: 0.9rem;
                        cursor: pointer; font-family: 'Poppins', sans-serif;
                    ">Maybe Later</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', installCardHTML);

        const installCard = document.getElementById('pwa-install-card');
        const acceptBtn = document.getElementById('pwa-accept-btn');
        const declineBtn = document.getElementById('pwa-decline-btn');

        // 3. Intercept Default Prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault(); // Stop default boring prompt
            deferredPrompt = e;
            setupSmartTriggers(); // Only setup triggers if PWA is installable
        });

        const showPremiumPrompt = () => {
            if (deferredPrompt && !hasPrompted) {
                hasPrompted = true;
                installCard.style.bottom = '30px';
                installCard.style.opacity = '1';
                if (navigator.vibrate) navigator.vibrate([30, 50, 30]); // Subtle magical vibration
            }
        };

        const hidePremiumPrompt = () => {
            installCard.style.bottom = '-150px';
            installCard.style.opacity = '0';
        };

        // 4. Smart Install Triggers
        const setupSmartTriggers = () => {
            // Trigger 1: Time (12 Seconds)
            setTimeout(showPremiumPrompt, 12000);

            // Trigger 2: Scroll Depth (40%)
            const scrollTrigger = () => {
                const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                if (scrollPercent > 40) {
                    showPremiumPrompt();
                    window.removeEventListener('scroll', scrollTrigger);
                }
            };
            window.addEventListener('scroll', scrollTrigger, { passive: true });

            // Trigger 3: Emotional Intent (Clicking CTA)
            document.querySelectorAll('a[href="lead-form.html"]').forEach(btn => {
                btn.addEventListener('mouseenter', showPremiumPrompt, { once: true });
            });
        };

        // 5. Handle Actions
        acceptBtn.addEventListener('click', async () => {
            hidePremiumPrompt();
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                deferredPrompt = null;
            }
        });

        declineBtn.addEventListener('click', hidePremiumPrompt);

        // 6. Installation Success Magic
        window.addEventListener('appinstalled', () => {
            hidePremiumPrompt();

            // Show premium success toast
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed; top: 40px; left: 50%; transform: translateX(-50%) translateY(-20px);
                background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4);
                color: #10b981; padding: 16px 24px; border-radius: 50px; backdrop-filter: blur(10px);
                font-weight: 500; opacity: 0; z-index: 10000; transition: all 0.4s ease;
                box-shadow: 0 10px 30px rgba(16, 185, 129, 0.2);
            `;
            toast.innerHTML = `<i class="fa-solid fa-heart"></i> GiftoraX is now part of your world ❤️`;
            document.body.appendChild(toast);

            setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(-50%) translateY(0)'; }, 100);
            if (navigator.vibrate) navigator.vibrate([50, 100, 50]); // Success vibration
            if (typeof triggerConfetti === 'function') triggerConfetti(); // Trigger existing confetti

            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 400);
            }, 4000);
        });
    };

    initPremiumPWA();


}); // Ye aakhri bracket waise hi rehna chahiye