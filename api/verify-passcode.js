const admin = require('firebase-admin');

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

    const { memoryId, enteredPasscode, requestType, recPrimary, recSecondary } = req.body;

    try {
        const db = admin.database();

        // 🚀 --- NAYA: LEAD FORM SUBMIT LOGIC ---
        if (requestType === 'submit_lead') {
            const { name, mobile, email } = req.body;
            
            if (!name || !mobile || !email) {
                return res.status(400).json({ success: false, error: 'Missing details' });
            }

            try {
                const newLeadRef = db.ref('leads').push();
                await newLeadRef.set({
                    name: name,
                    mobile: mobile,
                    email: email,
                    createdAt: new Date().toISOString(),
                    status: "New"
                });
                return res.status(200).json({ success: true });
            } catch (err) {
                return res.status(500).json({ success: false, error: 'Database save failed' });
            }
        }

        // 🌟 --- NAYA: REVIEW SUBMIT LOGIC ---
        if (requestType === 'submit_review') {
            const { name, message, rating } = req.body;
            
            if (!name || !message) {
                return res.status(400).json({ success: false, error: 'Missing details' });
            }

            try {
                const newReviewRef = db.ref('public_reviews').push();
                await newReviewRef.set({
                    name: name,
                    message: message,
                    rating: rating || "5",
                    status: "pending", // PRD ke hisaab se pending status
                    date: new Date().toISOString()
                });
                return res.status(200).json({ success: true });
            } catch (err) {
                return res.status(500).json({ success: false, error: 'Database save failed' });
            }
        }


        // 🛡️ --- RECOVERY LOGIC (Bypasses rules securely) ---
        if (requestType === 'recover') {
            if (!recPrimary || !recSecondary) return res.status(400).json({ success: false, error: 'Missing data' });

            const snapshot = await db.ref('memories').once('value');
            const data = snapshot.val();

            let foundId = null;
            let foundData = null;

            if (data) {
                const recPrimaryMobileOnly = recPrimary.replace(/\D/g, '');
                const recSecClean = recSecondary.replace(/[^a-z0-9]/g, '');

                for (const id in data) {
                    if (id === "error" || typeof data[id] !== 'object') continue;
                    const dbRecord = data[id];
                    const dbEmail = (dbRecord.customer_email || "").trim().toLowerCase();
                    const dbMob = (dbRecord.mobile_number || "").replace(/\D/g, '');

                    let primaryMatch = false;
                    if (recPrimary.includes('@') && dbEmail === recPrimary) primaryMatch = true;
                    else if (!recPrimary.includes('@') && dbMob === recPrimaryMobileOnly && dbMob.length >= 8) primaryMatch = true;

                    if (primaryMatch) {
                        let secMatch = false;
                        const dbName = (dbRecord.customer_name || "").toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (dbName && recSecClean && dbName.includes(recSecClean)) secMatch = true;

                        const idNum = id.replace(/[^0-9]/g, '');
                        const idNumInt = parseInt(idNum, 10).toString();
                        const idNorm = id.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (recSecClean === idNorm || recSecClean === idNum || recSecClean === idNumInt) secMatch = true;

                        const dbPass = (dbRecord.passcode || "").toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (dbPass && recSecClean && dbPass === recSecClean) secMatch = true;

                        if (secMatch) {
                            foundId = id;
                            foundData = dbRecord;
                            break;
                        }
                    }
                }
            }

            if (foundId && foundData) {
                return res.status(200).json({
                    success: true,
                    foundId: foundId,
                    customerName: foundData.customer_name || "Valued Customer",
                    customerEmail: foundData.customer_email || "giftoraxofficial@gmail.com",
                    passcode: foundData.passcode || "Not set"
                });
            } else {
                return res.status(200).json({ success: false, error: "Details do not match." });
            }
        }

        // 🔐 --- UNLOCK & STATUS CHECK LOGIC ---
        if (!memoryId) return res.status(400).json({ success: false, error: 'Missing Memory ID' });

        let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown_ip';
        if (clientIp.includes(',')) clientIp = clientIp.split(',')[0].trim();
        const sanitizedIp = clientIp.replace(/[.#$\[\]]/g, '_');
        const rateLimitRef = db.ref(`rate_limits/${sanitizedIp}`);
        const rateLimitSnapshot = await rateLimitRef.once('value');
        const rateLimitData = rateLimitSnapshot.val() || { attempts: 0, blockedUntil: 0 };

        if (Date.now() < rateLimitData.blockedUntil) {
            const remainingMinutes = Math.ceil((rateLimitData.blockedUntil - Date.now()) / 60000);
            return res.status(429).json({ success: false, error: `Too many failed attempts. Try again in ${remainingMinutes} minutes.` });
        }

        const ref = db.ref(`memories/${memoryId}`);
        const snapshot = await ref.once('value');
        const data = snapshot.val();

        if (!data) return res.status(404).json({ success: false, error: "Surprise not found" });

        if (requestType === 'status_check') {
            return res.status(200).json({
                success: true, 
                publicData: { status: data.status, is_enabled: data.is_enabled, girlfriend_name: data.girlfriend_name }
            });
        }

        const storedPass = data.passcode || "";
        const isMatch = storedPass === enteredPasscode || (enteredPasscode !== "" && storedPass.endsWith(enteredPasscode));
        
        if (isMatch) {
            await rateLimitRef.remove();
            return res.status(200).json({ success: true, memoryData: data });
        } else {
            let newAttempts = rateLimitData.attempts + 1;
            let blockTime = 0;
            if (newAttempts >= 5) blockTime = Date.now() + 10 * 60 * 1000; 
            await rateLimitRef.set({ attempts: newAttempts, blockedUntil: blockTime });
            if (newAttempts >= 5) return res.status(429).json({ success: false, error: "Account locked. Try again in 10 minutes." });
            else return res.status(401).json({ success: false, error: `Incorrect Passcode! ${5 - newAttempts} attempts left.` });
        }
        
    } catch (error) {
        console.error("Firebase Admin Error:", error);
        return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}