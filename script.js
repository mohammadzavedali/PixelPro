// ১. DOM ইলিমেন্টগুলো সিলেক্ট করা হচ্ছে
const fileInput = document.getElementById('fileInput');
const importBox = document.getElementById('import-box');
const imageWrapper = document.getElementById('image-wrapper');
const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');
const toolBtns = document.querySelectorAll('.tool-btn');
const colorPicker = document.getElementById('color-picker');

// Undo-Redo এর জন্য বাটন সিলেক্ট করা
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');

// ২. গ্লোবাল স্টেট এবং ভেরিয়েবল
let currentTool = 'move';
let isDrawing = false;
let brushColor = '#3b82f6';
let brushSize = 5;
let isImageLoaded = false; // ছবি আপলোড হয়েছে কিনা তা চেক করার জন্য

// Undo-Redo স্ট্যাক এবং শেপের জন্য স্ন্যাপশট
let undoStack = [];
let redoStack = [];
let startX, startY, snapshot;

// ৩. টুল নির্বাচন করার লজিক
toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.getAttribute('data-tool');
        
        // টুল অনুযায়ী মাউসের কার্সার পরিবর্তন
        if (currentTool === 'brush' || currentTool === 'eraser' || currentTool === 'shapes') {
            canvas.style.cursor = 'crosshair';
        } else if(currentTool === 'text') {
            canvas.style.cursor = 'text';
        } else if (currentTool === 'picker') {
            canvas.style.cursor = 'crosshair';
        } else {
            canvas.style.cursor = 'default';
        }
    });
});

colorPicker.addEventListener('input', (e) => {
    brushColor = e.target.value;
});

// ৪. ক্যানভাসের স্টেট সেভ করার ফাংশন (Undo-Redo এর জন্য)
function saveState() {
    undoStack.push(canvas.toDataURL());
    redoStack = []; 
}

function restoreState(stateUrl) {
    const img = new Image();
    img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    }
    img.src = stateUrl;
}

undoBtn.addEventListener('click', () => {
    if (undoStack.length > 1) { 
        redoStack.push(undoStack.pop()); 
        restoreState(undoStack[undoStack.length - 1]); 
    }
});

redoBtn.addEventListener('click', () => {
    if (redoStack.length > 0) {
        const nextState = redoStack.pop();
        undoStack.push(nextState);
        restoreState(nextState);
    }
});

// ৫. ছবি ইমপোর্ট করে ক্যানভাসে বসানো
fileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                importBox.style.display = 'none';
                imageWrapper.style.display = 'block';

                saveState(); 
                isImageLoaded = true; // ছবি আপলোড সফল হয়েছে
            }
            img.src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
});

// মাউসের সঠিক পজিশন বের করার ফাংশন
function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY
    };
}

// কালার কনভার্টার (RGB থেকে Hex)
function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

// ৬. টুলগুলোর মূল লজিক (Mousedown, Mousemove, Mouseup)
canvas.addEventListener('mousedown', (e) => {
    if (!isImageLoaded) return; // ছবি না থাকলে কোনো টুল কাজ করবে না

    const pos = getMousePos(canvas, e);

    if (currentTool === 'picker') {
        const pixelData = ctx.getImageData(pos.x, pos.y, 1, 1).data;
        const hexColor = rgbToHex(pixelData[0], pixelData[1], pixelData[2]);
        colorPicker.value = hexColor;
        brushColor = hexColor;
        return; 
    } 
    
    if (currentTool === 'text') {
        const text = prompt("Enter your text here:");
        if (text) {
            ctx.font = "40px Poppins";
            ctx.fillStyle = brushColor;
            ctx.textBaseline = "middle"; // ফিক্স: লেখাটি মাউসের ঠিক মাঝখানে বসবে
            ctx.fillText(text, pos.x, pos.y);
            saveState(); 
        }
        return;
    }

    if (currentTool === 'brush' || currentTool === 'eraser' || currentTool === 'shapes') {
        isDrawing = true;
        startX = pos.x;
        startY = pos.y;
        
        if (currentTool === 'shapes') {
            snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }

        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const pos = getMousePos(canvas, e);
    
    if (currentTool === 'brush') {
        ctx.globalCompositeOperation = 'source-over'; 
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        
        // ফিক্স: লাইন কন্টিনিউ করার জন্য নতুন পাথ শুরু করা
        ctx.beginPath(); 
        ctx.moveTo(pos.x, pos.y);
    } 
    else if (currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'; 
        ctx.lineWidth = brushSize * 5; 
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        
        // ফিক্স: মুছতে মুছতে মাউস সরালে যেন মসৃণভাবে মোছে
        ctx.beginPath(); 
        ctx.moveTo(pos.x, pos.y);
    }
    else if (currentTool === 'shapes') {
        ctx.putImageData(snapshot, 0, 0); 
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
    }
});

canvas.addEventListener('mouseup', () => {
    if (isDrawing && (currentTool === 'brush' || currentTool === 'eraser' || currentTool === 'shapes')) {
        saveState(); 
    }
    isDrawing = false;
});

canvas.addEventListener('mouseout', () => {
    isDrawing = false;
});