(function() {
    const state = window.boothState;
    if (!state) return;

    const frameSelect = document.getElementById('frame-select');
    const btnStart = document.getElementById('btn-start-cam');
    const btnSnap = document.getElementById('btn-snap');
    const btnSave = document.getElementById('btn-save');
    const fileUpload = document.getElementById('file-upload');

    // 🎉 Confetti Blast Function
    function fireConfetti() {
        for(let i=0; i<30; i++) {
            const h = document.createElement('div');
            h.innerHTML = ['❤️', '✨', '📸', '🎉'][Math.floor(Math.random()*4)];
            h.style.position = 'fixed'; h.style.left = '50%'; h.style.top = '50%';
            h.style.fontSize = (Math.random() * 20 + 10) + 'px';
            h.style.pointerEvents = 'none'; h.style.zIndex = '99999';
            h.style.transition = 'all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            document.body.appendChild(h);
            setTimeout(() => {
                h.style.transform = `translate(${(Math.random()-0.5)*500}px, ${(Math.random()-0.5)*500}px) scale(${Math.random() + 0.5})`;
                h.style.opacity = '0';
            }, 50);
            setTimeout(() => h.remove(), 1000);
        }
    }

    // ✨ Render Image, Filter & Frames on Canvas
    state.renderCanvas = function() {
        if(!state.userImage) return;
        const canvas = state.getCanvas();
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = 800; canvas.height = 600;

        // 🌟 SMART AUTO-CROP LOGIC (Stretch Fix) 🌟
        const img = state.userImage;
        const canvasRatio = canvas.width / canvas.height;
        const imgRatio = img.width / img.height;

        let sourceWidth = img.width;
        let sourceHeight = img.height;
        let sourceX = 0;
        let sourceY = 0;

        if (imgRatio > canvasRatio) {
            // Photo canvas se zyada chaudi (wide) hai -> Left & Right se crop karo
            sourceWidth = img.height * canvasRatio;
            sourceX = (img.width - sourceWidth) / 2;
        } else {
            // Photo canvas se zyada lambi (tall) hai -> Top & Bottom se crop karo
            sourceHeight = img.width / canvasRatio;
            sourceY = (img.height - sourceHeight) / 2;
        }

        // Draw image with perfect cropping (like object-fit: cover)
        ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);

        // 2. Beauty Filter (Soft Warm Pink Glow)
        ctx.fillStyle = "rgba(255, 230, 234, 0.15)";
        ctx.fillRect(0, 0, 800, 600);

        // 3. Apply Frame
        const frameStyle = frameSelect.value;
        ctx.save();
        if (frameStyle === 'valentine') {
            ctx.lineWidth = 15; ctx.strokeStyle = '#ff4d79';
            ctx.strokeRect(15, 15, 770, 570);
            ctx.font = "40px Arial";
            for(let i=0; i<8; i++) { 
                ctx.fillText("❤️", 20+i*100, 50); 
                ctx.fillText("❤️", 20+i*100, 580); 
            }
        } else if (frameStyle === 'polaroid-love') {
            ctx.lineWidth = 30; ctx.strokeStyle = '#ffffff';
            ctx.strokeRect(15, 15, 770, 570);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 480, 800, 120);
            ctx.font = "bold 50px 'Dancing Script', cursive";
            ctx.fillStyle = '#cc0033';
            ctx.fillText("Our Beautiful Memory", 200, 550);
        } else if (frameStyle === 'cute') {
            ctx.lineWidth = 20; ctx.strokeStyle = '#ff4d79';
            ctx.setLineDash([30, 30]);
            ctx.strokeRect(20, 20, 760, 560);
            ctx.font = "italic bold 45px 'Playfair Display', serif";
            ctx.fillStyle = 'white';
            ctx.shadowColor = '#ff4d79'; ctx.shadowBlur = 10;
            ctx.fillText("Cuties forever", 450, 550);
        }
        ctx.restore();

        state.showCanvas();
        state.hidePlaceholder();
    };

    // Frame change event
    if(frameSelect) frameSelect.addEventListener('change', () => { if(state.userImage) state.renderCanvas(); });

    // Button Events
    if(btnStart) btnStart.addEventListener('click', () => { if(state.startCamera) state.startCamera(); });

    if(btnSnap) btnSnap.addEventListener('click', () => {
        if(state.takeSnap) state.takeSnap(() => { state.renderCanvas(); });
    });

    // Gallery se Upload karne ka logic
    if(fileUpload) {
        fileUpload.addEventListener('change', (e) => {
            if(e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = new Image();
                    img.onload = () => {
                        if(state.stopCamera) state.stopCamera();
                        state.userImage = img;
                        state.renderCanvas();
                    };
                    img.src = ev.target.result;
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }

    if(btnSave) {
        btnSave.addEventListener('click', () => {
            if(!state.userImage) { alert("Please take a snap or upload a photo first!"); return; }
            fireConfetti(); // Boom! 🎉
            const link = document.createElement('a');
            link.download = `LoveBooth_${Date.now()}.png`;
            link.href = state.getCanvas().toDataURL('image/png');
            link.click();
        });
    }
})();