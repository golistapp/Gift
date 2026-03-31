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

    // 🔴 NAYA: Letter Templates Database (Sourced from Screenshots)
    const letterTemplates = {
        "Happy Birthday": {
            en: "Today is all about you — the smile you bring and the joy you spread.\n\nYou make life brighter just by being in it.\n\nI'm grateful for every moment, every laugh, every memory with you.\n\nMay your day be filled with love, surprises, and everything you deserve.\n\nAnd I promise… this is just the beginning of many beautiful moments together.",
            hi: "Aaj ka din sirf tumhare naam hai...\n\nTumhari smile meri duniya ko roshan karti hai.\n\nTumhare saath har moment special lagta hai.\n\nMain bas yahi chahta hoon ki tum hamesha khush raho.\n\nAur haan… aaj ka din sirf shuruaat hai aur bhi surprises ke liye ❤️"
        },
        "Happy Anniversary": {
            en: "Another year, another chapter of our beautiful journey.\n\nThrough every moment, you've been my peace and my strength.\n\nI still fall for you a little more every single day.\n\nWhat we have is rare, real, and forever mine to cherish.\n\nHere's to us… and to many more memories yet to come.",
            hi: "Ek aur saal, aur hamari kahani aur bhi khoobsurat ho gayi.\n\nTum mere liye sirf partner nahi… meri duniya ho.\n\nHar din tumse aur zyada pyaar ho jaata hai.\n\nJo hamare paas hai wo sach mein bohot special hai.\n\nAur main chahta hoon ki yeh safar kabhi khatam na ho ❤️"
        },
        "Happy Valentine's Day": {
            en: "Loving you has been the most beautiful feeling of my life.\n\nYou are not just a part of my world — you are my world.\n\nEvery heartbeat of mine whispers your name.\n\nWith you, even the simplest moments feel magical.\n\nToday and always, I choose you… again and again.",
            hi: "Tumse pyaar karna meri zindagi ka sabse khoobsurat ehsaas hai.\n\nTum meri life ka wo hissa ho jo sab kuch perfect bana deta hai.\n\nHar heartbeat mein bas tum ho.\n\nTumhare saath sab kuch magical lagta hai.\n\nAur main hamesha tumhe hi choose karunga… har baar ❤️"
        },
        "Proposal": {
            en: "From the moment you came into my life, everything changed.\n\nYou became my reason to smile, my reason to dream.\n\nI don't just want moments with you… I want a lifetime.\n\nSo today, I ask you — will you be mine forever?\n\nBecause my heart already knows… it's always been you.",
            hi: "Jab se tum meri zindagi mein aaye ho, sab kuch badal gaya.\n\nTum meri khushi ka reason ho, meri har dua ho.\n\nMain sirf moments nahi… poori zindagi tumhare saath jeena chahta hoon.\n\nToh aaj main tumse poochta hoon…\n\nKya tum hamesha ke liye meri banogi? ❤️"
        }
    };

    // 🔴 NAYA: Letter Handlers
    const occasionSelect = document.getElementById('occasion-select');
    const gfNameInput = document.getElementById('gf-name');
    const langRadios = document.getElementsByName('letter-lang');
    const resetBtn = document.getElementById('reset-letter-btn');
    const letterTextarea = document.getElementById('letter-text');
    const dynamicGreeting = document.getElementById('dynamic-greeting');

    function updateGreeting() {
        const name = gfNameInput.value.trim() || "[Name]";
        dynamicGreeting.innerText = `Hi ${name} ❤️,`;
    }

    function loadTemplate() {
        const occasion = occasionSelect.value;
        let lang = "en";
        for (const radio of langRadios) { if (radio.checked) lang = radio.value; }
        
        if (letterTemplates[occasion] && letterTemplates[occasion][lang]) {
            letterTextarea.value = letterTemplates[occasion][lang];
        }
    }

    gfNameInput.addEventListener('input', updateGreeting);
    occasionSelect.addEventListener('change', loadTemplate);
    langRadios.forEach(r => r.addEventListener('change', loadTemplate));
    resetBtn.addEventListener('click', loadTemplate);


    // 1. GENERATE BULK UPLOAD UI & SINGLE UPLOAD
    function renderImageGrid() {
        const container = document.getElementById('image-upload-container');
        container.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const div = document.createElement('div');
            div.className = 'form-polaroid';
            
            const imgSrc = imageInputsData[i].previewUrl || state.memoryData?.[`image_${i+1}_url`] || `https://via.placeholder.com/300x300?text=Tap+to+Add+Photo+${i+1}`;
            const capValue = imageInputsData[i].caption || state.memoryData?.[`caption_${i+1}`] || '';
            
            div.innerHTML = `
                <label class="polaroid-img-wrapper" for="single-img-${i}" title="Click to replace image">
                    <img id="prev-${i}" src="${imgSrc}" alt="Memory ${i+1}">
                </label>
                <input type="file" id="single-img-${i}" accept="image/*" hidden>
                <input type="text" id="cap-${i}" class="polaroid-caption-input" placeholder="Caption for Photo ${i+1}..." value="${capValue}">
            `;
            container.appendChild(div);

            const singleInput = div.querySelector(`#single-img-${i}`);
            singleInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    imageInputsData[i].file = file;
                    imageInputsData[i].previewUrl = URL.createObjectURL(file);
                    div.querySelector(`#prev-${i}`).src = imageInputsData[i].previewUrl;
                }
            });

            const capInput = div.querySelector(`#cap-${i}`);
            capInput.addEventListener('input', (e) => {
                imageInputsData[i].caption = e.target.value;
            });
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

    // 2. SMART SERIAL NUMBER 
    async function setSerialNumber() {
        const prefixEl = document.getElementById('serial-prefix');
        if (state.memoryId) {
            prefixEl.innerText = `${state.memoryId}-`;
        } else {
            prefixEl.innerText = "GX-00-"; 
        }
    }

    // 3. ADMIN PRE-FILL (For Edit Mode)
    function populateFormForEdit() {
        if(!state.memoryData) return;
        const md = state.memoryData;
        
        document.getElementById('occasion-select').value = md.occasion || 'Happy Birthday';
        document.getElementById('gf-name').value = md.girlfriend_name || '';
        
        // Setup Smart Name & Template Extractor
        updateGreeting();
        let msg = md.message_text || '';
        const name = md.girlfriend_name || '';
        const prefixCheck = `Hi ${name} ❤️,\n\n`;
        
        // Remove greeting if it was saved together previously
        if (msg.startsWith(prefixCheck)) {
            msg = msg.substring(prefixCheck.length).trim();
        }
        document.getElementById('letter-text').value = msg;
        
        for(let i=0; i<5; i++) {
            imageInputsData[i].caption = md[`caption_${i+1}`] || '';
        }
        document.getElementById('lock-gift-btn').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update & Save Changes';
    }

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

    // --- PREVIEW GIFT LOGIC ---
    const previewBtn = document.getElementById('preview-gift-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            const gfName = document.getElementById('gf-name')?.value;
            const occasion = document.getElementById('occasion-select')?.value;
            const messageBody = document.getElementById('letter-text')?.value;

            if (!gfName || !messageBody) {
                alert("Please fill Basic Details and Love Letter before previewing!");
                return;
            }

            // Combine Dynamic Greeting + Letter Body for Preview
            const finalPreviewMessage = document.getElementById('dynamic-greeting').innerText + "\n\n" + messageBody;

            window.previewGiftData = {
                occasion: occasion,
                girlfriend_name: gfName,
                message_text: finalPreviewMessage, // Combined message passes perfectly to viewer
                
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

                const prefix = document.getElementById('serial-prefix').innerText;
                const userPass = document.getElementById('passcode-input').value;
                const fullPasscode = prefix + userPass; 

                // Combine Greeting + Text for final database save
                const finalMessageText = document.getElementById('dynamic-greeting').innerText + "\n\n" + document.getElementById('letter-text').value;

                const updatedData = {
                    status: "locked",
                    locked_at: state.memoryData?.locked_at || new Date().toISOString(),
                    occasion: document.getElementById('occasion-select').value,
                    passcode: fullPasscode,
                    girlfriend_name: document.getElementById('gf-name').value,
                    message_text: finalMessageText, // Combined
                };

                updatedData.music_id = null;
                updatedData.open_when_happy = null;
                updatedData.open_when_sad = null;
                updatedData.open_when_miss_me = null;
                updatedData.open_when_hug = null;
                updatedData.open_when_sorry = null;

                for(let i=0; i<5; i++) {
                    updatedData[`image_${i+1}_url`] = finalImageUrls[i];
                    let finalCaption = document.getElementById(`cap-${i}`).value.trim();
                    if (!finalCaption) finalCaption = defaultCaptions[i]; 
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
    await setSerialNumber(); 
    
    // Auto load template only if it's a new form. If edit, populateFormForEdit will handle it.
    if (state.mode === 'admin_edit') {
        populateFormForEdit();
    } else {
        loadTemplate();
    }
})();
