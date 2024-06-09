let dialogOpen = false;

document.addEventListener('DOMContentLoaded', () => {
    // Load default color from options
    chrome.storage.sync.get('defaultColor', (data) => {
        document.getElementById('highlightColor').value = data.defaultColor || '#ffff00';
    });
});

document.addEventListener('mouseup', () => {
    if (!dialogOpen) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            const text = selection.toString();
            openHighlightDialog(text, range);
            dialogOpen = true;
        }
    }
});

function openHighlightDialog(text, range) {
    const highlightDialog = document.createElement('div');
    highlightDialog.innerHTML = `
        <label for="highlightColor">Highlight Color:</label>
        <input type="color" id="highlightColor" name="highlightColor" value="#ffff00">
        
        <label for="highlightNote">Note:</label>
        <textarea id="highlightNote" rows="4"></textarea>
        
        <button id="saveHighlightDialog">Save Highlight</button>
    `;
    document.body.appendChild(highlightDialog);
    highlightDialog.style.position = 'absolute';
    highlightDialog.style.top = `${range.getBoundingClientRect().bottom}px`;
    highlightDialog.style.left = `${range.getBoundingClientRect().left}px`;

    highlightDialog.querySelector('#saveHighlightDialog').addEventListener('click', () => {
        dialogOpen = false;
        const color = highlightDialog.querySelector('#highlightColor').value;
        const note = highlightDialog.querySelector('#highlightNote').value;
        highlightRange(range, color, note); // Highlight the selected text
        saveHighlights(); // Save the highlighted text
        document.body.removeChild(highlightDialog); // Close the dialog
    });
}

function highlightRange(range, color, note) {
    const span = document.createElement('span');
    span.className = 'highlight';
    span.style.backgroundColor = color;
    span.title = note; // Attach note as tooltip
    span.appendChild(range.extractContents());
    range.insertNode(span);
}

function saveHighlights() {
    const highlights = document.querySelectorAll('.highlight');
    const annotations = [];
    highlights.forEach((highlight) => {
        const annotation = {
            text: highlight.innerText,
            color: highlight.style.backgroundColor,
            note: highlight.title,
            timestamp: new Date().toISOString()
        };
        annotations.push(annotation);
    });
    chrome.storage.sync.set({ [window.location.href]: annotations });
}
