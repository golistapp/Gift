(async function() {
    const state = window.viewerState;
    if (!state || !state.memoryData) return;

    // Helper function: Chhote sections ko fetch aur load karne ke liye
    async function loadSurpriseSection(sectionName, mountId) {
        const mountNode = document.getElementById(mountId);
        if (!mountNode) return;

        try {
            // HTML fetch karega (jisme humari <style> CSS bhi hogi)
            const htmlRes = await fetch(`features/viewer/components/surprise/sections/${sectionName}/${sectionName}.html`);
            if (htmlRes.ok) mountNode.innerHTML = await htmlRes.text();

            // JS fetch karega
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

    // Saare sections ko unke mount point par load karna
    await loadSurpriseSection('hero', 'surprise-hero-mount');
    await loadSurpriseSection('envelope', 'surprise-envelope-mount');
    await loadSurpriseSection('gallery', 'surprise-gallery-mount');
    await loadSurpriseSection('proposal', 'surprise-proposal-mount');
    await loadSurpriseSection('gift', 'surprise-gift-mount');

})();