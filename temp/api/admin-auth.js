export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { email, password } = req.body;
    // Vercel environment variable se Firebase API Key uthayenge
    const apiKey = process.env.FIREBASE_PRIVATE_KEY ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT).apiKey : ""; 
    // Note: Agar aapne sirf Service Account dala hai, toh aap environment variable mein ek 'FIREBASE_PUBLIC_API_KEY' bhi add kar sakte hain.
    // Sabse asan tarika: Vercel dashboard mein 'NEXT_PUBLIC_FB_KEY' naam se apni purani API Key dalo.

    const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FB_KEY || "AIzaSyDngYdx4m2PdO2-MjqfkKq5jJk9Cp3xmwE"}`;

    try {
        const response = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, returnSecureToken: true })
        });

        const data = await response.json();
        if (!response.ok) return res.status(response.status).json(data);

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
