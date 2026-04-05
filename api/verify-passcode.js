const admin = require('firebase-admin');

// Backend mein Firebase Admin initialize karna (VIP pass)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
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

    if (!memoryId || enteredPasscode === undefined) {
        return res.status(400).json({ success: false, error: 'Missing Data' });
    }

    try {
        const db = admin.database();

        // 📦 FETCH MEMORY DATA DIRECTLY (IP Blocking Hata Diya Hai)
        const ref = db.ref(`memories/${memoryId}`);
        const snapshot = await ref.once('value');
        const data = snapshot.val();

        if (!data) {
            return res.status(404).json({ success: false, error: "Surprise not found" });
        }

        // Status Check bypass
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

        // 🔐 BULLETPROOF PASSCODE VERIFICATION
        // .trim() lagaya hai taaki agar Firebase mein galti se space ho, toh wo ignore ho jaye
        const storedPass = String(data.passcode || "").trim();
        const enteredPass = String(enteredPasscode || "").trim();
        
        const isMatch = storedPass === enteredPass || (enteredPass !== "" && storedPass.endsWith(enteredPass));
        
        if (isMatch) {
            // ✅ SUCCESS: Passcode Sahi Hai
            return res.status(200).json({ success: true, memoryData: data });
        } else {
            // ❌ FAILED: Passcode Galat Hai (Lekin ab block nahi karega)
            return res.status(401).json({ success: false, error: "Incorrect Passcode!" });
        }
        
    } catch (error) {
        console.error("Firebase Admin Error:", error);
        return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}
