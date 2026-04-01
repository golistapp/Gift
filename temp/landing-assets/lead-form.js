document.addEventListener("DOMContentLoaded", () => {
    // 1. Firebase Initialize karo (Tumhari firebase.config.js se data aayega)
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const database = firebase.database();

    const form = document.getElementById('surprise-lead-form');
    const submitBtn = document.getElementById('submit-btn');
    const successMsg = document.getElementById('success-msg');

    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Page refresh hone se roko

        // Button ko loading state me dalo
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Submitting... <i class="fa-solid fa-spinner fa-spin"></i>';
        submitBtn.style.opacity = '0.7';
        submitBtn.style.pointerEvents = 'none';

        // Form ki values nikalo
        const name = document.getElementById('user-name').value;
        const mobile = document.getElementById('user-mobile').value;
        const email = document.getElementById('user-email').value;
        const timestamp = new Date().toISOString();

        // Firebase database me 'leads' nam ke folder me data dalo
        const newLeadRef = database.ref('leads').push();
        
        newLeadRef.set({
            name: name,
            mobile: mobile,
            email: email,
            createdAt: timestamp,
            status: "New"
        })
        .then(() => {
            // Data successfully save ho gaya
            form.style.display = 'none'; // Form chupa do
            successMsg.style.display = 'block'; // Thank you message dikhao
        })
        .catch((error) => {
            // Agar koi error aayi
            console.error("Error saving data: ", error);
            alert("Something went wrong. Please try again.");
            
            // Button wapas normal karo
            submitBtn.innerHTML = originalText;
            submitBtn.style.opacity = '1';
            submitBtn.style.pointerEvents = 'auto';
        });
    });
});
