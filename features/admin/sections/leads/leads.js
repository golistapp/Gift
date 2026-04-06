// Global Cache Object
window.adminDataCache = window.adminDataCache || {};

window.initAdminleads = function() {
    const tbody = document.getElementById('leads-tbody');
    const modal = document.getElementById('lead-success-modal');
    const baseUrl = window.location.origin + window.location.pathname;

    window.loadLeadsData = async function(forceRefresh = false) {
        if(!tbody) return;

        const now = Date.now();
        // 5 MINUTE CACHE SYSTEM (300000 ms)
        if (!forceRefresh && window.adminDataCache.leadsData && window.adminDataCache.leadsTime && (now - window.adminDataCache.leadsTime < 300000)) {
            renderLeadsTable(window.adminDataCache.leadsData);
            return;
        }

        try {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px;"><i class="fa-solid fa-spinner fa-spin"></i> Fetching latest leads...</td></tr>';
            const adminToken = localStorage.getItem('adminToken');
            const res = await fetch(`${firebaseConfig.databaseURL}/leads.json?auth=${adminToken}`);
            if (!res.ok) throw new Error("Auth Failed");

            const data = await res.json();

            // Save data to browser memory (Cache)
            window.adminDataCache.leadsData = data;
            window.adminDataCache.leadsTime = Date.now();

            renderLeadsTable(data);
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="4" style="color:red; text-align:center;">Error loading leads!</td></tr>';
        }
    };

    function renderLeadsTable(data) {
        if(!tbody) return;
        tbody.innerHTML = '';

        if (!data || data.error) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">No new leads available.</td></tr>';
            return;
        }

        let hasLeads = false;
        Object.keys(data).forEach(key => {
            if(typeof data[key] === 'object') {
                hasLeads = true;
                const lead = data[key];
                const dateStr = lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A';

                const cleanNum = lead.mobile ? String(lead.mobile).replace(/\D/g,'') : '';

                // Premium Contact Message
                const waText = `Hello ${lead.name}! ❤️\n\nWelcome to GiftoraX. We received your request to create a magical surprise. Please reply to confirm your order so our team can start setting up your secure vault. ✨\n\n- Team GiftoraX`;
                const waLink = `https://wa.me/91${cleanNum}?text=${encodeURIComponent(waText)}`;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><small style="color:#64748b">${dateStr}</small></td>
                    <td><strong>${lead.name}</strong><br><small style="color:#64748b">${lead.email}</small></td>
                    <td>
                        <strong>${lead.mobile}</strong><br>
                        <button class="contact-wa-btn" style="margin-top:5px;" onclick="window.open('${waLink}', '_blank')"><i class="fa-brands fa-whatsapp"></i> Chat Now</button>
                    </td>
                    <td>
                        <button class="btn-approve" onclick="window.approveLead('${key}', '${lead.name}', '${lead.mobile}', '${lead.email}')"><i class="fa-solid fa-check"></i> Approve</button>
                        <button class="btn-reject" onclick="window.rejectLead('${key}')"><i class="fa-solid fa-xmark"></i> Reject</button>
                    </td>
                `;
                tbody.prepend(tr); // Naye upar
            }
        });

        if(!hasLeads) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">No new leads available.</td></tr>';
    }

    // ID Generator Helper
    async function getNextMemoryId() {
        const adminToken = localStorage.getItem('adminToken');
        const res = await fetch(`${firebaseConfig.databaseURL}/memories.json?auth=${adminToken}`);
        const data = await res.json();
        let maxNum = 0;
        if (data && !data.error) {
            Object.keys(data).forEach(id => {
                if (id.startsWith('GX-')) {
                    const num = parseInt(id.split('-')[1], 10);
                    if (!isNaN(num) && num > maxNum) maxNum = num;
                }
            });
        }
        return `GX-${(maxNum + 1).toString().padStart(2, '0')}`;
    }

    // Approve Lead Logic
    window.approveLead = async (leadId, name, mobile, email) => {
        if(!confirm("Create a new order for this lead?")) return;

        try {
            const adminToken = localStorage.getItem('adminToken');
            const newMemoryId = await getNextMemoryId();

            const initialData = { 
                customer_name: name, mobile_number: mobile, customer_email: email, 
                status: "empty", is_enabled: true, created_at: new Date().toISOString() 
            };

            await fetch(`${firebaseConfig.databaseURL}/memories/${newMemoryId}.json?auth=${adminToken}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(initialData)
            });

            await fetch(`${firebaseConfig.databaseURL}/leads/${leadId}.json?auth=${adminToken}`, { method: 'DELETE' });

            document.getElementById('lead-new-id').innerText = newMemoryId;
            const formLink = `${baseUrl}?mode=form&id=${newMemoryId}`;
            document.getElementById('lead-form-link').value = formLink;

            const shareMsg = `Hello ${name}! ❤️\n\nAapka Memory Gift create ho gaya hai. Kripya niche diye link par apni memories aur details fill karein:\n\n🔗 Link: ${formLink}\n\nThank you!`;
            const waLinkUrl = `https://wa.me/91${String(mobile).replace(/\D/g,'')}?text=${encodeURIComponent(shareMsg)}`;
            document.getElementById('lead-wa-share-btn').onclick = () => window.open(waLinkUrl, '_blank');

            modal.classList.remove('hidden');

            // Force refresh data to clear deleted lead from cache
            window.loadLeadsData(true); 

        } catch(e) { alert("Error approving lead!"); }
    };

    // Reject Lead Logic
    window.rejectLead = async (leadId) => {
        if(!confirm("Are you sure you want to delete this lead?")) return;
        try {
            const adminToken = localStorage.getItem('adminToken');
            await fetch(`${firebaseConfig.databaseURL}/leads/${leadId}.json?auth=${adminToken}`, { method: 'DELETE' });
            window.loadLeadsData(true); // Force refresh cache
        } catch(e) { alert("Error rejecting lead!"); }
    };

    document.getElementById('close-lead-modal')?.addEventListener('click', () => modal.classList.add('hidden'));

    window.loadLeadsData();
};

// 🔴 YEH LINE CHHOOT GAYI THI PICHHLI BAAR! 
window.initAdminleads();