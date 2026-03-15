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

    // --- 4. PRO FULL-SCREEN CHAT SYSTEM ---
    function initDashboardChat() {
        const chatContainer = document.getElementById('dashboard-chat-container');
        
        chatContainer.innerHTML = `
            <div id="bf-chat-area" style="flex: 1; background: #e5ddd5; padding: 15px; border-radius: 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; margin-bottom:10px; border:1px solid #ccc; background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');">
                </div>
            
            <div style="display:flex; gap:10px; background: #f0f0f0; padding: 10px; border-radius: 30px; border: 1px solid #ddd; align-items:center;">
                <input type="text" id="bf-chat-input" placeholder="Wait for her first message..." style="flex:1; padding:12px 15px; border-radius:20px; border:none; outline:none; font-family:'Poppins'; background:white;" disabled>
                <button id="bf-send-btn" style="background: #00a884; color:white; border:none; width:45px; height:45px; border-radius:50%; cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);" disabled><i class="fa-solid fa-paper-plane"></i></button>
            </div>
            <p id="bf-msg-count" style="text-align:center; font-size:11px; color:#888; margin-top:5px;">Messages: 0 / 100</p>
        `;

        document.getElementById('bf-send-btn').addEventListener('click', sendBfMessage);
        
        renderDashboardUI();
    }

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
