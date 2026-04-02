import admin from 'firebase-admin';

// Vercel में Firebase Admin को Initialize करें
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });
    } catch (error) {
        console.error("Firebase Admin Init Error:", error);
    }
}

export default async function handler(req, res) {
    const { path } = req.query; 
    
    // Frontend से आया हुआ पाथ बनाएं
    let targetPath = path ? path.join('/') : '';
    
    // 🔴 यह रही असली फिक्स: .json को हटाना होगा क्योंकि Admin SDK को इसकी जरूरत नहीं होती
    if (targetPath.endsWith('.json')) {
        targetPath = targetPath.replace('.json', '');
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
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
