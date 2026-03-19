(function() {
    const viewerState = window.viewerState;
    const boothState = window.boothState;
    if (!viewerState || !viewerState.memoryData || !boothState) return;

    const thumbContainer = document.getElementById('thumb-strip');
    const memoryData = viewerState.memoryData;

    // Load Memory Images as Thumbnails
    for(let i=1; i<=5; i++) {
        if(memoryData[`image_${i}_url`]) {
            const imgUrl = memoryData[`image_${i}_url`];
            const thumb = document.createElement('img');
            thumb.src = imgUrl;
            thumb.className = 'memory-thumb';
            thumb.alt = `Memory ${i}`;

            // Thumbnail click par photo ko Canvas/Display par bhej do
            thumb.onclick = () => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = () => {
                    if(boothState.stopCamera) boothState.stopCamera();
                    boothState.userImage = img;
                    if(boothState.renderCanvas) boothState.renderCanvas();
                };
                img.src = imgUrl;
            };
            thumbContainer.appendChild(thumb);
        }
    }
})();