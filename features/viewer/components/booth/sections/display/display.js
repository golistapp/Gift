(function() {
    const state = window.boothState;
    if (!state) return;

    const video = document.getElementById('booth-video');
    const canvas = document.getElementById('booth-canvas');
    const placeholder = document.getElementById('booth-placeholder');
    const flash = document.getElementById('booth-flash');
    const countdownEl = document.getElementById('booth-countdown');

    // Premium Camera Shutter Sound
    const snapSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    // 1. Camera Start Karne ka logic (High Quality Mode Added)
    state.startCamera = async function() {
        try {
            // 🔴 HD Quality aur perfect aspect ratio ke liye camera constraint update kiya
            state.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            video.srcObject = state.stream;
            video.style.display = 'block';
            canvas.style.display = 'none';
            placeholder.style.display = 'none';
        } catch (err) {
            alert("Camera access denied! Please select an uploaded photo instead.");
        }
    };

    // 2. Camera Stop karne ka logic
    state.stopCamera = function() {
        if (state.stream) {
            state.stream.getTracks().forEach(t => t.stop());
            state.stream = null;
        }
        video.style.display = 'none';
    };

    // 3. 3-2-1 Countdown & Snap logic
    state.takeSnap = function(onSnapComplete) {
        if (!state.stream || video.style.display === 'none') {
            alert("Please start the camera first!");
            return;
        }

        let count = 3;
        countdownEl.style.display = 'block';
        countdownEl.innerText = count;
        countdownEl.classList.add('count-anim');

        // Har 1 second mein number change hoga
        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                countdownEl.innerText = count;
                countdownEl.classList.remove('count-anim');
                void countdownEl.offsetWidth; // Trigger reflow for animation reset
                countdownEl.classList.add('count-anim');
            } else {
                // Countdown khatam -> Photo click karo
                clearInterval(timer);
                countdownEl.style.display = 'none';
                
                // Sound aur Flash chalayenge
                snapSound.currentTime = 0;
                snapSound.play().catch(e => console.log(e));
                
                flash.classList.add('flash-anim');
                setTimeout(() => flash.classList.remove('flash-anim'), 600);

                // 🔴 MAIN FIX: Zabardasti 800x600 karne ke bajaye, mobile camera ka ASLI size nikalenge!
                const vw = video.videoWidth || 800;
                const vh = video.videoHeight || 600;
                
                state.userImage = document.createElement('canvas');
                state.userImage.width = vw;
                state.userImage.height = vh;
                
                const uCtx = state.userImage.getContext('2d');
                // Selfie camera (mirror) theek karne ke liye (Asli width use karke)
                uCtx.translate(vw, 0);
                uCtx.scale(-1, 1);
                uCtx.drawImage(video, 0, 0, vw, vh);

                // Video band karke photo dikhayenge
                state.stopCamera();
                canvas.style.display = 'block';

                // Controls ko batayenge ki photo click ho gayi, ab filter/frame lagao!
                if (onSnapComplete) onSnapComplete();
            }
        }, 1000);
    };

    // Utility functions to share HTML elements with Controls section
    state.getCanvas = () => canvas;
    state.hidePlaceholder = () => { placeholder.style.display = 'none'; };
    state.showCanvas = () => { canvas.style.display = 'block'; };

})();
