(function() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    const timelineProgress = document.getElementById('timeline-progress');
    const timelineBgLine = document.getElementById('timeline-bg-line');
    const timeline = document.getElementById('future-timeline');
    
    const finalFeature = document.getElementById('final-feature');
    const finalDot = document.getElementById('final-dot');
    const horizLine = document.getElementById('horiz-line');
    const popHeart = document.getElementById('pop-heart');
    const finalImage = document.getElementById('final-image');
    
    const clickSnd = document.getElementById('future-click-sound');
    const magicSnd = document.getElementById('future-magic-sound');

    if (!timeline) return;

    // 🔴 FIX: Truncate background line dynamically so there is NO extra tail
    function fixLineHeight() {
        if (timeline && finalFeature && timelineBgLine) {
            const tRect = timeline.getBoundingClientRect();
            const fRect = finalFeature.getBoundingClientRect();
            const targetHeight = (fRect.top - tRect.top) + (fRect.height / 2) + 10; 
            timelineBgLine.style.height = targetHeight + 'px';
        }
    }
    
    // Call fix on load and window resize
    setTimeout(fixLineHeight, 200);
    window.addEventListener('resize', fixLineHeight);

    function fireFeatureConfetti() {
        for(let i=0; i<40; i++) {
            const h = document.createElement('div');
            h.innerHTML = ['💖', '✨', '🌟', '❤️'][Math.floor(Math.random()*4)];
            h.style.position = 'fixed'; h.style.left = '50%'; h.style.top = '70%'; 
            h.style.fontSize = (Math.random() * 20 + 15) + 'px';
            h.style.pointerEvents = 'none'; h.style.zIndex = '99999';
            h.style.transition = 'all 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            document.body.appendChild(h);
            
            setTimeout(() => {
                h.style.transform = `translate(${(Math.random()-0.5)*600}px, ${(Math.random()-0.5)*600 - 250}px) scale(${Math.random() + 0.5})`;
                h.style.opacity = '0';
            }, 50);
            setTimeout(() => h.remove(), 1500);
        }
    }

    let isFinalAnimated = false;

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -15% 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                
                if (entry.target.classList.contains('timeline-item')) {
                    entry.target.classList.add('show');
                }
                
                const timelineRect = timeline.getBoundingClientRect();
                const itemRect = entry.target.getBoundingClientRect();
                // Add 10 because line starts at top -10px
                const relativeTop = itemRect.top - timelineRect.top + (itemRect.height / 2) + 10;
                let progressHeight = Math.max(0, Math.min(timelineRect.height + 10, relativeTop));
                
                // SEQUENCE ANIMATION LOGIC
                if (entry.target === finalFeature && !isFinalAnimated) {
                    isFinalAnimated = true;
                    
                    // Step 1: Vertical line touches the turn point
                    timelineProgress.style.height = progressHeight + 'px';
                    
                    // Step 2: Pop the Junction Dot
                    setTimeout(() => {
                        finalDot.classList.add('show');
                        if(clickSnd) { clickSnd.currentTime = 0; clickSnd.play().catch(e=>{}); }
                    }, 300);

                    // Step 3: Draw horizontal line
                    setTimeout(() => {
                        if (window.innerWidth <= 600) {
                            horizLine.classList.add('draw-right');
                        }
                    }, 500);

                    // Step 4: Pop the Heart
                    setTimeout(() => {
                        popHeart.classList.add('show');
                        if(navigator.vibrate) navigator.vibrate(40);
                        if(clickSnd) { clickSnd.currentTime = 0; clickSnd.play().catch(e=>{}); }
                    }, (window.innerWidth <= 600) ? 900 : 500);

                    // Step 5: Hide Heart & Show Image perfectly centered
                    setTimeout(() => {
                        popHeart.classList.remove('show');
                        popHeart.classList.add('hide');
                        
                        finalImage.classList.add('show-final'); 
                        
                        fireFeatureConfetti();
                        if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
                        if(magicSnd) { magicSnd.volume = 0.5; magicSnd.currentTime = 0; magicSnd.play().catch(e=>{}); }
                    }, (window.innerWidth <= 600) ? 1400 : 1000);

                } else if (!isFinalAnimated) {
                    if (parseFloat(timelineProgress.style.height || 0) < progressHeight) {
                        timelineProgress.style.height = progressHeight + 'px';
                    }
                }
            }
        });
    }, observerOptions);

    timelineItems.forEach(item => observer.observe(item));
    if (finalFeature) observer.observe(finalFeature);
})();
