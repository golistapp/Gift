const admin = require('firebase-admin');

// Backend mein Firebase Admin initialize karna (taaki VIP pass mil sake)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Vercel mein newlines escape ho jati hain, isliye replace karna zaroori hai
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { memoryId, enteredPasscode, requestType } = req.body;

    if (!memoryId) {
        return res.status(400).json({ success: false, error: 'Missing Data' });
    }

    try {
        // Admin SDK ka use karke database se securely data nikalna (Rules bypass karke)
        const db = admin.database();
        const ref = db.ref(`memories/${memoryId}`);
        const snapshot = await ref.once('value');
        const data = snapshot.val();

        if (!data) {
            return res.status(404).json({ success: false, error: "Surprise not found" });
        }

        // 🟢 TYPE 1: Page Load hone par sirf 'Public' Data bhejo
        if (requestType === 'status_check') {
            return res.status(200).json({
                success: true, 
                publicData: {
                    status: data.status,
                    is_enabled: data.is_enabled,
                    girlfriend_name: data.girlfriend_name
                }
            });
        }

        // 🔴 TYPE 2: Vault Unlock karne par Passcode Match karo
        const storedPass = data.passcode || "";
        
        if (storedPass === enteredPasscode || (enteredPasscode !== "" && storedPass.endsWith(enteredPasscode))) {
            // Passcode Sahi Hai -> Poora Data Bhejo
            return res.status(200).json({ success: true, memoryData: data });
        } else {
            // Passcode Galat Hai -> Block kar do
            return res.status(401).json({ success: false, error: "Incorrect Passcode" });
        }
    } catch (error) {
        console.error("Firebase Admin Error:", error);
        return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}
