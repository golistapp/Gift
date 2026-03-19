(async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const memoryId = urlParams.get('id');
    const mode = urlParams.get('mode'); 

    if (!memoryId) {
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
        memoryId: memoryId,
        mode: mode,
        memoryData: null,
        userPasscode: "",
        isMusicPlaying: false
    };

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
        const response = await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`);

        // Agar response thik nahi hai toh error throw karega
        if (!response.ok) throw new Error("Firebase returned " + response.status);

        window.viewerState.memoryData = await response.json();

        if (!window.viewerState.memoryData || window.viewerState.memoryData.status !== "locked") {
            document.body.innerHTML = '<h2 style="text-align:center; margin-top:20vh; color:#cc0033;">Surprise is not ready yet! 🎁</h2>';
            return;
        }

        // Routing Logic
        if (mode === 'admin_preview') {
            await window.loadViewerComponent('surprise', 'surprise-mount');
            await window.loadViewerComponent('layout', 'footer-mount'); 

            document.getElementById('surprise-mount').classList.remove('hidden');
            document.getElementById('footer-mount').classList.remove('hidden');
            const vaultMount = document.getElementById('vault-mount');
            if(vaultMount) vaultMount.classList.add('hidden');
        } else {
            await window.loadViewerComponent('vault', 'vault-mount');
        }

    } catch (error) {
        console.error("Fetch Error:", error);
        // Ab agar koi error aayega toh exact reason batayega!
        alert("System Error: " + error.message);
    }
})();