(async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const memoryId = urlParams.get('id');
    const mode = urlParams.get('mode'); 

    if (!memoryId && mode !== 'preview') {
        alert("Invalid Link! QR code mein memory ID nahi hai."); return;
    }

    if (typeof firebaseConfig === 'undefined') {
        alert("Error: Firebase config missing! Check config/firebase.config.js"); return;
    }

    window.viewerState = { memoryId: memoryId || "PREVIEW_MODE", mode: mode, memoryData: null, userPasscode: "", isMusicPlaying: false };

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

    window.loadViewerComponent = async function(componentName, mountNodeId) {
        const mountNode = document.getElementById(mountNodeId);
        if (!mountNode) return;
        try {
            const htmlRes = await fetch(`features/viewer/components/${componentName}/${componentName}.html`);
            if (htmlRes.ok) mountNode.innerHTML = await htmlRes.text();
            if (!document.getElementById(`css-${componentName}`)) {
                const link = document.createElement('link'); link.rel = 'stylesheet'; link.id = `css-${componentName}`;
                link.href = `features/viewer/components/${componentName}/${componentName}.css`; document.head.appendChild(link);
            }
            if (!document.getElementById(`js-${componentName}`)) {
                const script = document.createElement('script'); script.id = `js-${componentName}`;
                script.src = `features/viewer/components/${componentName}/${componentName}.js`; document.body.appendChild(script);
            }
        } catch (error) { console.error(`Error:`, error); }
    };

    // 🚀 INITIAL BOOT (SECURED)
    try {
        if (mode === 'preview') {
            const previewData = localStorage.getItem('gx_preview_data');
            if (previewData) window.viewerState.memoryData = JSON.parse(previewData);
            else { document.body.innerHTML = '<h2 style="text-align:center; margin-top:20vh; color:#cc0033;">Preview Data Missing! 💔</h2>'; return; }
        } else if (mode === 'admin_preview') {
            // Admin Mode - Use Auth Token
            const adminToken = localStorage.getItem('adminToken');
            const response = await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json?auth=${adminToken}`);
            window.viewerState.memoryData = await response.json();
        } else {
            // 🔒 Normal Mode - SECURE VERCEL API SE SIRF STATUS MANGO
            const response = await fetch('/api/verify-passcode', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memoryId: memoryId, requestType: 'status_check' })
            });
            const resData = await response.json();
            
            if (!resData.success) {
                document.body.innerHTML = '<h2 style="text-align:center; margin-top:20vh; color:#cc0033;">Surprise Not Found! 💔</h2>'; return;
            }
            
            window.viewerState.memoryData = resData.publicData;

            if (window.viewerState.memoryData.girlfriend_name) {
                const gfName = encodeURIComponent(window.viewerState.memoryData.girlfriend_name.trim());
                window.history.replaceState(null, '', `?id=${memoryId}&for=${gfName}`);
            }
        }

        const md = window.viewerState.memoryData;
        if (md && md.is_enabled === false && mode !== 'admin_preview') {
            document.body.innerHTML = `<div style="text-align:center; margin-top:25vh; padding: 20px;"><i class="fa-solid fa-eye-slash" style="font-size: 60px; color: #94a3b8; margin-bottom: 20px;"></i><h2 style="color:#334155;">Access Denied</h2><p>This surprise is currently hidden.</p></div>`; return; 
        }

        if (!md || md.status !== "locked") {
            document.body.innerHTML = '<h2 style="text-align:center; margin-top:20vh; color:#cc0033;">Surprise is not ready yet! 💔</h2>'; return;
        }

        startBackgroundParticles();

        let isMasterUnlocked = false;
        if (mode !== 'admin_preview' && mode !== 'preview') {
            const savedPasscode = sessionStorage.getItem(`auth_${memoryId}`);
            if (savedPasscode) {
                // Background unlock agar session pehle se hai
                const unlockRes = await fetch('/api/verify-passcode', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ memoryId: memoryId, enteredPasscode: savedPasscode, requestType: 'unlock' })
                });
                const unlockData = await unlockRes.json();
                if (unlockData.success) {
                    window.viewerState.memoryData = unlockData.memoryData; // 🟢 FULL DATA LOADED
                    window.viewerState.userPasscode = savedPasscode;
                    isMasterUnlocked = true;
                }
            }
        }

        if (mode === 'admin_preview' || mode === 'preview' || isMasterUnlocked) {
            await window.loadViewerComponent('surprise', 'surprise-mount');
            await window.loadViewerComponent('layout', 'footer-mount'); 
            document.getElementById('surprise-mount').classList.remove('hidden');
            document.getElementById('footer-mount').classList.remove('hidden');
            if(document.getElementById('vault-mount')) document.getElementById('vault-mount').classList.add('hidden');
        } else {
            await window.loadViewerComponent('vault', 'vault-mount');
        }

    } catch (error) { alert("System Error: " + error.message); }
})();
