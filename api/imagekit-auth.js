import ImageKit from "imagekit";

// ImageKit सेटअप (Private Key सुरक्षित है!)
const imagekit = new ImageKit({
    urlEndpoint: "https://ik.imagekit.io/hryqx2lst9",
    publicKey: "public_mOww3EhDXvtS8/35MxbmdZz0lWs=",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY
});

export default function handler(req, res) {
    try {
        // ImageKit से सिक्योरिटी सिग्नेचर मांगें
        const authenticationParameters = imagekit.getAuthenticationParameters();
        
        // Frontend को टोकन, सिग्नेचर और एक्सपायरी टाइम भेज दें
        res.status(200).json(authenticationParameters);
    } catch (error) {
        console.error("ImageKit Auth Error:", error);
        res.status(500).json({ error: "Failed to generate ImageKit signature" });
    }
}
