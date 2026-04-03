import crypto from 'crypto';

export default function handler(req, res) {
  // Vercel Environment Variable se Private Key uthayega
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

  if (!privateKey) {
    return res.status(500).json({ error: "Private key is missing in Vercel." });
  }

  // Secure token aur expiry time generate karna
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expire = Math.floor(Date.now() / 1000) + 60 * 30; // 30 minutes valid
  
  // Signature create karna
  const signature = crypto.createHmac('sha1', privateKey).update(token + expire).digest('hex');

  // Frontend ko secure details bhejna (Bina Private Key ke)
  res.status(200).json({
    token: token,
    expire: expire,
    signature: signature
  });
}
