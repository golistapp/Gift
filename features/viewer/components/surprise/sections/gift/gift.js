(function() {
    let minimalGiftOpened = false;

    // Helper: Confetti Effect
    function fireConfettiAndHearts() {
        for(let i=0; i<40; i++) {
            const h = document.createElement('div');
            h.innerHTML = Math.random() > 0.5 ? '❤️' : '✨';
            h.style.position = 'fixed'; h.style.left = '50%'; h.style.top = '50%';
            h.style.fontSize = (Math.random() * 20 + 10) + 'px';
            h.style.pointerEvents = 'none'; h.style.zIndex = '99999';
            h.style.transition = 'all 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            document.body.appendChild(h);
            setTimeout(() => {
                h.style.transform = `translate(${(Math.random()-0.5)*500}px, ${(Math.random()-0.5)*500}px) scale(${Math.random() + 0.5})`;
                h.style.opacity = '0';
            }, 50);
            setTimeout(() => h.remove(), 1500);
        }
    }

    const container = document.getElementById("minimal-gift-container");
    const giftBox = document.getElementById("minimal-gift");

    if (container && giftBox) {
        container.addEventListener('click', () => {
            if (minimalGiftOpened) return;
            minimalGiftOpened = true;

            // Stop swaying
            container.classList.add("opened-container");
            giftBox.classList.add("opened");

            // Ring spawn logic
            const ring = document.createElement('div');
            ring.innerHTML = '💍';
            ring.style.position = 'absolute';
            ring.style.top = '30px';
            ring.style.left = '50%';
            ring.style.transform = 'translate(-50%, 0) scale(0.1) rotate(-180deg)';
            ring.style.fontSize = '4.5rem';
            ring.style.opacity = '0';
            ring.style.transition = 'all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            ring.style.zIndex = '1';
            giftBox.appendChild(ring);

            // Pop out ring
            setTimeout(() => {
                ring.style.transform = 'translate(-50%, -90px) scale(1) rotate(0deg)';
                ring.style.opacity = '1';
            }, 300);

            // Show message and fire confetti
            setTimeout(() => {
                const msg = document.getElementById("surpriseMessage");
                if (msg) msg.classList.add("show");
                fireConfettiAndHearts();
            }, 1100); 
        });
    }
})();