document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const memoryId = urlParams.get('id');

    if (!memoryId) {
        alert("Invalid Link! Memory ID missing.");
        return;
    }

    // Screens
    const editorScreen = document.getElementById('editor-screen');
    const lockScreen = document.getElementById('lock-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const memoryForm = document.getElementById('memory-form');
    
    let memoryData = null;

    // --- 1. INITIAL CHECK (SPA Logic) ---
    async function checkStatus() {
        try {
            const response = await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`);
            memoryData = await response.json();

            if (!memoryData) {
                alert("Order not found!");
                return;
            }

            if (memoryData.status === "locked") {
                // Form is already filled, show passcode screen
                editorScreen.classList.add('hidden');
                lockScreen.classList.remove('hidden');
            } else {
                // Form is empty, show editor
                lockScreen.classList.add('hidden');
                editorScreen.classList.remove('hidden');
                generateImageInputs();
            }
        } catch (error) {
            console.error("Error fetching data", error);
        }
    }

    checkStatus();

    // --- 2. PASSCODE & DASHBOARD LOGIC ---
    document.getElementById('verify-passcode-btn').addEventListener('click', () => {
        const entered = document.getElementById('check-passcode').value;
        const errorMsg = document.getElementById('passcode-error');

        if (entered === memoryData.passcode) {
            lockScreen.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');
            
            // Populate Live Data
            if (memoryData.scanned_at) {
                document.getElementById('track-scanned').innerText = new Date(memoryData.scanned_at).toLocaleString();
            }
            if (memoryData.proposal_accepted_at) {
                document.getElementById('track-proposal').innerText = new Date(memoryData.proposal_accepted_at).toLocaleString();
            }
            if (memoryData.girlfriend_message) {
                document.getElementById('track-message').innerText = memoryData.girlfriend_message;
            }
        } else {
            errorMsg.classList.remove('hidden');
        }
    });

    // --- 3. IMAGE UPLOAD UI GENERATOR ---
    const imageInputsData = [];
    function generateImageInputs() {
        const container = document.getElementById('image-upload-container');
        container.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const div = document.createElement('div');
            div.className = 'form-polaroid';
            div.innerHTML = `
                <label for="img-${i}" style="cursor: pointer; display: block;">
                    <img id="prev-${i}" src="https://via.placeholder.com/300x300?text=Tap+to+Upload+Image+${i}" alt="Upload">
                </label>
                <input type="file" id="img-${i}" accept="image/*" hidden>
                <input type="text" id="cap-${i}" class="polaroid-caption-input" placeholder="Caption for Image ${i}..." required>
            `;
            container.appendChild(div);

            const fileInput = div.querySelector(`#img-${i}`);
            const preview = div.querySelector(`#prev-${i}`);
            
            let imgData = { file: null, previewEl: preview, captionId: `cap-${i}` };
            imageInputsData.push(imgData);

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    imgData.file = file;
                    const reader = new FileReader();
                    reader.onload = (ev) => preview.src = ev.target.result;
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    // --- 4. PREVIEW SYSTEM LOGIC ---
    const previewBtn = document.getElementById('preview-btn');
    const previewOverlay = document.getElementById('preview-overlay');
    
    previewBtn.addEventListener('click', () => {
        document.getElementById('preview-name').innerText = document.getElementById('gf-name').value || "Girlfriend's Name";
        document.getElementById('preview-letter').innerText = document.getElementById('letter-text').value || "Your letter will appear here...";
        
        const photosContainer = document.getElementById('preview-photos');
        photosContainer.innerHTML = '';
        
        imageInputsData.forEach((img, index) => {
            if(img.file) {
                photosContainer.innerHTML += `
                    <div style="background: white; padding: 10px; width: 80%; border-radius: 5px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        <img src="${img.previewEl.src}" style="width: 100%; border-radius: 3px;">
                        <p style="font-family: 'Dancing Script'; font-size: 24px; margin-top: 10px;">${document.getElementById(img.captionId).value || `Caption ${index+1}`}</p>
                    </div>
                `;
            }
        });
        
        previewOverlay.classList.remove('hidden');
    });

    document.getElementById('close-preview').addEventListener('click', () => {
        previewOverlay.classList.add('hidden');
    });

    // --- 5. COMPRESSION, UPLOAD & SAVE LOGIC ---
    async function compressImage(file) {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true, initialQuality: 0.5 };
        try { return await imageCompression(file, options); } catch (e) { return file; }
    }

    async function uploadToImageKit(file, fileName) {
        const formData = new FormData();
        formData.append("file", file); formData.append("fileName", fileName); formData.append("folder", "/qr-memory-gift");
        const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
            method: "POST", headers: { "Authorization": "Basic " + btoa(IMAGEKIT_CONFIG.privateKey + ":") }, body: formData
        });
        const data = await response.json(); return data.url;
    }

    memoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validation
        const missingImage = imageInputsData.some(img => img.file === null);
        if(missingImage) return alert("Please upload all 5 photos!");

        const submitBtn = document.getElementById('lock-gift-btn');
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Locking...';
        submitBtn.disabled = true;

        try {
            const finalImageUrls = [];
            for (let i = 0; i < 5; i++) {
                const compressedFile = await compressImage(imageInputsData[i].file);
                const url = await uploadToImageKit(compressedFile, `mem_${memoryId}_img${i+1}.jpg`);
                finalImageUrls.push(url);
            }

            const updatedData = {
                status: "locked",
                locked_at: new Date().toISOString(),
                passcode: document.getElementById('passcode-input').value,
                girlfriend_name: document.getElementById('gf-name').value,
                music_id: document.getElementById('music-select').value,
                message_text: document.getElementById('letter-text').value,
                open_when_happy: document.getElementById('ow-happy').value,
                open_when_sad: document.getElementById('ow-sad').value,
                open_when_miss_me: document.getElementById('ow-miss-me').value,
                open_when_cant_sleep: document.getElementById('ow-cant-sleep').value,
            };

            for(let i=0; i<5; i++) {
                updatedData[`image_${i+1}_url`] = finalImageUrls[i];
                updatedData[`caption_${i+1}`] = document.getElementById(imageInputsData[i].captionId).value;
            }

            await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData)
            });

            alert("Gift Locked! Girlfriend scan now.");
            window.location.reload(); // Reload to show Dashboard

        } catch (error) {
            console.error(error); alert("Error saving data!");
            submitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Lock Gift';
            submitBtn.disabled = false;
        }
    });
});
