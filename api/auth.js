import admin from 'firebase-admin';

// Vercel Serverless environment में बार-बार Initialize होने से रोकने के लिए (Singleton Pattern)
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Vercel में Private Key की लाइन-ब्रेक्स (\n) को फिक्स करने के लिए यह बहुत ज़रूरी है
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });
    } catch (error) {
        console.error("Firebase Admin Init Error:", error);
    }
}

export default async function handler(req, res) {
    // सिर्फ POST रिक्वेस्ट को एक्सेप्ट करेंगे (Security)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { memoryId, passcode } = req.body;

    if (!memoryId || !passcode) {
        return res.status(400).json({ error: 'Missing memoryId or passcode' });
    }

    try {
        // असली Firebase डेटाबेस से पासकोड चेक करें
        const db = admin.database();
        const memoryRef = db.ref(`memories/${memoryId}`);
        const snapshot = await memoryRef.once('value');
        const memoryData = snapshot.val();

        if (!memoryData) {
            return res.status(404).json({ error: 'Memory not found' });
        }

        // Passcode वेरिफिकेशन (Exact match या Ends With)
        const storedPass = memoryData.passcode || "";
        const isValid = (storedPass === passcode) || (passcode !== "" && storedPass.endsWith(passcode));

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid passcode' });
        }

        // ✅ Authentication Successful! 
        // अब Firebase का VIP Token बनाएं (UID के तौर पर memoryId का इस्तेमाल कर रहे हैं)
        const customToken = await admin.auth().createCustomToken(memoryId);

        return res.status(200).json({ token: customToken });

    } catch (error) {
        console.error("Auth Error:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
