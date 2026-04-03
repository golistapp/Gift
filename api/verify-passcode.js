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

    if (!memoryId) {
        return res.status(400).json({ success: false, error: 'Missing Data' });
    }

    try {
        const db = admin.database();

        // 🛡️ STEP 1: HACKER IP TRACKING & RATE LIMITING
        // Vercel se user ka IP address nikalna
        let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown_ip';
        if (clientIp.includes(',')) {
            clientIp = clientIp.split(',')[0].trim(); // Agar multiple IPs hon toh pehla wala lo
        }
        
        // Firebase keys mein '.', '#', '$', '[', ']' allow nahi hote, isliye IP ko clean (sanitize) karna zaroori hai
        const sanitizedIp = clientIp.replace(/[.#$\[\]]/g, '_');
        const rateLimitRef = db.ref(`rate_limits/${sanitizedIp}`);
        
        // IP ka purana record check karna
        const rateLimitSnapshot = await rateLimitRef.once('value');
        const rateLimitData = rateLimitSnapshot.val() || { attempts: 0, blockedUntil: 0 };

        // Agar user already blocked hai
        if (Date.now() < rateLimitData.blockedUntil) {
            const remainingMinutes = Math.ceil((rateLimitData.blockedUntil - Date.now()) / 60000);
            return res.status(429).json({ 
                success: false, 
                error: `Too many failed attempts. Try again in ${remainingMinutes} minutes.` 
            });
        }


        // 📦 STEP 2: FETCH MEMORY DATA
        const ref = db.ref(`memories/${memoryId}`);
        const snapshot = await ref.once('value');
        const data = snapshot.val();

        if (!data) {
            return res.status(404).json({ success: false, error: "Surprise not found" });
        }

        // Status Check ke liye bypass (Page load hone par)
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


        // 🔐 STEP 3: VERIFY PASSCODE (Hacker block logic)
        const storedPass = data.passcode || "";
        const isMatch = storedPass === enteredPasscode || (enteredPasscode !== "" && storedPass.endsWith(enteredPasscode));
        
        if (isMatch) {
            // ✅ SUCCESS: Passcode Sahi Hai!
            // Agar password sahi dal diya, toh uske past failed attempts delete kar do
            await rateLimitRef.remove();
            return res.status(200).json({ success: true, memoryData: data });
            
        } else {
            // ❌ FAILED: Passcode Galat Hai!
            let newAttempts = rateLimitData.attempts + 1;
            let blockTime = 0;

            // Agar 5 bar galat kar diya, toh aane wale 10 minutes (600,000 milliseconds) ke liye block kar do
            if (newAttempts >= 5) {
                blockTime = Date.now() + 10 * 60 * 1000; 
            }

            // Database mein update kar do
            await rateLimitRef.set({
                attempts: newAttempts,
                blockedUntil: blockTime
            });

            // User ko error dikhao
            if (newAttempts >= 5) {
                return res.status(429).json({ success: false, error: "Account locked. Try again in 10 minutes." });
            } else {
                return res.status(401).json({ success: false, error: `Incorrect Passcode! ${5 - newAttempts} attempts left.` });
            }
        }
        
    } catch (error) {
        console.error("Firebase Admin Error:", error);
        return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}
