// ==========================================
// SECURE FIREBASE CONFIGURATION (Vercel Ready)
// ==========================================

const firebaseConfig = {
    // सिर्फ Live Chat (Read) के EventSource के लिए इस्तेमाल होगा
    databaseURL: "https://gift-32f5c-default-rtdb.asia-southeast1.firebasedatabase.app",
    
    // Vercel API Endpoints (डेटा राइट और ऑथेंटिकेशन के लिए)
    secureApiURL: "/api/firebase",
    authApiURL: "/api/auth"
};

console.log("🔥 Secure Firebase Config Loaded Successfully");
