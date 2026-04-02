(function() {
    const shareBtn = document.getElementById('btn-share-whatsapp');
    if (!shareBtn) return;

    shareBtn.addEventListener('click', function() {
        // Current website ka URL uthana (Jisse link automatically add ho jaye)
        const giftUrl = window.location.href; 
        
        // 🔴 NAYA: Aapka diya hua behtarin aur elegant message
        const message = `Hey 👋\n\n*GiftoraX* presents a beautifully crafted surprise experience 🎁\n\nEvery detail has been thoughtfully designed to make it truly special 💕\n\nTake a moment to explore it:\n👉 ${giftUrl}`;

        // Text ko URL encode karna taaki spaces aur emoji break na hon
        const encodedMessage = encodeURIComponent(message);

        // WhatsApp open karna
        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    });
})();
