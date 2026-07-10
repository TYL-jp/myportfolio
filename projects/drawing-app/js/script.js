document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const canvasContainer = document.getElementById('canvas-container');
    const colorPicker = document.getElementById('colorPicker');
    const lineWidthInput = document.getElementById('lineWidth');
    const toolButtons = document.querySelectorAll('.tool-btn');
    const layerList = document.getElementById('layer-list');
    
    // オーバーレイキャンバスの作成
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.id = 'overlay-canvas';
    overlayCanvas.width = 800;
    overlayCanvas.height = 600;
    canvasContainer.appendChild(overlayCanvas);
    const overlayCtx = overlayCanvas.getContext('2d');

    // アプリの状態
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    let layers = [];
    let activeLayerId = null;
    let isDrawing = false;
    let activeTool = 'pen';
    let startX = 0, startY = 0;
    let layerCounter = 0;

    // --- レイヤー管理 ---
    function addLayer() {
        layerCounter++;
        const id = Date.now();
        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        canvasContainer.appendChild(canvas);

        const newLayer = {
            id,
            canvas,
            ctx: canvas.getContext('2d'),
            name: `レイヤー ${layerCounter}`,
            undoStack: [],
            redoStack: []
        };
        layers.push(newLayer);
        setActiveLayer(id);
        renderLayers();
    }

    function deleteLayer() {
        if (layers.length <= 1) {
            alert('最後のレイヤーは削除できません。');
            return;
        }
        const index = layers.findIndex(l => l.id === activeLayerId);
        const [deletedLayer] = layers.splice(index, 1);
        deletedLayer.canvas.remove();
        
        const newActiveIndex = Math.max(0, index - 1);
        if (layers.length > 0) {
            setActiveLayer(layers[newActiveIndex].id);
        }
        renderLayers();
    }

    function setActiveLayer(id) {
        if (activeLayerId === id) return; 
        activeLayerId = id;
        renderLayers();
    }
    
    function moveLayer(direction) {
        const index = layers.findIndex(l => l.id === activeLayerId);
        if (direction === 'up' && index > 0) {
            [layers[index], layers[index - 1]] = [layers[index - 1], layers[index]];
        } else if (direction === 'down' && index < layers.length - 1) {
            [layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];
        }
        renderLayers();
    }

    function renderLayers() {
        layerList.innerHTML = '';

        layers.forEach((layer, index) => {
            layer.canvas.style.zIndex = index;
        });
        overlayCanvas.style.zIndex = layers.length + 1;

        layers.slice().reverse().forEach(layer => {
            const li = document.createElement('li');
            li.textContent = layer.name;
            li.dataset.id = layer.id;
            if (layer.id === activeLayerId) {
                li.classList.add('active');
            }
            
            let clickTimer = null;

            li.addEventListener('click', () => {
                clickTimer = setTimeout(() => {
                    setActiveLayer(layer.id);
                }, 200);
            });
            
            li.addEventListener('dblclick', () => {
                clearTimeout(clickTimer); 
                
                li.innerHTML = '';
                const input = document.createElement('input');
                input.type = 'text';
                input.value = layer.name;
                input.style.width = '90%';
                
                const saveName = () => {
                    const newName = input.value.trim();
                    if (newName) {
                        layer.name = newName;
                    }
                    renderLayers();
                };
                
                input.addEventListener('blur', saveName);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') saveName();
                    else if (e.key === 'Escape') renderLayers();
                });
                
                li.appendChild(input);
                input.focus();
                input.select();
            });

            layerList.appendChild(li);
        });
    }

    // --- 描画ロジック ---
    function getActiveLayer() { return layers.find(l => l.id === activeLayerId); }
    function getCoords(e) {
        const rect = canvasContainer.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function startDrawing(e) {
        const layer = getActiveLayer();
        if (!layer) return;
        e.preventDefault();
        saveState(layer);
        isDrawing = true;
        const { x, y } = getCoords(e);
        [startX, startY] = [x, y];
    }

    function draw(e) {
        if (!isDrawing) return;
        const layer = getActiveLayer();
        if (!layer) return;
        e.preventDefault();
        const { x, y } = getCoords(e);
        const ctx = layer.ctx;
        if (activeTool === 'pen' || activeTool === 'eraser') {
            ctx.strokeStyle = colorPicker.value;
            ctx.lineWidth = lineWidthInput.value;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = (activeTool === 'eraser') ? 'destination-out' : 'source-over';
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(x, y);
            ctx.stroke();
            [startX, startY] = [x, y];
        } else if (['line', 'rect', 'circle'].includes(activeTool)) {
            overlayCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            overlayCtx.strokeStyle = colorPicker.value;
            overlayCtx.lineWidth = lineWidthInput.value;
            overlayCtx.beginPath();
            if (activeTool === 'line') {
                overlayCtx.moveTo(startX, startY);
                overlayCtx.lineTo(x, y);
            } else if (activeTool === 'rect') {
                overlayCtx.rect(startX, startY, x - startX, y - startY);
            } else if (activeTool === 'circle') {
                const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
                overlayCtx.arc(startX, startY, radius, 0, Math.PI * 2);
            }
            overlayCtx.stroke();
        }
    }

    function stopDrawing(e) {
        if (!isDrawing) return;
        isDrawing = false;
        const layer = getActiveLayer();
        if (!layer) return;
        const { x, y } = getCoords(e.changedTouches ? e.changedTouches[0] : e);
        if (['line', 'rect', 'circle'].includes(activeTool)) {
            overlayCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            const ctx = layer.ctx;
            ctx.strokeStyle = colorPicker.value;
            ctx.lineWidth = lineWidthInput.value;
            ctx.globalCompositeOperation = 'source-over';
            ctx.beginPath();
            if (activeTool === 'line') {
                ctx.moveTo(startX, startY);
                ctx.lineTo(x, y);
            } else if (activeTool === 'rect') {
                ctx.rect(startX, startY, x - startX, y - startY);
            } else if (activeTool === 'circle') {
                const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
                ctx.arc(startX, startY, radius, 0, Math.PI * 2);
            }
            ctx.stroke();
        }
    }

    // --- ツールと機能 ---
    function clearActiveLayer() {
        const layer = getActiveLayer();
        if (layer && confirm(`「${layer.name}」を消去しますか？`)) {
            saveState(layer);
            layer.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
    }
    
    function saveImage() {
        const compositeCanvas = document.createElement('canvas');
        compositeCanvas.width = CANVAS_WIDTH;
        compositeCanvas.height = CANVAS_HEIGHT;
        const compositeCtx = compositeCanvas.getContext('2d');
        layers.forEach(layer => {
            compositeCtx.drawImage(layer.canvas, 0, 0);
        });
        const link = document.createElement('a');
        link.download = '作品.png';
        link.href = compositeCanvas.toDataURL();
        link.click();
    }
    
    // --- 履歴管理 ---
    function saveState(layer) {
        if (!layer) return;
        layer.undoStack.push(layer.canvas.toDataURL());
        if (layer.undoStack.length > 30) layer.undoStack.shift();
        layer.redoStack = [];
    }

    function undo() {
        const layer = getActiveLayer();
        if (!layer || layer.undoStack.length === 0) return;
        layer.redoStack.push(layer.canvas.toDataURL());
        const lastState = layer.undoStack.pop();
        const img = new Image();
        img.src = lastState;
        img.onload = () => {
            layer.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            layer.ctx.drawImage(img, 0, 0);
        };
    }
    
    function redo() {
        const layer = getActiveLayer();
        if (!layer || layer.redoStack.length === 0) return;
        layer.undoStack.push(layer.canvas.toDataURL());
        const nextState = layer.redoStack.pop();
        const img = new Image();
        img.src = nextState;
        img.onload = () => {
            layer.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            layer.ctx.drawImage(img, 0, 0);
        };
    }
    
    // --- イベントリスナー ---
    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.tool-btn.active')?.classList.remove('active');
            btn.classList.add('active');
            activeTool = btn.dataset.tool;
        });
    });

    document.getElementById('addLayerBtn').addEventListener('click', addLayer);
    document.getElementById('deleteLayerBtn').addEventListener('click', deleteLayer);
    document.getElementById('moveLayerUpBtn').addEventListener('click', () => moveLayer('up'));
    document.getElementById('moveLayerDownBtn').addEventListener('click', () => moveLayer('down'));
    document.getElementById('clearBtn').addEventListener('click', clearActiveLayer);
    document.getElementById('saveBtn').addEventListener('click', saveImage);
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('redoBtn').addEventListener('click', redo);
    
    canvasContainer.addEventListener('mousedown', startDrawing);
    canvasContainer.addEventListener('mousemove', draw);
    canvasContainer.addEventListener('mouseup', stopDrawing);
    canvasContainer.addEventListener('mouseleave', stopDrawing);
    canvasContainer.addEventListener('touchstart', startDrawing, { passive: false });
    canvasContainer.addEventListener('touchmove', draw, { passive: false });
    canvasContainer.addEventListener('touchend', stopDrawing);
    
    // --- 初期化 ---
    function init() {
        addLayer();
        document.querySelector('.tool-btn[data-tool="pen"]').classList.add('active');
    }

    init();
});