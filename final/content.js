let currentHighlights = [];

// Load highlights and notes from storage on page load
window.addEventListener('load', () => {
    chrome.storage.sync.get([window.location.href], (result) => {
        if (result[window.location.href]) {
            currentHighlights = result[window.location.href];
            currentHighlights.forEach((highlight) => {
                applyHighlight(highlight);
            });
        }
    });
});

// Function to highlight selected text
document.addEventListener('mouseup', () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        
        // Send message to background script to open highlight dialog
        chrome.runtime.sendMessage({ action: "openHighlightDialog", text: selection.toString() }, (response) => {
            // Handle response from background script
            if (response && response.color) {
                // Highlight the selected range with the received color and note
                highlightRange(range, response.color, response.note);
                
                // Remove the selection after highlighting
                selection.removeAllRanges();
                
                // Save the highlights
                saveHighlights();
            }
        });
    }
});

// Function to highlight a range of text
function highlightRange(range, color, note, category) {
    const timestamp = new Date().toISOString();
    const span = document.createElement('span');
    span.className = 'highlight';
    span.style.backgroundColor = color;
    span.title = note; // Attach note as tooltip
    span.appendChild(range.extractContents());
    range.insertNode(span);

    const highlight = {
        text: span.innerText,
        startOffset: range.startOffset,
        endOffset: range.endOffset,
        color: color,
        note: note,
        timestamp: new Date().toISOString()
    };

    currentHighlights.push(highlight);
}

// Save highlights and notes to storage
function saveHighlights() {
    const data = {};
    data[window.location.href] = currentHighlights;
    chrome.storage.sync.set(data);
}

// Apply a highlight from stored data
function applyHighlight(highlight) {
    const bodyText = document.body.innerHTML;
    const highlightSpan = `<span class="highlight" style="background-color: ${highlight.color};" title="${highlight.note}">${highlight.text}</span>`;
    document.body.innerHTML = bodyText.replace(highlight.text, highlightSpan);
}

// Clear highlights on the page
function clearHighlights() {
    const highlights = document.querySelectorAll('.highlight');
    highlights.forEach((highlight) => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.innerText), highlight);
    });
    currentHighlights = [];
    saveHighlights();
}

// Add event listeners for keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            chrome.runtime.sendMessage({ action: "openHighlightDialog", text: selection.toString() }, (response) => {
                if (response.color) {
                    highlightRange(range, response.color, response.note);
                    selection.removeAllRanges();
                    saveHighlights();
                }
            });
        }
    } else if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            const note = prompt("Enter note for this highlight:", "");

            if (note) {
                highlightRange(range, "yellow", note);
                selection.removeAllRanges();
                saveHighlights();
            }
        }
    }
});

// Function to open the highlight dialog
function openHighlightDialog(text) {
    chrome.runtime.sendMessage({ action: "openHighlightDialog", text: text }, (response) => {
        if (response.color) {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            highlightRange(range, response.color, response.note);
            selection.removeAllRanges();
            saveHighlights();
        }
    });
}

// Event listener for mouseup to trigger highlight dialog
document.addEventListener('mouseup', () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && selection.toString().trim().length > 0) {
        openHighlightDialog(selection.toString());
    }
});
