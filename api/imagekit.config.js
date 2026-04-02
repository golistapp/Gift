// ==========================================
// SECURE IMAGEKIT CONFIGURATION (Vercel Ready)
// ==========================================

window.IMAGEKIT_CONFIG = {
    publicKey: "public_mOww3EhDXvtS8/35MxbmdZz0lWs=",
    urlEndpoint: "https://ik.imagekit.io/hryqx2lst9",

    // 🔴 privateKey यहाँ से हमेशा के लिए डिलीट कर दी गई है! 🔴

    // नया Vercel ऑथेंटिकेशन एंडपॉइंट (Signature के लिए)
    authEndpoint: "/api/imagekit-auth"
};

console.log("📸 Secure ImageKit Config Loaded Globally!");
