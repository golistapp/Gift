window.initAdminorders = function() {
    const tbody = document.getElementById('orders-tbody');
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const dateFilter = document.getElementById('date-filter');
    const exportBtn = document.getElementById('export-csv-btn');
    const resetModal = document.getElementById('reset-modal');
    const baseUrl = window.location.origin + window.location.pathname;

    let allOrders = [];

    window.loadOrdersData = async function() {
        if(!tbody) return;
        try {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Fetching Latest Data...</td></tr>';
            
            const adminToken = localStorage.getItem('adminToken');
            const response = await fetch(`${firebaseConfig.databaseURL}/memories.json?auth=${adminToken}`);
            if (!response.ok) throw new Error("Permission Denied / Token Expired");
            
            const data = await response.json();
            allOrders = [];
            
            // Kharab data ko skip karne ka logic
            if (data && !data.error) {
                Object.keys(data).forEach(id => {
                    if(id !== "error" && typeof data[id] === 'object') {
                        allOrders.push({ id, ...data[id] });
                    }
                });
                allOrders.reverse();
            }
            renderTable(); 
        } catch (e) {
            console.error(e);
            tbody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">Error loading data! Please check connection or login again.</td></tr>';
        }
    };

    function isWithinDate(dateString, filterType) {
        if (filterType === 'all') return true;
        if (!dateString) return false;
        const date = new Date(dateString);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
        if (filterType === 'today') return date >= today;
        if (filterType === 'yesterday') return date >= yesterday && date < today;
        if (filterType === 'week') return date >= weekAgo;
        return true;
    }

    function renderTable() {
        if(!tbody) return;
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const statusVal = statusFilter ? statusFilter.value : 'all';
        const dateVal = dateFilter ? dateFilter.value : 'all';

        const filteredOrders = allOrders.filter(order => {
            const matchSearch = String(order.id).toLowerCase().includes(searchTerm) || String(order.customer_name || '').toLowerCase().includes(searchTerm);
            const matchStatus = statusVal === 'all' || order.status === statusVal;
            const matchDate = isWithinDate(order.created_at, dateVal);
            return matchSearch && matchStatus && matchDate;
        });

        tbody.innerHTML = '';
        if (filteredOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#64748b;">No orders match your filter.</td></tr>';
            return;
        }

        filteredOrders.forEach(memory => {
            const dateObj = memory.created_at ? new Date(memory.created_at) : null;
            const dateStr = dateObj ? dateObj.toLocaleDateString() : 'N/A';
            const statusBadge = memory.status === 'locked' 
                ? `<span class="badge badge-locked">Locked (Ready)</span>` 
                : `<span class="badge badge-empty">Pending</span>`;

            const formLink = `${baseUrl}?mode=form&id=${memory.id}`;
            const adminEditLink = `${baseUrl}?mode=admin_edit&id=${memory.id}`;
            const viewAdminLink = `${baseUrl}?mode=admin_preview&id=${memory.id}`;
            const viewLink = `${baseUrl}?id=${memory.id}`;
            const isEnabled = memory.is_enabled !== false; 
            const tr = document.createElement('tr');
            
            const rawMsg = `Hello ${memory.customer_name || 'Customer'}! ❤️\n\nAapka Memory Gift create ho gaya hai. Kripya niche diye link par apni memories aur details fill karein:\n\n🔗 Link: ${formLink}\n\nThank you!`;
            const encodedMsg = encodeURIComponent(rawMsg);
            const cleanNumber = memory.mobile_number ? String(memory.mobile_number).replace(/\D/g,'') : '';
            const waLinkUrl = `https://wa.me/${cleanNumber ? '91'+cleanNumber : ''}?text=${encodedMsg}`;
            const smsLinkUrl = `sms:${cleanNumber ? '91'+cleanNumber : ''}?body=${encodedMsg}`;

            tr.innerHTML = `
                <td><strong>${memory.id}</strong><br><small style="color:#64748b">${dateStr}</small></td>
                <td><strong>${memory.customer_name || 'N/A'}</strong><br><small style="color:#64748b">${memory.mobile_number || 'N/A'}</small></td>
                <td>${statusBadge}</td>
                <td>
                    <label class="switch">
                        <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="window.toggleCustomerStatus('${memory.id}', this.checked)">
                        <span class="slider"></span>
                    </label>
                </td>
                <td style="min-width: 300px;"> 
                    <button class="action-btn" style="color: #3b82f6;" title="Copy Form Link" onclick="window.copyToClipboard('${formLink}')"><i class="fa-solid fa-link"></i></button>
                    <button class="action-btn" style="color: #25d366;" title="Share on WhatsApp" onclick="window.open('${waLinkUrl}', '_blank')"><i class="fa-brands fa-whatsapp"></i></button>
                    <button class="action-btn" style="color: #0ea5e9;" title="Share via SMS" onclick="window.open('${smsLinkUrl}', '_self')"><i class="fa-solid fa-comment-sms"></i></button>
                    <button class="action-btn" style="color: #8b5cf6;" title="Admin Edit" onclick="window.open('${adminEditLink}', '_blank')"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="action-btn" style="color: #10b981;" title="Admin Preview" onclick="window.open('${viewAdminLink}', '_blank')"><i class="fa-solid fa-eye"></i></button>
                    <button class="action-btn" style="color: #ec4899;" title="Download Custom QR" onclick="window.downloadTableQR('${viewLink}', '${memory.id}')"><i class="fa-solid fa-qrcode"></i></button>
                    <button class="action-btn" style="color: #f59e0b;" title="Advanced Reset" onclick="window.openResetModal('${memory.id}')"><i class="fa-solid fa-rotate-right"></i></button>
                    <button class="action-btn" style="color: #ef4444;" title="Delete Forever" onclick="window.deleteMemory('${memory.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    if (searchInput) searchInput.addEventListener('input', renderTable);
    if (statusFilter) statusFilter.addEventListener('change', renderTable);
    if (dateFilter) dateFilter.addEventListener('change', renderTable);

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            let csvContent = "data:text/csv;charset=utf-8,Order ID,Date,Customer Name,Mobile,Status\n";
            allOrders.forEach(o => {
                const dateStr = o.created_at ? new Date(o.created_at).toLocaleDateString() : 'N/A';
                csvContent += `${o.id},${dateStr},${o.customer_name || 'N/A'},${o.mobile_number || 'N/A'},${o.status}\n`;
            });
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `MemoryGift_Orders_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
        });
    }

    window.toggleCustomerStatus = async (id, status) => {
        try {
            const adminToken = localStorage.getItem('adminToken');
            const res = await fetch(`${firebaseConfig.databaseURL}/memories/${id}.json?auth=${adminToken}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_enabled: status })
            });
            if(!res.ok) throw new Error("Auth failed");
            const orderIndex = allOrders.findIndex(o => o.id === id);
            if(orderIndex > -1) allOrders[orderIndex].is_enabled = status;
        } catch (e) {
            alert("Error updating status."); window.loadOrdersData(); 
        }
    };

    window.openResetModal = (id) => {
        window.currentResetId = id;
        const resetText = document.getElementById('reset-memory-id');
        if(resetText) resetText.innerText = id;
        if(resetModal) resetModal.classList.remove('hidden');
    };

    const closeResetModalBtn = document.getElementById('close-reset-modal');
    if (closeResetModalBtn) closeResetModalBtn.addEventListener('click', () => { if(resetModal) resetModal.classList.add('hidden'); });

    async function resetData(payload) {
        try {
            const adminToken = localStorage.getItem('adminToken');
            const res = await fetch(`${firebaseConfig.databaseURL}/memories/${window.currentResetId}.json?auth=${adminToken}`, { 
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) 
            });
            if(!res.ok) throw new Error("Auth failed");
            alert("Reset Successful!");
            if(resetModal) resetModal.classList.add('hidden');
            window.loadOrdersData(); 
        } catch(e) { alert("Error resetting."); }
    }

    const btnResetFull = document.getElementById('btn-reset-full');
    if (btnResetFull) btnResetFull.addEventListener('click', async () => {
        if(confirm("Full reset? ALL data will be lost.")) {
            await resetData({ status: "empty", occasion: null, passcode: null, music_id: null, message_text: null, girlfriend_name: null, open_when_happy: null, open_when_sad: null, open_when_miss_me: null, open_when_cant_sleep: null, open_when_hug: null, open_when_sorry: null, locked_at: null, scanned_at: null, proposal_accepted_at: null, chat: null, message_count: null, image_1_url: null, caption_1: null, image_2_url: null, caption_2: null, image_3_url: null, caption_3: null, image_4_url: null, caption_4: null, image_5_url: null, caption_5: null });
        }
    });

    const btnResetText = document.getElementById('btn-reset-text');
    if (btnResetText) btnResetText.addEventListener('click', async () => {
        if(confirm("Reset Text only? Photos will be safe.")) {
            await resetData({ status: "empty", occasion: null, passcode: null, message_text: null, girlfriend_name: null, open_when_happy: null, open_when_sad: null, open_when_miss_me: null, open_when_cant_sleep: null, open_when_hug: null, open_when_sorry: null, locked_at: null, scanned_at: null, proposal_accepted_at: null, chat: null, message_count: null });
        }
    });

    const btnResetImages = document.getElementById('btn-reset-images');
    if (btnResetImages) btnResetImages.addEventListener('click', async () => {
        if(confirm("Reset Images only? Text will be safe.")) {
            await resetData({ status: "empty", image_1_url: null, caption_1: null, image_2_url: null, caption_2: null, image_3_url: null, caption_3: null, image_4_url: null, caption_4: null, image_5_url: null, caption_5: null });
        }
    });

    window.deleteMemory = async (id) => {
        if(confirm(`DANGER! Delete ID: ${id} forever?`)) {
            try {
                const adminToken = localStorage.getItem('adminToken');
                const res = await fetch(`${firebaseConfig.databaseURL}/memories/${id}.json?auth=${adminToken}`, { method: 'DELETE' });
                if(!res.ok) throw new Error("Auth failed");
                alert("Deleted successfully."); window.loadOrdersData();
            } catch(e) { alert("Error deleting."); }
        }
    };

    window.downloadTableQR = (url, id) => {
        const hiddenContainer = document.getElementById('hidden-qr-container');
        if(!hiddenContainer) return;
        hiddenContainer.innerHTML = ''; 
        new QRCode(hiddenContainer, { text: url, width: 300, height: 300, colorDark : "#cc0033", colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.H });
        setTimeout(() => { 
            const qrCanvas = hiddenContainer.querySelector('canvas');
            const qrImg = hiddenContainer.querySelector('img');
            let sourceImageSrc = '';
            if (qrImg && qrImg.src && qrImg.src.startsWith('data:image')) { sourceImageSrc = qrImg.src; } 
            else if (qrCanvas) { sourceImageSrc = qrCanvas.toDataURL("image/png"); } 
            else { alert("Error generating QR"); return; }
            const finalCanvas = document.createElement('canvas'); const ctx = finalCanvas.getContext('2d');
            const qrSize = 300; const padding = 50; 
            finalCanvas.width = qrSize + (padding * 2); finalCanvas.height = qrSize + (padding * 2) + 60; 
            ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
            const img = new Image(); img.crossOrigin = "Anonymous";
            img.onload = () => {
                ctx.drawImage(img, padding, padding, qrSize, qrSize);
                const centerX = finalCanvas.width / 2; const centerY = padding + (qrSize / 2);
                ctx.beginPath(); ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI); ctx.fillStyle = "#ffffff"; ctx.fill();
                ctx.font = "40px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("❤️", centerX, centerY + 2);
                ctx.fillStyle = "#cc0033"; ctx.font = "bold 26px 'Poppins', sans-serif"; ctx.textBaseline = "alphabetic"; ctx.fillText("Scan Me 👉 🔗", finalCanvas.width / 2, finalCanvas.height - 30);
                const link = document.createElement('a'); link.download = `Premium_MemoryGift_QR_${id}.png`;
                link.href = finalCanvas.toDataURL("image/png"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
            };
            img.src = sourceImageSrc;
        }, 400); 
    };

    window.loadOrdersData();
};

window.initAdminorders();
