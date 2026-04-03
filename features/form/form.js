(async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const memoryId = urlParams.get('id');
    const mode = urlParams.get('mode'); // 'admin_edit' check karne ke liye
    const mountPoint = document.getElementById('form-mount-point');

    if (!memoryId) {
        alert("Invalid Link! Memory ID missing.");
        window.location.href = "?mode=login";
        return;
    }

    // 🔴 IMPORTANT: Global Form State banaya taki aage ke sections data share kar sakein
    window.formState = {
        memoryId: memoryId,
        mode: mode,
        memoryData: null,
        userPasscode: ""
    };

    // Helper function: Chhote sections ko dynamically load karne ke liye
    async function loadFormSection(sectionName) {
        try {
            // HTML load karna
            const htmlRes = await fetch(`features/form/sections/${sectionName}/${sectionName}.html`);
            if (htmlRes.ok) {
                mountPoint.innerHTML = await htmlRes.text();
            } else {
                throw new Error("HTML fetch failed");
            }

            // CSS load karna (agar pehle se nahi hai)
            const cssId = `css-form-${sectionName}`;
            if (!document.getElementById(cssId)) {
                const link = document.createElement('link');
                link.id = cssId;
                link.rel = 'stylesheet';
                link.href = `features/form/sections/${sectionName}/${sectionName}.css`;
                document.head.appendChild(link);
            }

            // JS load karna (agar pehle se nahi hai)
            const scriptId = `js-form-${sectionName}`;
            if (!document.getElementById(scriptId)) {
                const script = document.createElement('script');
                script.id = scriptId;
                script.src = `features/form/sections/${sectionName}/${sectionName}.js`;
                document.body.appendChild(script);
            }
        } catch (error) {
            console.error(`Error loading form section: ${sectionName}`, error);
            mountPoint.innerHTML = '<div style="color:red; text-align:center;">Error loading module. Please refresh.</div>';
        }
    }

    // Data fetch karke route decide karna
    async function checkStatus() {
        try {
            const response = await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`);
            window.formState.memoryData = await response.json();

            if (!window.formState.memoryData) {
                alert("Order not found!");
                window.location.href = "?mode=login";
                return;
            }

            // Route Logic
            if (mode === 'admin_edit') {
                await loadFormSection('editor');
            } else if (window.formState.memoryData.status === "locked") {
                await loadFormSection('dashboard');
            } else {
                await loadFormSection('editor');
            }
        } catch (error) {
            console.error("Error fetching data", error);
            mountPoint.innerHTML = '<div style="color:red; text-align:center;">Network error. Please try again.</div>';
        }
    }

    // Start
    checkStatus();
})();
