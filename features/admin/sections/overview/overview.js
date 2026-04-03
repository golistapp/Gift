// Function ko global window mein attach kiya hai taaki naya order banne par refresh ho sake
window.initAdminoverview = async function() {
    try {
        const adminToken = localStorage.getItem('adminToken');
        const response = await fetch(`${firebaseConfig.databaseURL}/memories.json?auth=${adminToken}`);
        const data = await response.json();

        let total = 0, empty = 0, locked = 0;
        if (data) {
            Object.keys(data).forEach(id => {
                total++;
                if(data[id].status === 'locked') locked++;
                else empty++;
            });
        }

        document.getElementById('stat-total').innerText = total;
        document.getElementById('stat-empty').innerText = empty;
        document.getElementById('stat-locked').innerText = locked;
    } catch(e) {
        console.error("Error loading stats:", e);
    }
};

// Pehli baar load hone par run karega
window.initAdminoverview();