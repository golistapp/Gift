// Global Cache Object
window.adminDataCache = window.adminDataCache || {};

window.initAdminreviews = function() {
    const tbody = document.getElementById('reviews-tbody');
    const filterBtns = document.querySelectorAll('.filter-tab');
    let currentFilter = 'all';

    window.loadReviewsData = async function(forceRefresh = false) {
        if(!tbody) return;

        const now = Date.now();
        // 5 MINUTE CACHE SYSTEM (300000 ms)
        if (!forceRefresh && window.adminDataCache.reviewsData && window.adminDataCache.reviewsTime && (now - window.adminDataCache.reviewsTime < 300000)) {
            renderReviewsTable(window.adminDataCache.reviewsData);
            return;
        }

        try {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px;"><i class="fa-solid fa-spinner fa-spin"></i> Fetching latest reviews...</td></tr>';
            const adminToken = localStorage.getItem('adminToken');
            const res = await fetch(`${firebaseConfig.databaseURL}/public_reviews.json?auth=${adminToken}`);
            if (!res.ok) throw new Error("Auth Failed");

            const data = await res.json();

            // Save data to browser memory (Cache)
            window.adminDataCache.reviewsData = data;
            window.adminDataCache.reviewsTime = Date.now();

            renderReviewsTable(data);
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">Error loading reviews!</td></tr>';
        }
    };

    function renderReviewsTable(data) {
        if(!tbody) return;

        let allReviews = [];
        if (data && !data.error) {
            Object.keys(data).forEach(key => {
                if(typeof data[key] === 'object') {
                    allReviews.push({ key, ...data[key] });
                }
            });
            allReviews.reverse(); // Latest reviews first
        }

        const filtered = allReviews.filter(rev => {
            if(currentFilter === 'all') return true;
            return rev.status === currentFilter;
        });

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#64748b;">No ${currentFilter} reviews found.</td></tr>`;
            return;
        }

        filtered.forEach(rev => {
            const dateStr = rev.date ? new Date(rev.date).toLocaleDateString() : 'N/A';
            const stars = '★'.repeat(parseInt(rev.rating || 5)) + '☆'.repeat(5 - parseInt(rev.rating || 5));

            const statusBadge = rev.status === 'approved' 
                ? `<span class="badge badge-locked" style="font-size:9px;">Approved</span>` 
                : `<span class="badge badge-empty" style="font-size:9px;">Pending</span>`;

            const actionBtn = rev.status === 'approved'
                ? `<button class="btn-hide-sm" onclick="window.updateReviewStatus('${rev.key}', 'pending')"><i class="fa-solid fa-eye-slash"></i> Hide</button>`
                : `<button class="btn-approve-sm" onclick="window.updateReviewStatus('${rev.key}', 'approved')"><i class="fa-solid fa-check"></i> Approve</button>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><small style="color:#64748b">${dateStr}</small></td>
                <td><strong>${rev.name}</strong></td>
                <td>
                    <span class="rating-stars">${stars}</span>
                    <div class="review-msg-cell">"${rev.message}"</div>
                </td>
                <td>${statusBadge}</td>
                <td>
                    ${actionBtn}
                    <button class="btn-delete-sm" style="margin-left:5px;" onclick="window.deleteReview('${rev.key}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Filter Logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-status');
            // Use cached data for filtering instantly
            renderReviewsTable(window.adminDataCache.reviewsData);
        });
    });

    // Update Status Logic
    window.updateReviewStatus = async (key, newStatus) => {
        try {
            const adminToken = localStorage.getItem('adminToken');
            await fetch(`${firebaseConfig.databaseURL}/public_reviews/${key}.json?auth=${adminToken}`, {
                method: 'PATCH', body: JSON.stringify({ status: newStatus })
            });
            window.loadReviewsData(true); // Force Refresh to get updated status
        } catch(e) { alert("Error updating review!"); }
    };

    // Delete Review Logic
    window.deleteReview = async (key) => {
        if(!confirm("Delete this review forever?")) return;
        try {
            const adminToken = localStorage.getItem('adminToken');
            await fetch(`${firebaseConfig.databaseURL}/public_reviews/${key}.json?auth=${adminToken}`, { method: 'DELETE' });
            window.loadReviewsData(true); // Force Refresh
        } catch(e) { alert("Error deleting review!"); }
    };

    window.loadReviewsData();
};

// 🔴 YEH LINE CHHOOT GAYI THI PICHHLI BAAR!
window.initAdminreviews();