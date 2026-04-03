(async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const memoryId = urlParams.get('id');
    const mode = urlParams.get('mode'); 
    const mountPoint = document.getElementById('form-mount-point');

    if (!memoryId) {
        alert("Invalid Link! Memory ID missing.");
        window.location.href = "?mode=login";
        return;
    }

    // 🔴 Global Form State
    window.formState = {
        memoryId: memoryId,
        mode: mode,
        memoryData: null,
        userPasscode: ""
    };

    // Helper: Component Loader
    async function loadFormSection(sectionName) {
        try {
            const htmlRes = await fetch(`features/form/sections/${sectionName}/${sectionName}.html`);
            if (htmlRes.ok) mountPoint.innerHTML = await htmlRes.text();
            else throw new Error("HTML fetch failed");

            const cssId = `css-form-${sectionName}`;
            if (!document.getElementById(cssId)) {
                const link = document.createElement('link'); link.id = cssId; link.rel = 'stylesheet'; link.href = `features/form/sections/${sectionName}/${sectionName}.css`; document.head.appendChild(link);
            }

            const scriptId = `js-form-${sectionName}`;
            if (!document.getElementById(scriptId)) {
                const script = document.createElement('script'); script.id = scriptId; script.src = `features/form/sections/${sectionName}/${sectionName}.js`; document.body.appendChild(script);
            }
        } catch (error) {
            console.error(error);
            mountPoint.innerHTML = '<div style="color:red; text-align:center;">Error loading module. Please refresh.</div>';
        }
    }

    // NAYA LOGIC: Securely status check karna
    async function checkStatus() {
        try {
            if (mode === 'admin_edit') {
                // Admin seedha Firebase se data mangwayega (Auth Token ke saath)
                const adminToken = localStorage.getItem('adminToken');
                const response = await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json?auth=${adminToken}`);
                window.formState.memoryData = await response.json();

                if (!window.formState.memoryData || window.formState.memoryData.error) {
                    alert("Order not found or permission denied!");
                    window.location.href = "?mode=login";
                    return;
                }
                await loadFormSection('editor');

            } else {
                // 🔒 NORMAL MODE (Boyfriend) - Vercel API se puchega (Taaki error na aaye)
                const response = await fetch('/api/verify-passcode', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ memoryId: memoryId, requestType: 'status_check' })
                });
                const resData = await response.json();

                if (!resData.success) {
                    alert("Order not found!");
                    window.location.href = "?mode=login";
                    return;
                }

                // Sirf public data save karega pehle
                window.formState.memoryData = resData.publicData;

                // Sahi Routing: Agar locked hai toh Dashboard, warna Editor
                if (window.formState.memoryData.status === "locked") {
                    await loadFormSection('dashboard');
                } else {
                    await loadFormSection('editor');
                }
            }
        } catch (error) {
            console.error("Error fetching data", error);
            mountPoint.innerHTML = '<div style="color:red; text-align:center;">Network error. Please try again.</div>';
        }
    }

    // Start
    checkStatus();
})();