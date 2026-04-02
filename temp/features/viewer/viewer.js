(async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const memoryId = urlParams.get('id');
    const mode = urlParams.get('mode'); 

    if (!memoryId && mode !== 'preview') {
        alert("Invalid Link! Memory ID missing.");
        return;
    }

    window.viewerState = {
        memoryId: memoryId || "PREVIEW_MODE",
        mode: mode,
        memoryData: null,
        userPasscode: "",
        isMusicPlaying: false,
        isAuthenticated: false // Auth status track karne ke liye
    };

    // --- 1. Background Particle Engine ---
    function startBackgroundParticles() {
        const bgContainer = document.getElementById('hearts-bg');
        if (!bgContainer) return;
        const symbols = ['❤️', '💖', '✨','❣️', '💕'];
        setInterval(() => {
            if (document.hidden) return;
            const particle = document.createElement('div');
            particle.className = 'bg-heart';
            particle.innerText = symbols[Math.floor(Math.random() * symbols.length)];
            particle.style.left = Math.random() * 100 + 'vw';
            const duration = Math.random() * 5 + 4;
            particle.style.animationDuration = duration + 's';
            particle.style.fontSize = (Math.random() * 15 + 12) + 'px';
            bgContainer.appendChild(particle);
            setTimeout(() => { if (particle.parentNode) particle.remove(); }, duration * 1000);
        }, 600);
    }

    // --- 2. Component Loader ---
    window.loadViewerComponent = async function(componentName, mountNodeId) {
        const mountNode = document.getElementById(mountNodeId);
        if (!mountNode) return;
        try {
            const htmlRes = await fetch(`features/viewer/components/${componentName}/${componentName}.html`);
            if (htmlRes.ok) mountNode.innerHTML = await htmlRes.text();
            
            if (!document.getElementById(`css-${componentName}`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet'; link.id = `css-${componentName}`;
                link.href = `features/viewer/components/${componentName}/${componentName}.css`;
                document.head.appendChild(link);
            }

            if (!document.getElementById(`js-${componentName}`)) {
                const script = document.createElement('script');
                script.id = `js-${componentName}`;
                script.src = `features/viewer/components/${componentName}/${componentName}.js`;
                document.body.appendChild(script);
            }
        } catch (error) { console.error(`Error loading ${componentName}:`, error); }
    };

    // --- 3. Firebase Auth Setup (Rules Lock ke liye zaroori hai) ---
    async function authenticateWithFirebase() {
        const token = sessionStorage.getItem(`fb_token_${memoryId}`);
        if (!token) return false;

        try {
            // Note: Firebase Auth use karne ke liye portal.html mein Auth SDK hona chahiye
            if (window.firebase && firebase.auth) {
                await firebase.auth().signInWithCustomToken(token);
                window.viewerState.isAuthenticated = true;
                console.log("🔐 Firebase Authenticated Successfully");
                return true;
            }
        } catch (error) {
            console.error("Auth Error:", error);
        }
        return false;
    }

    // --- 4. INITIAL BOOT ---
    try {
        // Mode Check: Preview vs Real
        if (mode === 'preview') {
            const previewData = localStorage.getItem('gx_preview_data');
            if (previewData) window.viewerState.memoryData = JSON.parse(previewData);
            else throw new Error("Preview Data Missing");
        } else {
            // 🔴 SECURE VERCEL PROXY CALL 🔴
            const response = await fetch(`${firebaseConfig.secureApiURL}/memories/${memoryId}.json`);
            if (!response.ok) throw new Error("Data fetch failed");
            window.viewerState.memoryData = await response.json();
        }

        const mData = window.viewerState.memoryData;

        // Security Check
        if (mData && mData.is_enabled === false && mode !== 'admin_preview') {
            document.body.innerHTML = `<div style="text-align:center; margin-top:25vh; font-family: sans-serif;">
                <i class="fa-solid fa-eye-slash" style="font-size: 60px; color: #94a3b8;"></i>
                <h2>Access Denied</h2><p>This surprise is currently disabled.</p></div>`;
            return; 
        }

        if (!mData || mData.status !== "locked") {
            document.body.innerHTML = '<h2 style="text-align:center; margin-top:20vh;">Surprise is not ready yet! 💔</h2>';
            return;
        }

        startBackgroundParticles();

        // Check if unlocked via Master Portal
        const savedPasscode = sessionStorage.getItem(`auth_${memoryId}`);
        let isMasterUnlocked = false;

        if (savedPasscode) {
            const storedPass = mData.passcode || "";
            if (storedPass === savedPasscode || (savedPasscode !== "" && storedPass.endsWith(savedPasscode))) {
                isMasterUnlocked = true;
                window.viewerState.userPasscode = savedPasscode;
                // Login with token if available
                await authenticateWithFirebase();
            }
        }

        // Routing
        if (mode === 'admin_preview' || mode === 'preview' || isMasterUnlocked) {
            await window.loadViewerComponent('surprise', 'surprise-mount');
            await window.loadViewerComponent('layout', 'footer-mount'); 
            
            document.getElementById('surprise-mount').classList.remove('hidden');
            document.getElementById('footer-mount').classList.remove('hidden');
            const vMount = document.getElementById('vault-mount');
            if(vMount) vMount.classList.add('hidden');

            // Scanned time update via Proxy
            if (isMasterUnlocked && mode !== 'preview') {
                fetch(`${firebaseConfig.secureApiURL}/memories/${memoryId}.json`, { 
                    method: 'PATCH', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ scanned_at: new Date().toISOString() }) 
                }).catch(e => {});
            }
        } else {
            await window.loadViewerComponent('vault', 'vault-mount');
        }

    } catch (error) {
        console.error("Boot Error:", error);
        alert("System Error: " + error.message);
    }
})();
