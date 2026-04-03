(async function() {
    const state = window.viewerState;
    if (!state || !state.memoryData) return;

    // 🔴 IMPORTANT: Global Booth State banaya taki teeno sections data share kar sakein
    window.boothState = {
        stream: null,
        userImage: null, // Canvas data of original photo
        currentFrame: 'valentine' // Default frame
    };

    // Helper function: Chhote sections ko fetch aur load karne ke liye
    async function loadBoothSection(sectionName, mountId) {
        const mountNode = document.getElementById(mountId);
        if (!mountNode) return;

        try {
            // HTML aur CSS load karna
            const htmlRes = await fetch(`features/viewer/components/booth/sections/${sectionName}/${sectionName}.html`);
            if (htmlRes.ok) mountNode.innerHTML = await htmlRes.text();

            // JS load karna
            const scriptId = `js-booth-${sectionName}`;
            if (!document.getElementById(scriptId)) {
                const script = document.createElement('script');
                script.id = scriptId;
                script.src = `features/viewer/components/booth/sections/${sectionName}/${sectionName}.js`;
                document.body.appendChild(script);
            }
        } catch (error) {
            console.error(`Error loading booth section: ${sectionName}`, error);
        }
    }

    // Teeno naye sections ko unke mount point par load karna
    await loadBoothSection('display', 'booth-display-mount');
    await loadBoothSection('controls', 'booth-controls-mount');
    await loadBoothSection('thumbnails', 'booth-thumbnails-mount');
    
})();
