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

    // Default Romantic Captions
    const defaultCaptions = ["Sweet Memory", "Cutie Pie 🥰", "Golden Moments", "Precious ❤️", "Unforgettable"];

        // 1. GENERATE BULK UPLOAD UI & SINGLE UPLOAD
    function renderImageGrid() {
        const container = document.getElementById('image-upload-container');
        container.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const div = document.createElement('div');
            div.className = 'form-polaroid';

            // Check if there's a new file, otherwise check database, otherwise show placeholder
            const imgSrc = imageInputsData[i].previewUrl || state.memoryData?.[`image_${i+1}_url`] || `https://via.placeholder.com/300x300?text=Tap+to+Add+Photo+${i+1}`;
            const capValue = imageInputsData[i].caption || state.memoryData?.[`caption_${i+1}`] || '';

            // 🔴 NAYA: Image ko <label> ke andar rakha taaki click karne par gallery khule
            div.innerHTML = `
                <label class="polaroid-img-wrapper" for="single-img-${i}" title="Click to replace image">
                    <img id="prev-${i}" src="${imgSrc}" alt="Memory ${i+1}">
                </label>
                <input type="file" id="single-img-${i}" accept="image/*" hidden>
                <input type="text" id="cap-${i}" class="polaroid-caption-input" placeholder="Caption for Photo ${i+1}..." value="${capValue}">
            `;
            container.appendChild(div);

            // 🔴 NAYA: Individual Image File Selection Logic
            const singleInput = div.querySelector(`#single-img-${i}`);
            singleInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    imageInputsData[i].file = file;
                    imageInputsData[i].previewUrl = URL.createObjectURL(file);
                    // Sirf us ek image ka preview change karo bina poora grid hilaye
                    div.querySelector(`#prev-${i}`).src = imageInputsData[i].previewUrl;
                }
            });

            // Save caption input state
            const capInput = div.querySelector(`#cap-${i}`);
            capInput.addEventListener('input', (e) => {
                imageInputsData[i].caption = e.target.value;
            });
        }
    }


    // Handle File Selection (Multiple Files)
    const bulkInput = document.getElementById('bulk-upload');
    if (bulkInput) {
        bulkInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files).slice(0, 5); // Take max 5 files
            files.forEach((file, index) => {
                imageInputsData[index].file = file;
                imageInputsData[index].previewUrl = URL.createObjectURL(file);
            });
            renderImageGrid(); // Re-render to show new images
        });
    }

      // 2. SMART SERIAL NUMBER (Reads from URL/Admin)
    async function setSerialNumber() {
        const prefixEl = document.getElementById('serial-prefix');
        // Admin ne jo ID link mein bheji hai (state.memoryId), wahi direct prefix ban jayegi
        if (state.memoryId) {
            prefixEl.innerText = `${state.memoryId}-`;
        } else {
            prefixEl.innerText = "GX-00-"; // Fallback
        }
    }

    // 3. ADMIN PRE-FILL (For Edit Mode)
    function populateFormForEdit() {
        if(!state.memoryData) return;
        const md = state.memoryData;

        document.getElementById('occasion-select').value = md.occasion || 'Happy Birthday';
        document.getElementById('gf-name').value = md.girlfriend_name || '';
        document.getElementById('letter-text').value = md.message_text || '';

        for(let i=0; i<5; i++) {
            imageInputsData[i].caption = md[`caption_${i+1}`] || '';
        }
        document.getElementById('lock-gift-btn').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update & Save Changes';
    }

    // Upload & Compress Helpers
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

        // --- 🔴 NAYA: PREVIEW GIFT LOGIC (CORRECTED) ---
    const previewBtn = document.getElementById('preview-gift-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            // 1. Check if basic details are filled
            const gfName = document.getElementById('gf-name')?.value;
            const occasion = document.getElementById('occasion-select')?.value;
            const messageText = document.getElementById('letter-text')?.value;

            if (!gfName || !messageText) {
                alert("Please fill Basic Details and Love Letter before previewing!");
                return;
            }

            // 2. Gather data temporarily in window object
            window.previewGiftData = {
                occasion: occasion,
                girlfriend_name: gfName,
                message_text: messageText,

                // Gather images and captions (IDs are prev-0 to prev-4 in bulk upload)
                image_1_url: document.getElementById('prev-0')?.src || "",
                caption_1: document.getElementById('cap-0')?.value || "Sweet Memory",
                image_2_url: document.getElementById('prev-1')?.src || "",
                caption_2: document.getElementById('cap-1')?.value || "Cutie Pie 🥰",
                image_3_url: document.getElementById('prev-2')?.src || "",
                caption_3: document.getElementById('cap-2')?.value || "Golden Moments",
                image_4_url: document.getElementById('prev-3')?.src || "",
                caption_4: document.getElementById('cap-3')?.value || "Precious ❤️",
                image_5_url: document.getElementById('prev-4')?.src || "",
                caption_5: document.getElementById('cap-4')?.value || "Unforgettable",
            };

            // 3. Open Viewer in a new tab with preview mode
            const baseUrl = window.location.origin + window.location.pathname;
            window.open(`${baseUrl}?mode=preview`, '_blank');
        });
    }



    // 4. SUBMIT FORM
    if (memoryForm) {
        memoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            let missingImage = false;
            for(let i=0; i<5; i++) {
                const hasNewFile = imageInputsData[i].file !== null;
                const hasOldUrl = state.memoryData && state.memoryData[`image_${i+1}_url`];
                if(!hasNewFile && !hasOldUrl) { missingImage = true; break; }
            }

            if(missingImage) return alert("Please select all 5 photos using the upload button!");

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

                // Construct full passcode
                const prefix = document.getElementById('serial-prefix').innerText;
                const userPass = document.getElementById('passcode-input').value;
                const fullPasscode = prefix + userPass; 

                              const updatedData = {
                    status: "locked",
                    locked_at: state.memoryData?.locked_at || new Date().toISOString(),
                    occasion: document.getElementById('occasion-select').value,
                    passcode: fullPasscode,
                    girlfriend_name: document.getElementById('gf-name').value,
                    message_text: document.getElementById('letter-text').value,
                };


                // Clear out old deleted fields from Firebase
                updatedData.music_id = null;
                updatedData.open_when_happy = null;
                updatedData.open_when_sad = null;
                updatedData.open_when_miss_me = null;
                updatedData.open_when_hug = null;
                updatedData.open_when_sorry = null;

                for(let i=0; i<5; i++) {
                    updatedData[`image_${i+1}_url`] = finalImageUrls[i];

                    // NAYA: Default Caption Logic
                    let finalCaption = document.getElementById(`cap-${i}`).value.trim();
                    if (!finalCaption) finalCaption = defaultCaptions[i]; // Blank hua toh auto-fill

                    updatedData[`caption_${i+1}`] = finalCaption;
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
    renderImageGrid();
    await setSerialNumber(); // Load Serial First
    if (state.mode === 'admin_edit') {
        populateFormForEdit();
    }
})();