document.addEventListener('DOMContentLoaded', () => {
    const appRoot = document.getElementById('app-root');
    const loader = document.getElementById('app-loader');

    // URL parameters check karna
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const memoryId = urlParams.get('id');

    // Decide karna ki kaunsa module load karna hai
    let currentModule = 'viewer'; // Default Girlfriend ka page

    if (mode === 'admin') {
        currentModule = 'admin';
    } else if (mode === 'login') {
        currentModule = 'login';
    } else if (mode === 'form' || (memoryId && mode === 'admin_edit')) {
        currentModule = 'form';
    } else if (!memoryId && mode !== 'admin_preview') {
        // Agar link galat hai aur kuch nahi hai, toh login par bhej do ya error dikhao
        currentModule = 'login'; 
    }

    // Function: Module ko fetch aur load karna
    async function loadAppModule(moduleName) {
        try {
            // 1. HTML Fetch karke inject karna
            const response = await fetch(`features/${moduleName}/${moduleName}.html`);
            if (!response.ok) throw new Error("Module HTML not found");
            const htmlText = await response.text();
            appRoot.innerHTML = htmlText;

            // 2. Us module ki CSS load karna
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = `features/${moduleName}/${moduleName}.css`;
            cssLink.id = `style-${moduleName}`;
            document.head.appendChild(cssLink);

            // 3. Us module ki JS load karna
            const scriptTag = document.createElement('script');
            scriptTag.src = `features/${moduleName}/${moduleName}.js`;
            scriptTag.id = `script-${moduleName}`;
            document.body.appendChild(scriptTag);

            // 4. Loading screen hatana (thora delay dekar taki smooth lage)
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 300);
            }, 500);

        } catch (error) {
            console.error(`Error loading module: ${moduleName}`, error);
            appRoot.innerHTML = `<div style="text-align:center; padding:50px;"><h2>Error 404</h2><p>Page failed to load. Please check your internet connection or the link.</p></div>`;
            loader.style.display = 'none';
        }
    }

    // Module load karna shuru karein
    loadAppModule(currentModule);
});