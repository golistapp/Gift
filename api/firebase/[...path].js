import admin from 'firebase-admin';

// Vercel में Private Key की \n प्रॉब्लम को 100% फिक्स करने का तरीका
const formatPrivateKey = (key) => {
    if (!key) return "";
    // यह किसी भी तरह के खराब \n को सही फॉर्मेट में बदल देगा
    return key.replace(/\\n/g, '\n').replace(/"/g, ''); 
};

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // 🔴 यहाँ हमने अपना नया सुरक्षित फंक्शन लगा दिया है
                privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
            }),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });
        console.log("Firebase Admin Initialized Successfully!");
    } catch (error) {
        console.error("🔥 Firebase Admin Init Error:", error);
    }
}

export default async function handler(req, res) {
    const { path } = req.query; 
    
    let targetPath = path ? path.join('/') : '';
    if (targetPath.endsWith('.json')) {
        targetPath = targetPath.replace('.json', '');
    }

    // अगर Admin initialize नहीं हुआ है, तो 500 एरर दे दो (ताकि हमें पता चले)
    if (!admin.apps.length) {
        return res.status(500).json({ error: "Firebase Admin is NOT initialized. Check your Private Key in Vercel." });
    }

    const dbRef = admin.database().ref(targetPath);

    try {
        if (req.method === 'GET') {
            const snapshot = await dbRef.once('value');
            return res.status(200).json(snapshot.val());
        } 
        else if (req.method === 'PATCH') {
            await dbRef.update(req.body);
            return res.status(200).json({ success: true });
        } 
        else if (req.method === 'PUT') {
            await dbRef.set(req.body);
            return res.status(200).json({ success: true });
        } 
        else if (req.method === 'DELETE') {
            await dbRef.remove();
            return res.status(200).json({ success: true });
        } 
        else {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }
    } catch (error) {
        console.error("Vercel Admin Proxy Error:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}
