// ১. DOM ইলিমেন্টগুলো সিলেক্ট করা হচ্ছে
const fileInput = document.getElementById('fileInput');
const importBox = document.getElementById('import-box');
const imageWrapper = document.getElementById('image-wrapper');
const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');
const toolBtns = document.querySelectorAll('.tool-btn');

// Undo-Redo এর জন্য বাটন সিলেক্ট করা
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');

// ২. গ্লোবাল স্টেট এবং ভেরিয়েবল
let currentTool = 'crop'; // ডিফল্ট টুল এখন Crop
let isDrawing = false;
let isImageLoaded = false;

let undoStack = [];
let redoStack = [];

// ৩. টুল নির্বাচন করার লজিক (শুধু বাটন অ্যাক্টিভ করা হবে)
toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.getAttribute('data-tool');
        
        // আপাতত সব টুলের জন্য সাধারণ কার্সার, পরে লজিক অনুযায়ী বদলানো হবে
        canvas.style.cursor = 'crosshair';
    });
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
                imageWrapper.style.display = 'flex'; 

                saveState(); 
                isImageLoaded = true; 
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
    
    let clientX = evt.clientX;
    let clientY = evt.clientY;
    
    if (evt.touches && evt.touches.length > 0) {
        clientX = evt.touches[0].clientX;
        clientY = evt.touches[0].clientY;
    }

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// ৬. টুলগুলোর ফাঁকা লজিক (ভবিষ্যতে এখানে অ্যাক্টিভিটির কোড বসানো হবে)
function startDrawing(e) {
    if (!isImageLoaded) return; 
    const pos = getMousePos(canvas, e);
    isDrawing = true;
    
    // --> নতুন টুলের Mousedown লজিক এখানে হবে <--
}

function draw(e) {
    if (!isDrawing || !isImageLoaded) return;
    e.preventDefault(); 
    const pos = getMousePos(canvas, e);
    
    // --> নতুন টুলের Mousemove লজিক এখানে হবে <--
}

function stopDrawing() {
    if (!isImageLoaded) return;
    
    if (isDrawing) {
        // --> নতুন টুলের Mouseup লজিক এখানে হবে <--
        // saveState(); (যে সমস্ত টুলে সেভ করা প্রয়োজন, সেখানে কল করা হবে)
    }
    isDrawing = false;
}

// মাউস ইভেন্ট
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// মোবাইলের জন্য টাচ ইভেন্ট
canvas.addEventListener('touchstart', startDrawing, {passive: false});
canvas.addEventListener('touchmove', draw, {passive: false});
canvas.addEventListener('touchend', stopDrawing);