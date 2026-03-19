(function() {
    const state = window.viewerState;
    if (!state || !state.memoryData) return;
    const memoryData = state.memoryData;

    // 1. Open When texts
    document.getElementById('ow-sorry').innerText = memoryData.open_when_sorry || "Thank you...";
    document.getElementById('ow-sad').innerText = memoryData.open_when_sad || "Thank you...";
    document.getElementById('ow-miss').innerText = memoryData.open_when_miss_me || "Thank you...";
    document.getElementById('ow-hug').innerText = memoryData.open_when_hug || "Thank you...";
    document.getElementById('ow-love').innerText = memoryData.open_when_happy || "Thank you..."; 

    // 2. Generate Polaroids
    const polaroidContainer = document.getElementById('dynamic-polaroids');
    if (polaroidContainer) {
        polaroidContainer.innerHTML = '';
        for(let i = 1; i <= 5; i++) {
            if(memoryData[`image_${i}_url`]) {
                polaroidContainer.innerHTML += `
                    <div class="polaroid-flip" onclick="this.classList.toggle('is-flipped');">
                        <div class="polaroid-inner">
                            <div class="polaroid-front">
                                <img src="${memoryData[`image_${i}_url`]}" alt="Memory ${i}">
                                <p>${memoryData[`caption_${i}`] || ''}</p>
                            </div>
                            <div class="polaroid-back">"Every moment with you is a treasure. ❤️"</div>
                        </div>
                    </div>
                `;
            }
        }
    }

    // 3. Multi-Card Scratch Logic
    function initCardScratchers() {
        const cards = document.querySelectorAll('.airmail-card');
        let activeCardIndex = -1;

        cards.forEach((card, index) => {
            const canvas = card.querySelector('.scratch-overlay');
            if(!canvas) return;
            const ctx = canvas.getContext('2d');

            canvas.width = 320;
            canvas.height = 180;

            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = "bold 24px 'Poppins'";
            ctx.fillStyle = "#94a3b8";
            ctx.textAlign = "center";
            ctx.fillText("Scratch to unlock 🪙", canvas.width/2, canvas.height/2 + 8);

            let isDrawing = false;
            let scratchCount = 0;
            let isCleared = false;

            function clearCard() {
                if(isCleared) return;
                isCleared = true;
                canvas.classList.add('cleared'); 
                card.classList.add('unlocked'); 
            }

            card.autoClear = clearCard;

            function scratch(e) {
                if(!isDrawing || isCleared) return;
                e.preventDefault();

                if(activeCardIndex !== -1 && activeCardIndex !== index) {
                    cards[activeCardIndex].autoClear();
                }
                activeCardIndex = index;

                const bRect = canvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;

                const x = (clientX - bRect.left) * (canvas.width / bRect.width);
                const y = (clientY - bRect.top) * (canvas.height / bRect.height);

                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath();
                ctx.arc(x, y, 25, 0, Math.PI * 2);
                ctx.fill();

                scratchCount++;
                if(scratchCount > 40) {
                    clearCard();
                }
            }

            canvas.addEventListener('mousedown', () => isDrawing = true);
            canvas.addEventListener('mouseup', () => isDrawing = false);
            canvas.addEventListener('mousemove', scratch);

            canvas.addEventListener('touchstart', () => isDrawing = true, {passive: false});
            canvas.addEventListener('touchend', () => isDrawing = false);
            canvas.addEventListener('touchmove', scratch, {passive: false});
        });
    }

    // 4. Safe Spotify Multi-Track Player Logic (Updated for Image Mismatch & No Tracks)
    function initSpotifyPlayer() {
        const bgMusic = document.getElementById('bg-music');
        if(!bgMusic) return;

        // 🎵 Playlist Setup (Track 1 is bg-music.src)
        const playlist = [
            { title: "Our Memory", subtitle: "Forever Yours ❤️", src: bgMusic.src, cover: "assets/image/album1.jpg" },
            { title: "First Date", subtitle: "Magical Moments", src: "assets/audio/track2.mp3", cover: "assets/image/album2.jpg" },
            { title: "Late Night Talks", subtitle: "Just You & Me", src: "assets/audio/track3.mp3", cover: "assets/image/album3.jpg" },
            { title: "Long Drives", subtitle: "Endless Love", src: "assets/audio/track4.mp3", cover: "assets/image/album4.jpg" },
            { title: "Wedding Dream", subtitle: "Our Future", src: "assets/audio/track5.mp3", cover: "assets/image/album5.jpg" }
        ];

        let currentTrackIdx = 0;
        const playBtn = document.getElementById('spotify-play-btn');
        const nextBtn = document.getElementById('spotify-next-btn');
        const prevBtn = document.getElementById('spotify-prev-btn');
        const coverImg = document.getElementById('spotify-cover');
        const trackTitle = document.getElementById('spotify-title');
        const trackSub = document.getElementById('spotify-sub');
        const progressBar = document.getElementById('spotify-progress-fill');
        const currentTimeEl = document.getElementById('spotify-current-time');
        const totalTimeEl = document.getElementById('spotify-total-time');

        // 🔴 FIX: Image Load Error Handler
        coverImg.onerror = function() {
            console.log(`Failed to load cover image: ${this.src}. Please check path and filename!`);
            // Fallback (default background) taki black box na dikhe
            this.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
            this.style.background = "#333"; // Placeholder color
            // optionally show an alert for debugging
            // alert(`Error: Cannot find image file: ${this.src}. Please rename your file and check 'assets/image/' folder!`);
        };

        // 🔴 FIX: Audio Load Error Handler
        bgMusic.onerror = function() {
            // Agar track 2-5 nahi hain toh pause kardo, aur next button enable rakho.
            console.log(`Failed to load audio track: ${this.src}. Skipping to next/prev is still allowed.`);
            if (currentTrackIdx > 0) {
                 this.pause(); 
                 progressBar.style.width = '0%';
                 currentTimeEl.innerText = "0:00";
                 totalTimeEl.innerText = "Error 404";
            } else {
                 // Track 1 fails, something is wrong with main bgm
                 totalTimeEl.innerText = "Main BGM Error";
            }
        };

        function loadTrack(idx) {
            const track = playlist[idx];
            // Update Image (onerror logic will handle failure)
            coverImg.src = track.cover; 
            trackTitle.innerText = track.title;
            trackSub.innerText = track.subtitle;

            const currentSrc = bgMusic.src.split('/').pop();
            const newSrc = track.src.split('/').pop();

            if(currentSrc !== newSrc) {
                bgMusic.src = track.src;
                // Preload to trigger onerror if file doesn't exist
                bgMusic.load(); 
            }
        }

        // Play / Pause Button
        playBtn.addEventListener('click', () => {
            if(bgMusic.paused) bgMusic.play().catch(e=>console.log("Audio play blocked/failed:", e.message));
            else bgMusic.pause();
        });

        // Next Button
        nextBtn.addEventListener('click', () => {
            currentTrackIdx = (currentTrackIdx + 1) % playlist.length;
            loadTrack(currentTrackIdx);
            // Sirf tabhi play karein jab track 1 ho (baki toh abhi hai hi nahi)
            if(currentTrackIdx === 0) bgMusic.play().catch(e=>{});
        });

        // Previous Button
        prevBtn.addEventListener('click', () => {
            currentTrackIdx = (currentTrackIdx - 1 + playlist.length) % playlist.length;
            loadTrack(currentTrackIdx);
            if(currentTrackIdx === 0) bgMusic.play().catch(e=>{});
        });

        bgMusic.addEventListener('ended', () => {
            nextBtn.click();
        });

        bgMusic.addEventListener('play', () => { 
            playBtn.classList.remove('fa-circle-play'); 
            playBtn.classList.add('fa-circle-pause'); 
        });
        bgMusic.addEventListener('pause', () => { 
            playBtn.classList.remove('fa-circle-pause'); 
            playBtn.classList.add('fa-circle-play'); 
        });

        bgMusic.addEventListener('timeupdate', () => {
            if(bgMusic.duration) {
                const percent = (bgMusic.currentTime / bgMusic.duration) * 100;
                progressBar.style.width = percent + '%';
                currentTimeEl.innerText = formatTime(bgMusic.currentTime);
                totalTimeEl.innerText = formatTime(bgMusic.duration);
            }
        });

        function formatTime(sec) {
            if(isNaN(sec)) return "0:00";
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return `${m}:${s < 10 ? '0' : ''}${s}`;
        }

        loadTrack(0);
    }

    setTimeout(() => {
        initCardScratchers();
        initSpotifyPlayer();
    }, 500);

})();