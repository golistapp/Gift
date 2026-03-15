// --- 1. ROUTE PROTECTION & LOGOUT ---
if (!localStorage.getItem('adminToken')) {
    window.location.href = 'login.html';
}

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    window.location.href = 'login.html';
});

document.addEventListener('DOMContentLoaded', () => {
    const generateForm = document.getElementById('generate-form');
    const generateBtn = document.getElementById('generate-btn');
    const downloadQrBtn = document.getElementById('download-qr-btn'); 
    
    // Yahan tumhara exact GitHub Pages ka base link aayega
    let baseUrl = "https://golistapp.github.io/Gift"; 

    // --- 2. LOAD DASHBOARD DATA (LIVE ANALYTICS & TABLE) ---
    async function loadDashboardData() {
        const tbody = document.getElementById('orders-tbody');
        try {
            const response = await fetch(`${firebaseConfig.databaseURL}/memories.json`);
            const data = await response.json();
            
            tbody.innerHTML = '';
            let total = 0, empty = 0, locked = 0;

            if (!data) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No orders found.</td></tr>';
                updateStats(0, 0, 0);
                return;
            }

            Object.keys(data).reverse().forEach(id => {
                const memory = data[id];
                total++;
                if(memory.status === 'locked') locked++;
                else empty++;

                const statusBadge = memory.status === 'locked' 
                    ? `<span class="badge badge-locked">Locked (Ready)</span>` 
                    : `<span class="badge badge-empty">Pending</span>`;

                const formLink = `${baseUrl}/form/form.html?id=${id}`;
                const viewLink = `${baseUrl}/?id=${id}`;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${id}</strong><br><small style="color:#64748b">${memory.customer_name}</small></td>
                    <td>${statusBadge}</td>
                    <td style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button class="action-btn" style="color: #3b82f6;" title="Copy Form Link" onclick="copyToClipboard('${formLink}')"><i class="fa-solid fa-link"></i></button>
                        <button class="action-btn" style="color: #8b5cf6;" title="Admin Edit (Bypass Passcode)" onclick="window.open('${formLink}&mode=admin_edit', '_blank')"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="action-btn" style="color: #10b981;" title="Admin Preview (No Time Tracking)" onclick="window.open('${viewLink}&mode=admin_preview', '_blank')"><i class="fa-solid fa-eye"></i></button>
                        
                        <button class="action-btn" style="color: #ec4899;" title="Download QR Code" onclick="downloadTableQR('${viewLink}', '${id}')"><i class="fa-solid fa-qrcode"></i></button>
                        
                        <button class="action-btn" style="color: #f59e0b;" title="Advanced Reset" onclick="openResetModal('${id}')"><i class="fa-solid fa-rotate-right"></i></button>
                        <button class="action-btn" style="color: #ef4444;" title="Delete Forever" onclick="deleteMemory('${id}')"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            updateStats(total, empty, locked);

        } catch (error) {
            console.error("Data Load Error:", error);
            tbody.innerHTML = '<tr><td colspan="3" style="color:red; text-align:center;">Failed to load data.</td></tr>';
        }
    }

    function updateStats(t, e, l) {
        document.getElementById('stat-total').innerText = t;
        document.getElementById('stat-empty').innerText = e;
        document.getElementById('stat-locked').innerText = l;
    }

    loadDashboardData();

    // --- 3. CREATE NEW ORDER ---
    function generateMemoryId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let id = '';
        for (let i = 0; i < 6; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
        return id;
    }

    generateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const cName = document.getElementById('customer-name').value;
        const cMobile = document.getElementById('customer-mobile').value;
        generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
        generateBtn.disabled = true;

        try {
            const memoryId = generateMemoryId();
            const initialData = {
                customer_name: cName, mobile_number: cMobile, status: "empty", created_at: new Date().toISOString()
            };

            await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(initialData)
            });

            const formUrl = `${baseUrl}/form/form.html?id=${memoryId}`;
            const viewUrl = `${baseUrl}/?id=${memoryId}`; 

            document.getElementById('display-id').innerText = memoryId;
            document.getElementById('form-link').value = formUrl;
            document.getElementById('view-link').value = viewUrl;

            const qrcodeContainer = document.getElementById('qrcode-container');
            qrcodeContainer.innerHTML = ''; 
            new QRCode(qrcodeContainer, { text: viewUrl, width: 200, height: 200 });

            document.getElementById('result-section').classList.remove('hidden');
            loadDashboardData();
            generateForm.reset();

        } catch (error) {
            alert("Error generating QR.");
        } finally {
            generateBtn.innerHTML = '<i class="fa-solid fa-qrcode"></i> Generate QR & Links';
            generateBtn.disabled = false;
        }
    });

    // --- 4. DOWNLOAD QR CODE LOGIC (MAIN & TABLE) ---
    downloadQrBtn.addEventListener('click', () => {
        const qrcodeContainer = document.getElementById('qrcode-container');
        downloadCanvasAsImage(qrcodeContainer, document.getElementById('display-id').innerText);
    });

    window.downloadTableQR = (url, id) => {
        const hiddenContainer = document.getElementById('hidden-qr-container');
        hiddenContainer.innerHTML = ''; 
        new QRCode(hiddenContainer, { text: url, width: 300, height: 300 });
        
        // Wait for 300ms for QR to render in background
        setTimeout(() => {
            downloadCanvasAsImage(hiddenContainer, id);
        }, 300);
    }

    function downloadCanvasAsImage(container, id) {
        const canvas = container.querySelector('canvas');
        const img = container.querySelector('img');
        let dataUrl = '';
        if (img && img.src && img.src.startsWith('data:image')) {
            dataUrl = img.src;
        } else if (canvas) {
            dataUrl = canvas.toDataURL("image/png");
        } else {
            alert("Please wait, QR code is generating..."); return;
        }

        const link = document.createElement('a');
        link.download = `MemoryGift_QR_${id}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- 5. ADVANCED RESET SYSTEM LOGIC ---
    let currentResetId = null;
    const resetModal = document.getElementById('reset-modal');
    
    window.openResetModal = (id) => {
        currentResetId = id;
        document.getElementById('reset-memory-id').innerText = id;
        resetModal.classList.remove('hidden');
    }

    document.getElementById('close-reset-modal').addEventListener('click', () => {
        resetModal.classList.add('hidden');
        currentResetId = null;
    });

    // Option 1: Full Reset
    document.getElementById('btn-reset-full').addEventListener('click', async () => {
        if(!confirm("Are you sure? This will delete ALL photos, text, and passwords.")) return;
        await resetData({
            status: "empty", passcode: null, music_id: null, message_text: null, girlfriend_name: null,
            open_when_happy: null, open_when_sad: null, open_when_miss_me: null, open_when_cant_sleep: null,
            girlfriend_message: null, locked_at: null, scanned_at: null, proposal_accepted_at: null,
            image_1_url: null, caption_1: null, image_2_url: null, caption_2: null,
            image_3_url: null, caption_3: null, image_4_url: null, caption_4: null,
            image_5_url: null, caption_5: null
        });
    });

    // Option 2: Reset Text Only
    document.getElementById('btn-reset-text').addEventListener('click', async () => {
        if(!confirm("Are you sure? This will delete all TEXT and Passcode. Photos will remain safe.")) return;
        await resetData({
            status: "empty", passcode: null, message_text: null, girlfriend_name: null,
            open_when_happy: null, open_when_sad: null, open_when_miss_me: null, open_when_cant_sleep: null,
            girlfriend_message: null, locked_at: null, scanned_at: null, proposal_accepted_at: null
        });
    });

    // Option 3: Reset Images Only
    document.getElementById('btn-reset-images').addEventListener('click', async () => {
        if(!confirm("Are you sure? This will delete all 5 PHOTOS. Text and Passcode will remain safe.")) return;
        await resetData({
            status: "empty", locked_at: null, scanned_at: null, proposal_accepted_at: null,
            image_1_url: null, caption_1: null, image_2_url: null, caption_2: null,
            image_3_url: null, caption_3: null, image_4_url: null, caption_4: null,
            image_5_url: null, caption_5: null
        });
    });

    async function resetData(payload) {
        try {
            await fetch(`${firebaseConfig.databaseURL}/memories/${currentResetId}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            alert("Reset Successful! Status changed to Pending.");
            resetModal.classList.add('hidden');
            loadDashboardData();
        } catch(e) { alert("Error resetting."); }
    }

    // --- 6. DELETE LOGIC ---
    window.deleteMemory = async (id) => {
        if(confirm(`DANGER! Kya aap ID: ${id} ko hamesha ke liye delete karna chahte hain?`)) {
            try {
                await fetch(`${firebaseConfig.databaseURL}/memories/${id}.json`, { method: 'DELETE' });
                alert("Deleted successfully.");
                loadDashboardData();
            } catch(e) { alert("Error deleting."); }
        }
    }

    window.copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("Link Copied!");
    }
});
