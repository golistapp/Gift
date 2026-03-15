document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const memoryId = urlParams.get('id');
    const mode = urlParams.get('mode'); // Check for 'admin_edit'

    if (!memoryId) {
        alert("Invalid Link! Memory ID missing.");
        return;
    }

    const editorScreen = document.getElementById('editor-screen');
    const lockScreen = document.getElementById('lock-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const memoryForm = document.getElementById('memory-form');
    
    let memoryData = null;
    let userPasscode = ""; 
    let dashboardInterval = null;
    const imageInputsData = [];

    // --- 1. INITIAL CHECK & ADMIN BYPASS LOGIC ---
    async function checkStatus() {
        try {
            const response = await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`);
            memoryData = await response.json();

            if (!memoryData) {
                alert("Order not found!");
                return;
            }

            generateImageInputs(); 

            if (mode === 'admin_edit') {
                lockScreen.classList.add('hidden');
                editorScreen.classList.remove('hidden');
                populateFormForEdit();
            } else if (memoryData.status === "locked") {
                editorScreen.classList.add('hidden');
                lockScreen.classList.remove('hidden');
            } else {
                lockScreen.classList.add('hidden');
                editorScreen.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Error fetching data", error);
        }
    }

    checkStatus();

    // --- 2. PRE-FILL FORM FOR ADMIN EDIT ---
    function populateFormForEdit() {
        if(!memoryData) return;
        
        // NAYA FIELD: Occasion
        document.getElementById('occasion-select').value = memoryData.occasion || 'Happy Birthday';
        
        document.getElementById('gf-name').value = memoryData.girlfriend_name || '';
        document.getElementById('passcode-input').value = memoryData.passcode || '';
        document.getElementById('music-select').value = memoryData.music_id || 'gift';
        document.getElementById('letter-text').value = memoryData.message_text || '';
        document.getElementById('ow-happy').value = memoryData.open_when_happy || '';
        document.getElementById('ow-sad').value = memoryData.open_when_sad || '';
        document.getElementById('ow-miss-me').value = memoryData.open_when_miss_me || '';
        document.getElementById('ow-cant-sleep').value = memoryData.open_when_cant_sleep || '';

        for(let i=0; i<5; i++) {
            const idx = i + 1;
            if(memoryData[`image_${idx}_url`]) {
                document.getElementById(`prev-${idx}`).src = memoryData[`image_${idx}_url`];
            }
            document.getElementById(`cap-${idx}`).value = memoryData[`caption_${idx}`] || '';
        }
        
        document.getElementById('lock-gift-btn').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update & Save Changes';
    }

    // --- 3. DASHBOARD UNLOCK & INIT ---
    document.getElementById('verify-passcode-btn').addEventListener('click', () => {
        const entered = document.getElementById('check-passcode').value;
        const errorMsg = document.getElementById('passcode-error');

        if (entered === memoryData.passcode) {
            userPasscode = entered; 
            lockScreen.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');
            
            initDashboardChat(); 
            startDashboardPolling(); 
        } else {
            errorMsg.classList.remove('hidden');
        }
    });

        // --- PROPOSAL & GIFT BOX LOGIC ---
    document.addEventListener('mouseover', (e) => {
        if(e.target.id === 'btn-no') {
            const btn = e.target;
            const container = btn.parentElement;
            const containerRect = container.getBoundingClientRect();
            const randomX = Math.floor(Math.random() * (containerRect.width - 100)) - (containerRect.width/2);
            const randomY = Math.floor(Math.random() * 80) - 40; 
            btn.style.transform = `translate(${randomX}px, ${randomY}px)`;
            
            document.getElementById('question-gif-card').style.display = 'inline-block';
            document.getElementById('proposal-gif').src = "https://media.giphy.com/media/xT0GqfvuVpNqEf3z2w/giphy.gif";
        }
    });

    window.acceptProposal = function(event) {
        document.getElementById('proposal-state').style.display = 'none';
        document.getElementById('success-state').style.display = 'block'; 
        fireConfettiAndHearts();
    };

    let minimalGiftOpened = false;
    window.openGift = function() {
        if (minimalGiftOpened) return;
        minimalGiftOpened = true;
        
        const giftBox = document.getElementById("minimal-gift");
        giftBox.querySelector('.minimal-gift-lid').style.transform = 'translateY(-80px) rotate(-10deg)';
        giftBox.querySelector('.minimal-gift-lid').style.opacity = '0';
        
        const ring = document.createElement('div');
        ring.innerHTML = '💍'; 
        ring.style.position = 'absolute';
        ring.style.top = '30px';
        ring.style.left = '50%';
        ring.style.transform = 'translate(-50%, 0) scale(0.1) rotate(-180deg)';
        ring.style.fontSize = '4.5rem';
        ring.style.transition = 'all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        giftBox.appendChild(ring);
        
        setTimeout(() => {
            ring.style.transform = 'translate(-50%, -100px) scale(1) rotate(0deg)';
        }, 100);

        setTimeout(() => {
            document.getElementById("surpriseMessage").style.opacity = '1';
            document.getElementById("surpriseMessage").style.transform = 'translateY(0) scale(1)';
            fireConfettiAndHearts();
        }, 1100); 
    };

    window.fireConfettiAndHearts = function() {
        for(let i=0; i<30; i++) {
            const h = document.createElement('div');
            h.innerHTML = Math.random() > 0.5 ? '❤️' : '✨';
            h.style.position = 'fixed'; 
            h.style.left = '50%'; h.style.top = '50%';
            h.style.fontSize = (Math.random() * 20 + 10) + 'px';
            h.style.pointerEvents = 'none'; h.style.zIndex = '99999';
            h.style.transition = 'all 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            document.body.appendChild(h);
            setTimeout(() => {
                h.style.transform = `translate(${(Math.random()-0.5)*500}px, ${(Math.random()-0.5)*500}px) scale(${Math.random() + 0.5})`;
                h.style.opacity = '0';
            }, 50);
            setTimeout(() => h.remove(), 1500);
        }
    };


    function startDashboardPolling() {
        dashboardInterval = setInterval(async () => {
            try {
                const res = await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`);
                const data = await res.json();
                if(data) {
                    memoryData = data;
                    renderDashboardUI();
                }
            } catch(e) { console.log("Silent polling error."); }
        }, 5000);
    }

    function formatShortDate(isoString) {
        if(!isoString) return "Waiting...";
        const d = new Date(isoString);
        return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    function renderDashboardUI() {
        document.getElementById('track-scanned').innerText = formatShortDate(memoryData.scanned_at);
        document.getElementById('track-proposal').innerText = formatShortDate(memoryData.proposal_accepted_at);

        const chatList = memoryData.chat || [];
        const count = memoryData.message_count || 0;
        
        const bfChatInput = document.getElementById('bf-chat-input');
        const bfSendBtn = document.getElementById('bf-send-btn');
        const bfChatArea = document.getElementById('bf-chat-area');
        
        document.getElementById('bf-msg-count').innerText = `Messages: ${count} / 100`;

        const gfStarted = chatList.length > 0;
        if(gfStarted && count < 100) {
            bfChatInput.disabled = false;
            bfSendBtn.disabled = false;
            bfChatInput.placeholder = "Type your reply...";
        } else if (count >= 100) {
            bfChatInput.disabled = true;
            bfSendBtn.disabled = true;
            bfChatInput.placeholder = "100 message limit reached!";
        }

        bfChatArea.innerHTML = '';
        if(!gfStarted) {
            bfChatArea.innerHTML = '<div style="background:rgba(255,255,255,0.8); padding:5px 15px; border-radius:15px; font-size:12px; align-self:center; margin-top:20px;">Waiting for her reply...</div>';
            return;
        }

        chatList.forEach(msgObj => {
            let decryptedText = "";
            try {
                const bytes = CryptoJS.AES.decrypt(msgObj.text, userPasscode);
                decryptedText = bytes.toString(CryptoJS.enc.Utf8);
            } catch(e) { decryptedText = "🔒 Error reading message"; }

            // Boyfriend uses Light Green, GF uses White (WhatsApp Style)
            const isBf = msgObj.sender === 'bf';
            const align = isBf ? 'flex-end' : 'flex-start';
            const bg = isBf ? '#d9fdd3' : '#fff';
            const radius = isBf ? '10px 0px 10px 10px' : '0px 10px 10px 10px';

            bfChatArea.innerHTML += `
                <div style="align-self: ${align}; background: ${bg}; color: #111; padding: 8px 12px; border-radius: ${radius}; max-width: 80%; font-size: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                    ${decryptedText}
                </div>
            `;
        });
        
        bfChatArea.scrollTop = bfChatArea.scrollHeight; 
    }

    async function sendBfMessage() {
        const inputEl = document.getElementById('bf-chat-input');
        const msgText = inputEl.value.trim();
        if(!msgText) return;

        let currentCount = memoryData.message_count || 0;
        if(currentCount >= 100) return alert("Message limit reached!");

        const btn = document.getElementById('bf-send-btn');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        btn.disabled = true;

        try {
            const res = await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`);
            const latestData = await res.json();
            
            let chatList = latestData.chat || [];
            let newCount = (latestData.message_count || 0) + 1;

            if(newCount > 100) throw new Error("Limit Reached");

            const encryptedMsg = CryptoJS.AES.encrypt(msgText, userPasscode).toString();
            
            chatList.push({
                sender: 'bf',
                text: encryptedMsg,
                timestamp: new Date().toISOString()
            });

            if(chatList.length > 5) chatList = chatList.slice(chatList.length - 5);

            await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat: chatList, message_count: newCount })
            });

            inputEl.value = '';
            const res2 = await fetch(`${firebaseConfig.databaseURL}/memories/${memoryId}.json`);
            memoryData = await res2.json();
            renderDashboardUI();
        } catch(e) {
            alert(e.message === "Limit Reached" ? "100 Messages Limit Reached!" : "Error sending.");
        }
        
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
        btn.disabled = false;
    }

    // --- 5. IMAGE UPLOAD UI GENERATOR ---
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

    // --- 6. COMPRESSION, UPLOAD & SAVE LOGIC ---
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
        
        let missingImage = false;
        for(let i=0; i<5; i++) {
            const hasNewFile = imageInputsData[i].file !== null;
            const hasOldUrl = memoryData && memoryData[`image_${i+1}_url`];
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
                    const url = await uploadToImageKit(compressedFile, `mem_${memoryId}_img${i+1}_${Date.now()}.jpg`);
                    finalImageUrls.push(url);
                } else {
                    finalImageUrls.push(memoryData[`image_${i+1}_url`]);
                }
            }

            const updatedData = {
                status: "locked",
                locked_at: memoryData?.locked_at || new Date().toISOString(),
                
                // 🔴 NEW DATA FIELDS
                occasion: document.getElementById('occasion-select').value,
                
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

            if(mode === 'admin_edit') {
                alert("Changes Saved Successfully!");
                window.close();
            } else {
                alert("Gift Locked! Girlfriend scan now.");
                window.location.reload(); 
            }

        } catch (error) {
            console.error(error); alert("Error saving data!");
            submitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Lock Gift';
            submitBtn.disabled = false;
        }
    });
});