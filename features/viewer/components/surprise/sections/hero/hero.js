(function() {
    const state = window.viewerState;
    if (!state || !state.memoryData) return;
    const memoryData = state.memoryData;

    // UI Text Data Populate karna
    const occasionEl = document.getElementById('dynamic-occasion');
    const nameEl = document.getElementById('dynamic-gf-name');

    if (occasionEl) occasionEl.innerText = memoryData.occasion || "A Special Surprise";
    if (nameEl) nameEl.innerText = memoryData.girlfriend_name || "My Love";
})();