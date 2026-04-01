(async function() {
    const state = window.viewerState;
    if (!state || !state.memoryData) return;

    async function loadSurpriseSection(sectionName, mountId) {
        const mountNode = document.getElementById(mountId);
        if (!mountNode) return;

        try {
            const htmlRes = await fetch(`features/viewer/components/surprise/sections/${sectionName}/${sectionName}.html`);
            if (htmlRes.ok) mountNode.innerHTML = await htmlRes.text();

            const scriptId = `js-surprise-${sectionName}`;
            if (!document.getElementById(scriptId)) {
                const script = document.createElement('script');
                script.id = scriptId;
                script.src = `features/viewer/components/surprise/sections/${sectionName}/${sectionName}.js`;
                document.body.appendChild(script);
            }
        } catch (error) {
            console.error(`Error loading surprise section: ${sectionName}`, error);
        }
    }

    await loadSurpriseSection('hero', 'surprise-hero-mount');
    await loadSurpriseSection('envelope', 'surprise-envelope-mount');
    await loadSurpriseSection('gallery', 'surprise-gallery-mount');
    await loadSurpriseSection('reasons', 'surprise-reasons-mount'); 
    await loadSurpriseSection('futureplans', 'surprise-futureplans-mount');
    await loadSurpriseSection('openwhen', 'surprise-openwhen-mount'); 
    await loadSurpriseSection('proposal', 'surprise-proposal-mount');
    await loadSurpriseSection('gift', 'surprise-gift-mount');
    
    // 🔴 NAYA COMMAND: Share section ko sabse aakhir mein load karna hai
    await loadSurpriseSection('share-section', 'surprise-share-mount');

})();