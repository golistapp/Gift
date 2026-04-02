(async function() {
    const state = window.formState;
    if (!state) return;

    if (typeof imageCompression === 'undefined') {
        await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.1/dist/browser-image-compression.js";
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    const memoryForm = document.getElementById('memory-form');
    let imageInputsData = [
        { file: null, previewUrl: null, caption: "" },
        { file: null, previewUrl: null, caption: "" },
        { file: null, previewUrl: null, caption: "" },
        { file: null, previewUrl: null, caption: "" },
        { file: null, previewUrl: null, caption: "" }
    ];

    const defaultCaptions = ["Sweet Memory", "Cutie Pie 🥰", "Golden Moments", "Precious ❤️", "Unforgettable"];

    const letterTemplates = {
        "Happy Birthday": {
            en: "Today is all about you — the smile you bring and the joy you spread...",
            hi: "Aaj ka din sirf tumhare naam hai..."
        },
        "Happy Anniversary": {
            en: "Another year, another chapter of our beautiful journey...",
            hi: "Ek aur saal, aur hamari kahani aur bhi khoobsurat ho gayi..."
        },
        "Happy Valentine's Day": {
            en: "Loving you has been the most beautiful feeling of my life...",
            hi: "Tumse pyaar karna meri zindagi ka sabse khoobsurat ehsaas hai..."
        },
        "Proposal": {
            en: "From the moment you came into my life, everything changed...",
            hi: "Jab se tum meri zindagi mein aaye ho, sab kuch badal gaya..."
        }
    };

    const occasionSelect = document.getElementById('occasion-select');
    const gfNameInput = document.getElementById('gf-name');
    const langRadios = document.getElementsByName('letter-lang');
    const resetBtn = document.getElementById('reset-letter-btn');
    const letterTextarea = document.getElementById('letter-text');
    const dynamicGreeting = document.getElementById('dynamic-greeting');

    function updateGreeting() {
        const name = gfNameInput.value.trim() || "[Name]";
        if(dynamicGreeting) dynamicGreeting.innerText = `Hi ${name} ❤️,`;
    }

    function loadTemplate() {
        const occasion = occasionSelect.value;
        let lang = "en";
        for (const radio of langRadios) { if (radio.checked) lang = radio.value; }
        if (letterTemplates[occasion] && letterTemplates[occasion][lang]) {
            letterTextarea.value = letterTemplates[occasion][lang];
        }
    }

    if(gfNameInput) gfNameInput.addEventListener('input', updateGreeting);
    if(occasionSelect) occasionSelect.addEventListener('change', loadTemplate);
    langRadios.forEach(r => r.addEventListener('change', loadTemplate));
    if(resetBtn) resetBtn.addEventListener('click', loadTemplate);

    function renderImageGrid() {
        const container = document.getElementById('image-upload-container');
        if(!container) return;
        container.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const div = document.createElement('div');
            div.className = 'form-polaroid';
            const imgSrc = imageInputsData[i].previewUrl || state.memoryData?.[`image_${i+1}_url`] || `https://via.placeholder.com/300x300?text=Tap+to+Add+Photo+${i+1}`;
            const capValue = imageInputsData[i].caption || state.memoryData?.[`caption_${i+1}`] || '';
            div.innerHTML = `
                <label class="polaroid-img-wrapper" for="single-img-${i}">
                    <img id="prev-${i}" src="${imgSrc}" alt="Memory ${i+1}">
                </label>
                <input type="file" id="single-img-${i}" accept="image/*" hidden>
                <input type="text" id="cap-${i}" class="polaroid-caption-input" placeholder="Caption..." value="${capValue}">
            `;
            container.appendChild(div);
            div.querySelector(`#single-img-${i}`).addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    imageInputsData[i].file = file;
                    imageInputsData[i].previewUrl = URL.createObjectURL(file);
                    div.querySelector(`#prev-${i}`).src = imageInputsData[i].previewUrl;
                }
            });
            div.querySelector(`#cap-${i}`).addEventListener('input', (e) => { imageInputsData[i].caption = e.target.value; });
        }
    }

    const bulkInput = document.getElementById('bulk-upload');
    if (bulkInput) {
        bulkInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files).slice(0, 5); 
            files.forEach((file, index) => {
                imageInputsData[index].file = file;
                imageInputsData[index].previewUrl = URL.createObjectURL(file);
            });
            renderImageGrid(); 
        });
    }

    async function setSerialNumber() {
        const prefixEl = document.getElementById('serial-prefix');
        if (prefixEl) prefixEl.innerText = state.memoryId ? `${state.memoryId}-` : "GX-00-";
    }

    async function compressImage(file) {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true, initialQuality: 0.5 };
        try { return await imageCompression(file, options); } catch (e) { return file; }
    }

    // 🔴 SECURE IMAGEKIT UPLOAD (No Private Key) 🔴
    async function uploadToImageKit(file, fileName) {
        // 1. Vercel se signature mangiye
        const authRes = await fetch(IMAGEKIT_CONFIG.authEndpoint);
        const authData = await authRes.json();

        // 2. FormData banaiye (Public upload style)
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", fileName);
        formData.append("publicKey", IMAGEKIT_CONFIG.publicKey);
        formData.append("signature", authData.signature);
        formData.append("expire", authData.expire);
        formData.append("token", authData.token);
        formData.append("folder", "/qr-memory-gift");

        const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        return data.url;
    }

    if (memoryForm) {
        memoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('lock-gift-btn');
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving Securely...';
            submitBtn.disabled = true;

            try {
                const finalImageUrls = [];
                for (let i = 0; i < 5; i++) {
                    if (imageInputsData[i].file) {
                        const compressedFile = await compressImage(imageInputsData[i].file);
                        const url = await uploadToImageKit(compressedFile, `mem_${state.memoryId}_img${i+1}_${Date.now()}.jpg`);
                        finalImageUrls.push(url);
                    } else {
                        finalImageUrls.push(state.memoryData[`image_${i+1}_url`]);
                    }
                }

                const prefix = document.getElementById('serial-prefix').innerText;
                const userPass = document.getElementById('passcode-input').value;
                const fullPasscode = prefix + userPass; 
                const finalMessageText = document.getElementById('dynamic-greeting').innerText + "\n\n" + document.getElementById('letter-text').value;

                const updatedData = {
                    status: "locked",
                    locked_at: state.memoryData?.locked_at || new Date().toISOString(),
                    occasion: document.getElementById('occasion-select').value,
                    passcode: fullPasscode,
                    girlfriend_name: document.getElementById('gf-name').value,
                    message_text: finalMessageText,
                };

                for(let i=0; i<5; i++) {
                    updatedData[`image_${i+1}_url`] = finalImageUrls[i];
                    updatedData[`caption_${i+1}`] = document.getElementById(`cap-${i}`).value.trim() || defaultCaptions[i];
                }

                // 🔴 SECURE VERCEL PROXY CALL 🔴
                await fetch(`${firebaseConfig.secureApiURL}/memories/${state.memoryId}.json`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData)
                });

                alert("Gift Locked Securely! Hand over the QR code now.");
                window.location.reload(); 

            } catch (error) {
                console.error(error);
                alert("Error saving data! Check connection.");
                submitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Lock Gift & Generate';
                submitBtn.disabled = false;
            }
        });
    }

    renderImageGrid();
    await setSerialNumber();
    loadTemplate();
})();
