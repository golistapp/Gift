window.initAdminoverview = async function() {
    const baseUrl = window.location.origin + window.location.pathname;
    
    try {
        const adminToken = localStorage.getItem('adminToken');
        
        // Table mein loading state dikhana
        const tbody = document.getElementById('recent-orders-tbody');
        if(tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Loading recent orders...</td></tr>';
        
        // Data fetch karna (Secure token ke saath)
        const response = await fetch(`${firebaseConfig.databaseURL}/memories.json?auth=${adminToken}`);
        if(!response.ok) throw new Error("Auth Failed");
        
        const data = await response.json();
        
        let total = 0, locked = 0, opened = 0, proposals = 0;
        let ordersArray = [];
        
        // Kharab data ko skip karke metrics calculate karna
        if (data && !data.error) {
            Object.keys(data).forEach(id => {
                if(id !== "error" && typeof data[id] === 'object') {
                    const order = data[id];
                    order.id = id;
                    ordersArray.push(order);
                    
                    total++;
                    if(order.status === 'locked') locked++;
                    if(order.scanned_at) opened++; // Scanned logic
                    if(order.proposal_accepted_at) proposals++; // Proposal logic
                }
            });
        }
        
        // Stats Cards update karna
        document.getElementById('stat-total').innerText = total;
        document.getElementById('stat-locked').innerText = locked;
        document.getElementById('stat-opened').innerText = opened;
        document.getElementById('stat-proposals').innerText = proposals;
        
        // Orders ko latest date ke hisaab se sort karna (Naye orders upar aayenge)
        ordersArray.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });
        
        // Sirf top 5 (Recent) orders nikalna
        const recentOrders = ordersArray.slice(0, 5);
        
        // Recent Orders Table render karna
        if(tbody) {
            tbody.innerHTML = '';
            if(recentOrders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #64748b;">No orders found.</td></tr>';
            } else {
                recentOrders.forEach(order => {
                    const dateObj = order.created_at ? new Date(order.created_at) : null;
                    const dateStr = dateObj ? dateObj.toLocaleDateString() : 'N/A';
                    
                    const statusBadge = order.status === 'locked' 
                        ? `<span class="badge badge-locked">Locked</span>` 
                        : `<span class="badge badge-empty">Pending</span>`;
                        
                    const formLink = `${baseUrl}?mode=form&id=${order.id}`;
                    
                    // WhatsApp message ka text
                    const rawMsg = `Hello ${order.customer_name || 'Customer'}! ❤️\n\nAapka Memory Gift create ho gaya hai. Kripya niche diye link par apni memories aur details fill karein:\n\n🔗 Link: ${formLink}\n\nThank you!`;
                    const encodedMsg = encodeURIComponent(rawMsg);
                    const cleanNumber = order.mobile_number ? String(order.mobile_number).replace(/\D/g,'') : '';
                    const waLinkUrl = `https://wa.me/${cleanNumber ? '91'+cleanNumber : ''}?text=${encodedMsg}`;
                    
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${order.id}</strong><br><small style="color:#64748b">${dateStr}</small></td>
                        <td><strong>${order.customer_name || 'N/A'}</strong></td>
                        <td>${statusBadge}</td>
                        <td>
                            <div class="quick-share-flex">
                                <button class="quick-action-btn" title="Copy Link" onclick="window.copyToClipboard('${formLink}')"><i class="fa-regular fa-copy"></i></button>
                                <button class="quick-action-btn quick-wa-btn" title="WhatsApp Share" onclick="window.open('${waLinkUrl}', '_blank')"><i class="fa-brands fa-whatsapp"></i></button>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }
        
    } catch(e) {
        console.error("Error loading stats:", e);
        document.getElementById('stat-total').innerText = "Err";
        document.getElementById('stat-locked').innerText = "Err";
        document.getElementById('stat-opened').innerText = "Err";
        document.getElementById('stat-proposals').innerText = "Err";
        
        const tbody = document.getElementById('recent-orders-tbody');
        if(tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #e53935;">Error loading data! Please check connection.</td></tr>';
    }
    
    // "View All Orders" button par click hone par Manage Orders tab kholna
    const viewAllBtn = document.getElementById('view-all-orders-btn');
    if(viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            const ordersTab = document.querySelector('.admin-tab[data-target="orders"]');
            if(ordersTab) ordersTab.click(); // Programmatically tab click kar diya
        });
    }
};

window.initAdminoverview();
