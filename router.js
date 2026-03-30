document.addEventListener('DOMContentLoaded', () => {
    const appRoot = document.getElementById('app-root');
    const loader = document.getElementById('app-loader');

    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const memoryId = urlParams.get('id');

    // 🔴 NAYA LOGIC: Default module ab 'master' hoga
    let currentModule = 'master'; 

    if (mode === 'admin') {
        currentModule = 'admin';
    } else if (mode === 'login') {
        currentModule = 'login';
    } else if (mode === 'form' || (memoryId && mode === 'admin_edit')) {
        currentModule = 'form';
    } else if (memoryId || mode === 'admin_preview' || mode === 'preview') {
        currentModule = 'viewer';
    } else {
        currentModule = 'master'; // Koi ID/mode nahi hai toh Master Portal load karo
    }

    async function loadAppModule(moduleName) {
        try {
            const response = await fetch(`features/${moduleName}/${moduleName}.html`);
            if (!response.ok) throw new Error("Module HTML not found");
            appRoot.innerHTML = await response.text();

            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = `features/${moduleName}/${moduleName}.css`;
            cssLink.id = `style-${moduleName}`;
            document.head.appendChild(cssLink);

            const scriptTag = document.createElement('script');
            scriptTag.src = `features/${moduleName}/${moduleName}.js`;
            scriptTag.id = `script-${moduleName}`;
            document.body.appendChild(scriptTag);

            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 300);
            }, 500);

        } catch (error) {
            console.error(`Error loading module: ${moduleName}`, error);
            appRoot.innerHTML = `<div style="text-align:center; padding:50px;"><h2>Error 404</h2><p>Page failed to load.</p></div>`;
            loader.style.display = 'none';
        }
    }

    loadAppModule(currentModule);
});