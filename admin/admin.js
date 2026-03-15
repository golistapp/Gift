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

                // 🔴 Updated Form Link Structure
                const formLink = `${baseUrl}/form/form.html?id=${id}`;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${id}</strong><br><small style="color:#64748b">${memory.customer_name}</small></td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="action-btn" style="color: #3b82f6;" title="Copy Form Link" onclick="copyToClipboard('${formLink}')"><i class="fa-solid fa-link"></i></button>
                        <button class="action-btn" style="color: #8b5cf6;" title="Edit/View Form" onclick="window.open('${formLink}', '_blank')"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="action-btn" style="color: #f59e0b;" title="Reset Memory" onclick="resetMemory('${id}')"><i class="fa-solid fa-rotate-right"></i></button>
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

            // 🔴 Naye paths root SPA structure ke hisaab se
            const formUrl = `${baseUrl}/form/form.html?id=${memoryId}`;
            const viewUrl = `${baseUrl}/?id=${memoryId}`; 

            document.getElementById('display-id').innerText = memoryId;
            document.getElementById('form-link').value = formUrl;
            document.getElementById('view-link').value = viewUrl;

            const qrcodeContainer = document.getElementById('qrcode-container');
            qrcodeContainer.innerHTML = ''; 
            new QRCode(qrcodeContainer, { text: viewUrl, width: 130, height: 130 });

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

    // Copy Links Logic
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const inputEl = document.getElementById(btn.getAttribute('data-target'));
            copyToClipboard(inputEl.value);
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy', 2000);
        });
    });
    
    window.copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("Link Copied!");
    }

    // --- 4. RESET MEMORY LOGIC ---
    window.resetMemory = async (id) => {
        if(confirm(`Are you sure you want to RESET memory ID: ${id}? Yeh photos aur text mita dega.`)) {
            try {
                await fetch(`${firebaseConfig.databaseURL}/memories/${id}.json`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: "empty" })
                });
                alert("Memory Reset Successful! Client dobara form bhar sakta hai.");
                loadDashboardData();
            } catch(e) { alert("Error resetting."); }
        }
    }

    // --- 5. DELETE MEMORY LOGIC ---
    window.deleteMemory = async (id) => {
        if(confirm(`DANGER! Kya aap ID: ${id} ko hamesha ke liye delete karna chahte hain?`)) {
            try {
                await fetch(`${firebaseConfig.databaseURL}/memories/${id}.json`, { method: 'DELETE' });
                alert("Deleted successfully.");
                loadDashboardData();
            } catch(e) { alert("Error deleting."); }
        }
    }
});