import admin from 'firebase-admin';

// Vercel में Firebase Admin को Initialize करें (ताकि रूल्स बायपास हो सकें)
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
    
    // Frontend से आया हुआ पाथ बनाएं (e.g., 'memories/GX-01')
    const targetPath = path ? path.join('/') : '';
    
    // Firebase Admin का सीधा रेफरेंस लें (यह सारे Security Rules को बायपास कर देता है)
    const dbRef = admin.database().ref(targetPath);

    try {
        if (req.method === 'GET') {
            const snapshot = await dbRef.once('value');
            return res.status(200).json(snapshot.val());
        } 
        else if (req.method === 'PATCH') {
            // चैट अपडेट करना, स्टेटस बदलना (यहाँ Admin Power यूज़ हो रही है)
            await dbRef.update(req.body);
            return res.status(200).json({ success: true });
        } 
        else if (req.method === 'PUT') {
            // नया आर्डर बनाना
            await dbRef.set(req.body);
            return res.status(200).json({ success: true });
        } 
        else if (req.method === 'DELETE') {
            // आर्डर डिलीट करना
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
