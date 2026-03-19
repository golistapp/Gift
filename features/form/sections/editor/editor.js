(async function() {
    const state = window.formState;
    if (!state) return;

    // Image Compression library load karna
    if (typeof imageCompression === 'undefined') {
        await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.1/dist/browser-image-compression.js";
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    const memoryForm = document.getElementById('memory-form');
    const imageInputsData = [];

    // --- 1. UI GENERATOR ---
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

    // --- 2. ADMIN EDIT PRE-FILL ---
    function populateFormForEdit() {
        if(!state.memoryData) return;
        const md = state.memoryData;

        document.getElementById('occasion-select').value = md.occasion || 'Happy Birthday';
        document.getElementById('gf-name').value = md.girlfriend_name || '';
        document.getElementById('passcode-input').value = md.passcode || '';
        document.getElementById('music-select').value = md.music_id || 'gift';
        document.getElementById('letter-text').value = md.message_text || '';

        // 5 Open When Inputs
        document.getElementById('ow-happy').value = md.open_when_happy || '';
        document.getElementById('ow-sad').value = md.open_when_sad || '';
        document.getElementById('ow-miss-me').value = md.open_when_miss_me || '';
        document.getElementById('ow-hug').value = md.open_when_hug || '';
        document.getElementById('ow-sorry').value = md.open_when_sorry || '';

        for(let i=0; i<5; i++) {
            const idx = i + 1;
            if(md[`image_${idx}_url`]) {
                document.getElementById(`prev-${idx}`).src = md[`image_${idx}_url`];
            }
            document.getElementById(`cap-${idx}`).value = md[`caption_${idx}`] || '';
        }

        document.getElementById('lock-gift-btn').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update & Save Changes';
    }

    // --- 3. COMPRESSION & UPLOAD ---
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

    // --- 4. SUBMIT LOGIC ---
    if (memoryForm) {
        memoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            let missingImage = false;
            for(let i=0; i<5; i++) {
                const hasNewFile = imageInputsData[i].file !== null;
                const hasOldUrl = state.memoryData && state.memoryData[`image_${i+1}_url`];
                if(!hasNewFile && !hasOldUrl) { missingImage = true; break; }
            }

            if(missingImage) return alert("Please upload all 5 photos!");

            const submitBtn = document.getElementById('lock-gift-btn');
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
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

                const updatedData = {
                    status: "locked",
                    locked_at: state.memoryData?.locked_at || new Date().toISOString(),
                    occasion: document.getElementById('occasion-select').value,
                    passcode: document.getElementById('passcode-input').value,
                    girlfriend_name: document.getElementById('gf-name').value,
                    music_id: document.getElementById('music-select').value,
                    message_text: document.getElementById('letter-text').value,
                    open_when_happy: document.getElementById('ow-happy').value,
                    open_when_sad: document.getElementById('ow-sad').value,
                    open_when_miss_me: document.getElementById('ow-miss-me').value,
                    open_when_hug: document.getElementById('ow-hug').value,
                    open_when_sorry: document.getElementById('ow-sorry').value,
                };

                for(let i=0; i<5; i++) {
                    updatedData[`image_${i+1}_url`] = finalImageUrls[i];
                    updatedData[`caption_${i+1}`] = document.getElementById(imageInputsData[i].captionId).value;
                }

                await fetch(`${firebaseConfig.databaseURL}/memories/${state.memoryId}.json`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData)
                });

                if(state.mode === 'admin_edit') {
                    alert("Changes Saved Successfully!");
                    window.close();
                } else {
                    alert("Gift Locked! Hand over the QR code now.");
                    window.location.reload(); 
                }

            } catch (error) {
                console.error(error); alert("Error saving data!");
                submitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Lock Gift & Generate';
                submitBtn.disabled = false;
            }
        });
    }

    // Initialize 
    generateImageInputs();
    if (state.mode === 'admin_edit') {
        populateFormForEdit();
    }
})();