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

    // ==========================================
    // INITIALIZATION
    // ==========================================
    initScrollSystem();
    initSmoothScroll();
    initTypingEffect();
    initRevealAnimations();   
    initPersonalization();
    initActionButtons();

    // ==========================================
    // 8. LIVE DEMO IFRAME LOGIC (NAYA JADOO)
    // ==========================================
    const initLiveDemo = () => {
        const demoBtn = document.getElementById('start-live-demo-btn');
        const overlay = document.getElementById('demo-overlay');
        const iframe = document.getElementById('live-demo-frame');

        if (demoBtn && overlay && iframe) {
            demoBtn.addEventListener('click', () => {
                // Button dabate hi animation dikhao
                demoBtn.innerHTML = 'Unlocking Magic... <i class="fa-solid fa-spinner fa-spin"></i>';
                demoBtn.style.opacity = '0.7';

                // 1. VIP Pass create karo 'GX-01' ke liye (Taaki vault password na maange)
                sessionStorage.setItem('auth_GX-01', 'true');

                // 2. Iframe ke andar aapki app load karo 
                // (Note: Yahan humne 'portal.html' likha hai, aapki main file ka jo bhi naam ho wo yahan daal dijiyega)
                iframe.src = 'portal.html?id=GX-01';

                // 3. 1 second baad nakli design hata kar asli app dikha do
                setTimeout(() => {
                    overlay.style.display = 'none';
                    iframe.style.display = 'block';
                }, 1000); 
            });
        }
    };

        initLiveDemo(); // Naye function ko chalne ke liye command


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
            // Yahan se alert hata diya gaya hai ✅
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; 
        };

        const closeMenu = () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = ''; 
        };

        // Button click event
        menuBtn.addEventListener('click', openMenu);
        closeBtn.addEventListener('click', closeMenu);
        overlay.addEventListener('click', closeMenu);

        sidebarLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    };

    initSidebarMenu();

}); // Ye aakhri bracket waise hi rehna chahiye