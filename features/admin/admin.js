(async function() {
    // --- 1. ROUTE PROTECTION ---
    if (!localStorage.getItem('adminToken')) {
        window.location.href = '?mode=login';
        return;
    }

    const logoutBtn = document.getElementById('logout-btn');
    const mountPoint = document.getElementById('admin-mount-point');
    const tabs = document.querySelectorAll('.admin-tab');
    const timerDisplay = document.querySelector('#session-timer span');

    window.adminState = { currentTab: 'overview' };

    // --- 2. 30-MINUTE AUTO LOGOUT ---
    let idleTime = 30 * 60;
    let idleTimer;
    function resetIdleTimer() { idleTime = 30 * 60; }
    function startTimer() {
        idleTimer = setInterval(() => {
            idleTime--;
            let m = Math.floor(idleTime / 60);
            let s = idleTime % 60;
            if(timerDisplay) timerDisplay.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
            if (idleTime <= 0) {
                clearInterval(idleTimer);
                alert("Session Expired! Please login again.");
                localStorage.removeItem('adminToken');
                window.location.href = '?mode=login';
            }
        }, 1000);
    }
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keypress', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer);
    startTimer();

    logoutBtn.addEventListener('click', () => {
        if(confirm("Are you sure you want to logout?")) {
            localStorage.removeItem('adminToken');
            window.location.href = '?mode=login';
        }
    });

    // --- 3. DYNAMIC MODULE LOADER ---
    async function loadAdminSection(sectionName) {
        try {
            mountPoint.innerHTML = '<div style="text-align: center; padding: 50px;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 30px; color: #3b82f6;"></i></div>';
            const htmlRes = await fetch(`features/admin/sections/${sectionName}/${sectionName}.html`);
            if (htmlRes.ok) mountPoint.innerHTML = await htmlRes.text();

            const cssId = `css-admin-${sectionName}`;
            if (!document.getElementById(cssId)) {
                const link = document.createElement('link');
                link.id = cssId; link.rel = 'stylesheet'; link.href = `features/admin/sections/${sectionName}/${sectionName}.css`;
                document.head.appendChild(link);
            }

            const scriptId = `js-admin-${sectionName}`;
            if (!document.getElementById(scriptId)) {
                const script = document.createElement('script');
                script.id = scriptId; script.src = `features/admin/sections/${sectionName}/${sectionName}.js`;
                document.body.appendChild(script);
            } else {
                if(window[`initAdmin${sectionName}`]) window[`initAdmin${sectionName}`]();
            }
        } catch (error) {
            mountPoint.innerHTML = '<div style="color:red; text-align:center; padding: 50px;">Error loading module!</div>';
        }
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-target');
            window.adminState.currentTab = target;
            loadAdminSection(target);
        });
    });
    loadAdminSection('overview');

    // --- 4. FAB & MODAL LOGIC ---
    const fabBtn = document.getElementById('fab-create-btn');
    const bottomSheet = document.getElementById('create-order-sheet');
    const closeSheetBtn = document.getElementById('close-sheet-btn');

    fabBtn.addEventListener('click', () => bottomSheet.classList.remove('hidden'));
    closeSheetBtn.addEventListener('click', () => bottomSheet.classList.add('hidden'));
    bottomSheet.addEventListener('click', (e) => {
        if (e.target === bottomSheet) bottomSheet.classList.add('hidden'); 
    });

    // --- 5. QR GENERATION & ID LOGIC ---
    if (!window.QRCode) {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
        document.head.appendChild(script);
    }

    const generateForm = document.getElementById('generate-form');
    const generateBtn = document.getElementById('generate-btn');
    const baseUrl = window.location.origin + window.location.pathname;

       window.copyToClipboard = (text) => {
        // HTTP aur bina HTTPS wale local network ke liye fallback hack
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => alert("Link Copied Successfully! 🔗"));
        } else {
            let textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                alert("Link Copied Successfully! 🔗");
            } catch (err) {
                alert("Copy failed. Please copy manually.");
            }
            textArea.remove();
        }
    };


    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.getAttribute('data-target');
            window.copyToClipboard(document.getElementById(targetId).value);
        });
    });

    // Smart Auto ID Generation (Max + 1)
    async function getNextMemoryId() {
        try {
            const res = await fetch(`${firebaseConfig.databaseURL}/memories.json`);
            const data = await res.json();
            let maxNum = 0;
            if (data) {
                Object.keys(data).forEach(id => {
                    if (id.startsWith('GX-')) {
                        const num = parseInt(id.split('-')[1], 10);
                        if (!isNaN(num) && num > maxNum) maxNum = num;
                    }
                });
            }
            const nextNum = maxNum + 1;
            return `GX-${nextNum.toString().padStart(2, '0')}`;
        } catch (e) {
            return "GX-01"; // Fallback if database is completely empty
        }
    }

    if(generateForm) {
        generateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const cName = document.getElementById('customer-name').value;
            const cMobile = document.getElementById('customer-mobile').value;
            
            generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
            generateBtn.disabled = true;

            try {
                const memoryId = await getNextMemoryId();
                const initialData = { 
                    customer_name: cName, 
                    mobile_number: cMobile, 
                    status: "empty", 
                    is_enabled: true, // Enable/Disable toggle functionality
                    created_at: new Date().toISOString() 
                };

                await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(initialData)
                });

                const formUrl = `${baseUrl}?mode=form&id=${memoryId}`;
                const viewUrl = `${baseUrl}?id=${memoryId}`; 

                document.getElementById('display-id').innerText = memoryId;
                document.getElementById('form-link').value = formUrl;
                document.getElementById('view-link').value = viewUrl;

                // WhatsApp Share Button Logic
                const waBtn = document.getElementById('wa-share-btn');
                if (waBtn) {
                    waBtn.onclick = () => {
                        const msg = `Hello ${cName}! ❤️\n\nAapka Memory Gift create ho gaya hai. Kripya niche diye link par apni memories aur details fill karein:\n\n🔗 Link: ${formUrl}\n\nThank you!`;
                        window.open(`https://wa.me/91${cMobile}?text=${encodeURIComponent(msg)}`, '_blank');
                    };
                }

                const qrcodeContainer = document.getElementById('qrcode-container');
                qrcodeContainer.innerHTML = ''; 
                setTimeout(() => {
                    new QRCode(qrcodeContainer, { text: viewUrl, width: 250, height: 250, colorDark : "#cc0033", colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.H });
                }, 200);

                document.getElementById('result-section').classList.remove('hidden');
                
                if(window.initAdminoverview) window.initAdminoverview(); 

            } catch (error) {
                alert("Error generating QR.");
            } finally {
                generateBtn.innerHTML = '<i class="fa-solid fa-qrcode"></i> Generate QR & Links';
                generateBtn.disabled = false;
            }
        });
    }

    // Custom Premium QR Downloader Logic
    document.getElementById('download-qr-btn').addEventListener('click', () => {
        const qrcodeContainer = document.getElementById('qrcode-container');
        const id = document.getElementById('display-id').innerText;
        const qrCanvas = qrcodeContainer.querySelector('canvas');
        const qrImg = qrcodeContainer.querySelector('img');
        let sourceImageSrc = '';
        
        if (qrImg && qrImg.src && qrImg.src.startsWith('data:image')) { sourceImageSrc = qrImg.src; } 
        else if (qrCanvas) { sourceImageSrc = qrCanvas.toDataURL("image/png"); } 
        else { alert("Please wait..."); return; }

        const finalCanvas = document.createElement('canvas');
        const ctx = finalCanvas.getContext('2d');
        const qrSize = 300, padding = 50; 
        
        finalCanvas.width = qrSize + (padding * 2);
        finalCanvas.height = qrSize + (padding * 2) + 60; 
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        
        const img = new Image(); img.crossOrigin = "Anonymous";
        img.onload = () => {
            ctx.drawImage(img, padding, padding, qrSize, qrSize);
            const centerX = finalCanvas.width / 2, centerY = padding + (qrSize / 2);
            ctx.beginPath(); ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI); ctx.fillStyle = "#ffffff"; ctx.fill();
            ctx.font = "40px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("❤️", centerX, centerY + 2);
            ctx.fillStyle = "#cc0033"; ctx.font = "bold 26px 'Poppins', sans-serif"; ctx.textBaseline = "alphabetic"; ctx.fillText("Scan Me 👉 🔗", finalCanvas.width / 2, finalCanvas.height - 30);
            
            const link = document.createElement('a');
            link.download = `Premium_MemoryGift_QR_${id}.png`;
            link.href = finalCanvas.toDataURL("image/png");
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
        };
        img.src = sourceImageSrc;
    });

})();