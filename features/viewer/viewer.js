(async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const memoryId = urlParams.get('id');
    const mode = urlParams.get('mode'); 

    // 🔴 NAYA: Preview mode mein ID ki zarurat nahi hai isliye check update kiya
    if (!memoryId && mode !== 'preview') {
        alert("Invalid Link! QR code mein memory ID nahi hai.");
        return;
    }

    // Safety check: Agar Firebase file load nahi hui toh batayega
    if (typeof firebaseConfig === 'undefined') {
        alert("Error: Firebase config missing! Check api/firebase.config.js");
        return;
    }

    // 🌐 GLOBAL STATE
    window.viewerState = {
        memoryId: memoryId || "PREVIEW_MODE",
        mode: mode,
        memoryData: null,
        userPasscode: "",
        isMusicPlaying: false
    };

    // Background Particle Engine (Dil udane wala system)
    function startBackgroundParticles() {
        const bgContainer = document.getElementById('hearts-bg');
        if (!bgContainer) return;

        const symbols = ['❤️', '💖', '✨','❣️', '💕'];
        
        setInterval(() => {
            if (document.hidden) return; // Tab inactive ho toh performance bachayega
            
            const particle = document.createElement('div');
            particle.className = 'bg-heart';
            particle.innerText = symbols[Math.floor(Math.random() * symbols.length)];
            
            // Random horizontal position (0 to 100vw)
            particle.style.left = Math.random() * 100 + 'vw';
            
            // Random duration (4 seconds se 9 seconds ke beech)
            const duration = Math.random() * 5 + 4;
            particle.style.animationDuration = duration + 's';
            
            // Random size 
            particle.style.fontSize = (Math.random() * 15 + 12) + 'px';
            
            bgContainer.appendChild(particle);
            
            // Animation khatam hone ke baad memory se hatana zaruri hai
            setTimeout(() => {
                if (particle.parentNode) particle.remove();
            }, duration * 1000);
            
        }, 600); // Har 600ms mein ek naya symbol nikalega
    }

    // 🧩 COMPONENT LOADER
    window.loadViewerComponent = async function(componentName, mountNodeId) {
        const mountNode = document.getElementById(mountNodeId);
        if (!mountNode) return;

        try {
            const htmlRes = await fetch(`features/viewer/components/${componentName}/${componentName}.html`);
            if (htmlRes.ok) mountNode.innerHTML = await htmlRes.text();

            if (!document.getElementById(`css-${componentName}`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.id = `css-${componentName}`;
                link.href = `features/viewer/components/${componentName}/${componentName}.css`;
                document.head.appendChild(link);
            }

            if (!document.getElementById(`js-${componentName}`)) {
                const script = document.createElement('script');
                script.id = `js-${componentName}`;
                script.src = `features/viewer/components/${componentName}/${componentName}.js`;
                document.body.appendChild(script);
            }
        } catch (error) {
            console.error(`Error loading component: ${componentName}`, error);
        }
    };

    // 🚀 INITIAL BOOT
    try {
        // 🔴 NAYA LOGIC: Agar Preview Mode hai, toh Database nahi, Local Storage use karo
        if (mode === 'preview') {
            const previewData = localStorage.getItem('gx_preview_data');
            if (previewData) {
                window.viewerState.memoryData = JSON.parse(previewData);
            } else {
                document.body.innerHTML = '<h2 style="text-align:center; margin-top:20vh; color:#cc0033;">Preview Data Missing! Please try again. 💔</h2>';
                return;
            }
        } else {
            // Normal Mode: Firebase se fetch karo
            const response = await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`);
            if (!response.ok) throw new Error("Firebase returned " + response.status);
            window.viewerState.memoryData = await response.json();

            // 🔴 NAYA JADOO: URL mein Gift Person ka naam jodne ke liye
            if (window.viewerState.memoryData && window.viewerState.memoryData.girlfriend_name && mode !== 'admin_preview' && mode !== 'preview') {
                const gfName = encodeURIComponent(window.viewerState.memoryData.girlfriend_name.trim());
                // Bina page reload kiye address bar ka URL change kar dega
                window.history.replaceState(null, '', `?id=${memoryId}&for=${gfName}`);
            }
        } // 🔴 YEH RAHA WOH MISSING BRACKET JO FIX KAR DIYA GAYA HAI!

        // Security Check (Enable/Disable)
        // Agar disabled hai aur admin preview nahi kar raha hai, toh block kar do
        if (window.viewerState.memoryData && window.viewerState.memoryData.is_enabled === false && mode !== 'admin_preview') {
            document.body.innerHTML = `
                <div style="text-align:center; margin-top:25vh; padding: 20px; font-family: var(--font-ui);">
                    <i class="fa-solid fa-eye-slash" style="font-size: 60px; color: #94a3b8; margin-bottom: 20px;"></i>
                    <h2 style="color:#334155; font-size: 24px; margin-bottom: 10px;">Access Denied</h2>
                    <p style="color:#64748b; font-size: 14px;">This surprise is currently hidden or disabled by the sender.</p>
                </div>`;
            return; 
        }

        if (!window.viewerState.memoryData || window.viewerState.memoryData.status !== "locked") {
            document.body.innerHTML = '<h2 style="text-align:center; margin-top:20vh; color:#cc0033;">Surprise is not ready yet! 💔</h2>';
            return;
        }

        // Particle System chalu karo
        startBackgroundParticles();

        // 🔴 NAYA LOGIC: Session Storage se check karo ki user Master Portal se toh nahi aaya
        const savedPasscode = sessionStorage.getItem(`auth_${memoryId}`);
        let isMasterUnlocked = false;

        if (savedPasscode) {
            // Password wapas verify kar lo security ke liye
            const storedPass = window.viewerState.memoryData.passcode || "";
            if (storedPass === savedPasscode || (savedPasscode !== "" && storedPass.endsWith(savedPasscode))) {
                isMasterUnlocked = true;
                window.viewerState.userPasscode = savedPasscode; // Aage decryption ke liye passcode zaroori hai
            }
        }

        // Routing Logic
        // Agar Admin hai, Preview hai, YA Master portal se unlock ho chuka hai -> Direct andar jao
        if (mode === 'admin_preview' || mode === 'preview' || isMasterUnlocked) {
            await window.loadViewerComponent('surprise', 'surprise-mount');
            await window.loadViewerComponent('layout', 'footer-mount'); 
            
            document.getElementById('surprise-mount').classList.remove('hidden');
            document.getElementById('footer-mount').classList.remove('hidden');
            const vaultMount = document.getElementById('vault-mount');
            if(vaultMount) vaultMount.classList.add('hidden');

            // Scanned status update karo agar master portal se open hua hai (taaki Dashboard me "read" show ho)
            if (isMasterUnlocked) {
                fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`, { 
                    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ scanned_at: new Date().toISOString() }) 
                }).catch(e => {});
            }

        } else {
            // Agar normal direct link kisi ne kholi hai, toh Vault dikhao
            await window.loadViewerComponent('vault', 'vault-mount');
        }

    } catch (error) {
        console.error("Fetch Error:", error);
        alert("System Error: " + error.message);
    }
})();
6