/**
 * DOHMBOY64 Retro Avatar Cropper
 * Adapted from Avatar Cropper with retro arcade styling
 */

class RetroAvatarCropper {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.image = null;
        this.cropArea = { x: 0, y: 0, width: 150, height: 150 };
        this.cropShape = 'circle'; // 'circle' or 'square'
        this.rotation = 0;
        this.zoom = 1;
        this.borderType = 'none';
        this.borderSize = 0.05;
        this.borderColor = '#ff8c00';
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.currentAction = 'none'; // 'none', 'move', 'resize'
        this.resizeAnchor = null; // 'nw', 'ne', 'sw', 'se' for resize
        this.resizeOffset = { x: 0, y: 0 };
        this.previews = [];
        this.previewSizes = [30, 40, 64, 128];

        this.initializeCanvas();
        this.setupEventListeners();
        this.createPreviews();
        this.updateUI();
    }

    initializeCanvas() {
        const canvasContainer = document.getElementById('cropper-canvas');
        this.canvas = document.getElementById('main-canvas');

        // Set canvas size to container
        const rect = canvasContainer.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    setupEventListeners() {
        // File upload
        document.getElementById('image-upload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.loadImage(file);
        });

        // Drag and drop
        const canvasContainer = document.getElementById('cropper-canvas');
        canvasContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            canvasContainer.classList.add('drag-over');
        });

        canvasContainer.addEventListener('dragleave', (e) => {
            e.preventDefault();
            canvasContainer.classList.remove('drag-over');
        });

        canvasContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            canvasContainer.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.loadImage(file);
            }
        });

        // Canvas interactions
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.handleTouchEnd());

        // Control buttons
        document.getElementById('shape-circle').addEventListener('click', () => this.setCropShape('circle'));
        document.getElementById('shape-square').addEventListener('click', () => this.setCropShape('square'));

        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-fit').addEventListener('click', () => this.fitToScreen());

        document.getElementById('rotation-slider').addEventListener('input', (e) => {
            this.rotation = parseInt(e.target.value);
            this.updateUI();
            this.render();
        });

        document.getElementById('flip-horizontal').addEventListener('click', () => this.flipHorizontal());
        document.getElementById('flip-vertical').addEventListener('click', () => this.flipVertical());

        document.getElementById('border-select').addEventListener('change', (e) => this.setBorderType(e.target.value));
        document.getElementById('border-size').addEventListener('input', (e) => {
            this.borderSize = parseFloat(e.target.value);
            this.render();
        });

        document.getElementById('center-crop').addEventListener('click', () => this.centerCrop());
        document.getElementById('reset-crop').addEventListener('click', () => this.resetCrop());
        document.getElementById('download-btn').addEventListener('click', () => this.downloadImage());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.image = img;
                this.fitToScreen();
                this.centerCrop();
                this.render();
                this.updateDownloadButton();
                this.showSuccess('Image loaded successfully!');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    fitToScreen() {
        if (!this.image) return;

        const canvasRect = this.canvas.getBoundingClientRect();
        const scaleX = canvasRect.width / this.image.width;
        const scaleY = canvasRect.height / this.image.height;
        this.zoom = Math.min(scaleX, scaleY) * 0.8; // Leave some margin

        this.render();
    }

    centerCrop() {
        if (!this.image) return;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const size = Math.min(this.canvas.width, this.canvas.height) * 0.4;

        this.cropArea = {
            x: centerX - size / 2,
            y: centerY - size / 2,
            width: size,
            height: size
        };

        this.render();
    }

    resetCrop() {
        this.rotation = 0;
        this.zoom = 1;
        this.cropShape = 'circle';
        this.borderType = 'none';
        this.borderSize = 0.05;
        this.fitToScreen();
        this.centerCrop();
        this.updateUI();
        this.showSuccess('Crop reset to defaults');
    }

    setCropShape(shape) {
        this.cropShape = shape;
        document.getElementById('shape-circle').classList.toggle('toggled', shape === 'circle');
        document.getElementById('shape-square').classList.toggle('toggled', shape === 'square');
        this.render();
    }

    setBorderType(type) {
        this.borderType = type;
        const colorInput = document.getElementById('border-color');

        if (type === 'solid') {
            colorInput.classList.remove('hidden');
        } else {
            colorInput.classList.add('hidden');
        }

        this.render();
    }

    setCustomGradient(gradientData) {
        this.customGradient = gradientData;
        this.borderType = 'custom';
        this.render();
    }

    zoomIn() {
        this.zoom *= 1.2;
        this.render();
    }

    zoomOut() {
        this.zoom *= 0.8;
        this.render();
    }

    flipHorizontal() {
        this.ctx.save();
        this.ctx.scale(-1, 1);
        this.render();
        this.ctx.restore();
    }

    flipVertical() {
        this.ctx.save();
        this.ctx.scale(1, -1);
        this.render();
        this.ctx.restore();
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const action = this.getMouseAction(x, y);
        if (action !== 'none') {
            this.currentAction = action;
            this.mouseOrigin = { x, y };
            this.cropAreaOrigin = { ...this.cropArea };

            if (action === 'resize') {
                this.resizeAnchor = this.getResizeAnchor(x, y);
                this.resizeOffset = {
                    x: x - this.getAnchorPoint(this.resizeAnchor).x,
                    y: y - this.getAnchorPoint(this.resizeAnchor).y
                };
            }

            this.canvas.style.cursor = this.getCursorForAction(action);
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.currentAction !== 'none') {
            if (this.currentAction === 'move') {
                this.performMove(x, y);
            } else if (this.currentAction === 'resize') {
                this.performResize(x, y);
            }
            this.constrainCropArea();
            this.render();
        } else {
            // Update cursor based on hover position
            const action = this.getMouseAction(x, y);
            this.canvas.style.cursor = this.getCursorForAction(action);
        }
    }

    handleMouseUp() {
        this.currentAction = 'none';
        this.resizeAnchor = null;
        this.canvas.style.cursor = 'crosshair';
    }

    handleWheel(e) {
        e.preventDefault();
        if (e.deltaY < 0) {
            this.zoomIn();
        } else {
            this.zoomOut();
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleMouseDown(mouseEvent);
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleMouseMove(mouseEvent);
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp();
    }

    handleKeyDown(e) {
        const step = 5;
        switch (e.key) {
            case 'ArrowUp':
                this.cropArea.y -= step;
                break;
            case 'ArrowDown':
                this.cropArea.y += step;
                break;
            case 'ArrowLeft':
                this.cropArea.x -= step;
                break;
            case 'ArrowRight':
                this.cropArea.x += step;
                break;
        }
        this.constrainCropArea();
        this.render();
    }

    getMouseAction(x, y) {
        // Check if point is near resize handles (corners)
        const resizeThreshold = 20; // pixels from corner to be considered resize
        const corners = this.getCornerPoints();

        for (const [corner, point] of Object.entries(corners)) {
            const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
            if (distance <= resizeThreshold) {
                return 'resize';
            }
        }

        // Check if point is inside crop area
        if (this.isPointInCropArea(x, y)) {
            return 'move';
        }

        return 'none';
    }

    getResizeAnchor(x, y) {
        const corners = this.getCornerPoints();
        let closestCorner = null;
        let minDistance = Infinity;

        for (const [corner, point] of Object.entries(corners)) {
            const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
            if (distance < minDistance) {
                minDistance = distance;
                closestCorner = corner;
            }
        }

        return closestCorner;
    }

    getAnchorPoint(anchor) {
        const centerX = this.cropArea.x + this.cropArea.width / 2;
        const centerY = this.cropArea.y + this.cropArea.height / 2;

        switch (anchor) {
            case 'nw': return { x: this.cropArea.x, y: this.cropArea.y };
            case 'ne': return { x: this.cropArea.x + this.cropArea.width, y: this.cropArea.y };
            case 'sw': return { x: this.cropArea.x, y: this.cropArea.y + this.cropArea.height };
            case 'se': return { x: this.cropArea.x + this.cropArea.width, y: this.cropArea.y + this.cropArea.height };
            default: return { x: centerX, y: centerY };
        }
    }

    getCornerPoints() {
        return {
            nw: { x: this.cropArea.x, y: this.cropArea.y },
            ne: { x: this.cropArea.x + this.cropArea.width, y: this.cropArea.y },
            sw: { x: this.cropArea.x, y: this.cropArea.y + this.cropArea.height },
            se: { x: this.cropArea.x + this.cropArea.width, y: this.cropArea.y + this.cropArea.height }
        };
    }

    performMove(x, y) {
        const deltaX = x - this.mouseOrigin.x;
        const deltaY = y - this.mouseOrigin.y;

        this.cropArea.x = this.cropAreaOrigin.x + deltaX;
        this.cropArea.y = this.cropAreaOrigin.y + deltaY;
    }

    performResize(x, y) {
        const anchorPoint = this.getAnchorPoint(this.resizeAnchor);
        const newAnchorX = x - this.resizeOffset.x;
        const newAnchorY = y - this.resizeOffset.y;

        let newX = this.cropArea.x;
        let newY = this.cropArea.y;
        let newWidth = this.cropArea.width;
        let newHeight = this.cropArea.height;

        switch (this.resizeAnchor) {
            case 'nw':
                newX = newAnchorX;
                newY = newAnchorY;
                newWidth = this.cropArea.x + this.cropArea.width - newAnchorX;
                newHeight = this.cropArea.y + this.cropArea.height - newAnchorY;
                break;
            case 'ne':
                newY = newAnchorY;
                newWidth = newAnchorX - this.cropArea.x;
                newHeight = this.cropArea.y + this.cropArea.height - newAnchorY;
                break;
            case 'sw':
                newX = newAnchorX;
                newWidth = this.cropArea.x + this.cropArea.width - newAnchorX;
                newHeight = newAnchorY - this.cropArea.y;
                break;
            case 'se':
                newWidth = newAnchorX - this.cropArea.x;
                newHeight = newAnchorY - this.cropArea.y;
                break;
        }

        // Maintain aspect ratio
        const aspectRatio = this.cropArea.width / this.cropArea.height;
        if (Math.abs(newWidth / newHeight - aspectRatio) > 0.01) {
            if (newWidth / newHeight > aspectRatio) {
                newWidth = newHeight * aspectRatio;
                if (this.resizeAnchor === 'nw' || this.resizeAnchor === 'sw') {
                    newX = this.cropArea.x + this.cropArea.width - newWidth;
                }
            } else {
                newHeight = newWidth / aspectRatio;
                if (this.resizeAnchor === 'nw' || this.resizeAnchor === 'ne') {
                    newY = this.cropArea.y + this.cropArea.height - newHeight;
                }
            }
        }

        // Apply minimum size constraint
        const minSize = 50;
        if (newWidth < minSize) {
            newWidth = minSize;
            if (this.resizeAnchor === 'nw' || this.resizeAnchor === 'sw') {
                newX = this.cropArea.x + this.cropArea.width - newWidth;
            }
        }
        if (newHeight < minSize) {
            newHeight = minSize;
            if (this.resizeAnchor === 'nw' || this.resizeAnchor === 'ne') {
                newY = this.cropArea.y + this.cropArea.height - newHeight;
            }
        }

        this.cropArea.x = newX;
        this.cropArea.y = newY;
        this.cropArea.width = newWidth;
        this.cropArea.height = newHeight;
    }

    getCursorForAction(action) {
        switch (action) {
            case 'move': return 'grab';
            case 'resize':
                switch (this.resizeAnchor) {
                    case 'nw': return 'nw-resize';
                    case 'ne': return 'ne-resize';
                    case 'sw': return 'sw-resize';
                    case 'se': return 'se-resize';
                    default: return 'crosshair';
                }
            default: return 'crosshair';
        }
    }

    isPointInCropArea(x, y) {
        const dx = x - (this.cropArea.x + this.cropArea.width / 2);
        const dy = y - (this.cropArea.y + this.cropArea.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (this.cropShape === 'circle') {
            return distance <= this.cropArea.width / 2;
        } else {
            return x >= this.cropArea.x && x <= this.cropArea.x + this.cropArea.width &&
                   y >= this.cropArea.y && y <= this.cropArea.y + this.cropArea.height;
        }
    }

    constrainCropArea() {
        this.cropArea.x = Math.max(0, Math.min(this.canvas.width - this.cropArea.width, this.cropArea.x));
        this.cropArea.y = Math.max(0, Math.min(this.canvas.height - this.cropArea.height, this.cropArea.y));
    }

    render() {
        if (!this.image) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Save context
        this.ctx.save();

        // Move to center for rotation
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.rotate(this.rotation * Math.PI / 180);
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(-this.image.width / 2, -this.image.height / 2);

        // Draw image
        this.ctx.drawImage(this.image, 0, 0);

        // Restore context
        this.ctx.restore();

        // Draw crop overlay
        this.drawCropOverlay();

        // Update previews
        this.updatePreviews();
    }

    drawCropOverlay() {
        // Dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Clear crop area
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'destination-out';

        if (this.cropShape === 'circle') {
            this.ctx.beginPath();
            this.ctx.arc(
                this.cropArea.x + this.cropArea.width / 2,
                this.cropArea.y + this.cropArea.height / 2,
                this.cropArea.width / 2,
                0, 2 * Math.PI
            );
            this.ctx.fill();
        } else {
            this.ctx.fillRect(this.cropArea.x, this.cropArea.y, this.cropArea.width, this.cropArea.height);
        }

        this.ctx.restore();

        // Draw border
        if (this.borderType !== 'none' && this.borderSize > 0) {
            this.drawBorder();
        }

        // Draw crop outline
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        if (this.cropShape === 'circle') {
            this.ctx.beginPath();
            this.ctx.arc(
                this.cropArea.x + this.cropArea.width / 2,
                this.cropArea.y + this.cropArea.height / 2,
                this.cropArea.width / 2,
                0, 2 * Math.PI
            );
            this.ctx.stroke();
        } else {
            this.ctx.strokeRect(this.cropArea.x, this.cropArea.y, this.cropArea.width, this.cropArea.height);
        }

        this.ctx.setLineDash([]);
    }

    drawBorder() {
        const centerX = this.cropArea.x + this.cropArea.width / 2;
        const centerY = this.cropArea.y + this.cropArea.height / 2;
        const radius = (this.cropArea.width / 2) * (1 + this.borderSize);

        if (this.borderType === 'solid') {
            this.ctx.strokeStyle = this.borderColor;
            this.ctx.lineWidth = this.cropArea.width * this.borderSize;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, this.cropArea.width / 2, 0, 2 * Math.PI);
            this.ctx.stroke();
        } else if (this.borderType === 'custom' && this.customGradient) {
            this.drawCustomGradientBorder();
        } else if (this.borderType.startsWith('lgbt') || this.borderType.startsWith('trans') || this.borderType.startsWith('nonbinary')) {
            this.drawPrideBorder();
        }
    }

    drawCustomGradientBorder() {
        const centerX = this.cropArea.x + this.cropArea.width / 2;
        const centerY = this.cropArea.y + this.cropArea.height / 2;
        const innerRadius = this.cropArea.width / 2;
        const outerRadius = innerRadius * (1 + this.borderSize);
        const rings = Math.max(6, this.customGradient.gradient.length);

        // Create gradient for each ring
        for (let i = 0; i < rings; i++) {
            const ratio = i / rings;
            const ringInner = innerRadius + (outerRadius - innerRadius) * ratio;
            const ringOuter = innerRadius + (outerRadius - innerRadius) * (ratio + 1/rings);

            // Create radial gradient for this ring
            const gradient = this.ctx.createRadialGradient(centerX, centerY, ringInner, centerX, centerY, ringOuter);

            // Add color stops from custom gradient
            this.customGradient.gradient.forEach(stop => {
                gradient.addColorStop(stop.pos, stop.color);
            });

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, ringOuter, 0, 2 * Math.PI);
            this.ctx.arc(centerX, centerY, ringInner, 0, 2 * Math.PI, true);
            this.ctx.fill();
        }
    }

    drawPrideBorder() {
        const centerX = this.cropArea.x + this.cropArea.width / 2;
        const centerY = this.cropArea.y + this.cropArea.height / 2;
        const innerRadius = this.cropArea.width / 2;
        const outerRadius = innerRadius * (1 + this.borderSize);
        const rings = 6;

        const borderColors = {
            'retro': ['#f97316', '#fb8c00', '#fbbf24', '#f97316', '#fb8c00', '#fbbf24'],
            'rgb': ['#ff0000', '#00ff00', '#0000ff', '#ff0000', '#00ff00', '#0000ff']
        };

        const colors = borderColors[this.borderType] || borderColors['retro'];

        for (let i = 0; i < rings; i++) {
            const ratio = i / rings;
            const ringInner = innerRadius + (outerRadius - innerRadius) * ratio;
            const ringOuter = innerRadius + (outerRadius - innerRadius) * (ratio + 1/rings);

            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, ringOuter, 0, 2 * Math.PI);
            this.ctx.arc(centerX, centerY, ringInner, 0, 2 * Math.PI, true);
            this.ctx.fillStyle = colors[i % colors.length];
            this.ctx.fill();
        }
    }



    createPreviews() {
        const previewGrid = document.getElementById('preview-grid');
        previewGrid.innerHTML = '';

        this.previewSizes.forEach(size => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';

            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;

            const label = document.createElement('div');
            label.className = 'preview-label';
            label.textContent = `${size}x${size}`;

            previewItem.appendChild(canvas);
            previewItem.appendChild(label);
            previewGrid.appendChild(previewItem);

            this.previews.push({ canvas, size, ctx: canvas.getContext('2d') });
        });
    }

    updatePreviews() {
        if (!this.image) return;

        this.previews.forEach(preview => {
            const ctx = preview.ctx;
            ctx.clearRect(0, 0, preview.size, preview.size);

            // Calculate source rectangle from crop area
            const sourceX = (this.cropArea.x - this.canvas.width / 2) / this.zoom + this.image.width / 2;
            const sourceY = (this.cropArea.y - this.canvas.height / 2) / this.zoom + this.image.height / 2;
            const sourceWidth = this.cropArea.width / this.zoom;
            const sourceHeight = this.cropArea.height / this.zoom;

            // Draw rotated and cropped image
            ctx.save();
            ctx.translate(preview.size / 2, preview.size / 2);
            ctx.rotate(this.rotation * Math.PI / 180);

            // Scale to fit preview
            const scale = preview.size / Math.max(sourceWidth, sourceHeight);
            ctx.scale(scale, scale);

            ctx.drawImage(
                this.image,
                sourceX - sourceWidth / 2,
                sourceY - sourceHeight / 2,
                sourceWidth,
                sourceHeight,
                -sourceWidth / 2,
                -sourceHeight / 2,
                sourceWidth,
                sourceHeight
            );

            // Apply shape mask
            if (this.cropShape === 'circle') {
                ctx.globalCompositeOperation = 'destination-in';
                ctx.beginPath();
                ctx.arc(0, 0, sourceWidth / 2, 0, 2 * Math.PI);
                ctx.fill();
            }

            ctx.restore();
        });
    }

    updateUI() {
        document.getElementById('rotation-value').textContent = `${this.rotation}°`;
        document.getElementById('rotation-slider').value = this.rotation;
    }

    updateDownloadButton() {
        const btn = document.getElementById('download-btn');
        btn.disabled = !this.image;
        btn.textContent = this.image ? 'DOWNLOAD' : 'LOAD IMAGE FIRST';
    }

    downloadImage() {
        if (!this.image) return;

        // Create a temporary canvas for the final image
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = 512;
        tempCanvas.height = 512;

        // Calculate scaling to fit the crop area
        const scale = 512 / this.cropArea.width;

        // Center the crop area
        tempCtx.save();
        tempCtx.translate(256, 256);
        tempCtx.rotate(this.rotation * Math.PI / 180);
        tempCtx.scale(scale * this.zoom, scale * this.zoom);

        // Draw the cropped portion
        const sourceX = (this.cropArea.x - this.canvas.width / 2) / this.zoom + this.image.width / 2;
        const sourceY = (this.cropArea.y - this.canvas.height / 2) / this.zoom + this.image.height / 2;
        const sourceWidth = this.cropArea.width / this.zoom;
        const sourceHeight = this.cropArea.height / this.zoom;

        tempCtx.drawImage(
            this.image,
            sourceX - sourceWidth / 2,
            sourceY - sourceHeight / 2,
            sourceWidth,
            sourceHeight,
            -sourceWidth / 2,
            -sourceHeight / 2,
            sourceWidth,
            sourceHeight
        );

        // Apply shape mask
        if (this.cropShape === 'circle') {
            tempCtx.globalCompositeOperation = 'destination-in';
            tempCtx.beginPath();
            tempCtx.arc(0, 0, sourceWidth / 2, 0, 2 * Math.PI);
            tempCtx.fill();
        }

        tempCtx.restore();

        // Download the image
        tempCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `avatar_${this.cropShape}_${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
            this.showSuccess('Avatar downloaded successfully!');
        });
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.position = 'fixed';
        successDiv.style.top = '20px';
        successDiv.style.right = '20px';
        successDiv.style.zIndex = '10000';

        document.body.appendChild(successDiv);
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    showError(message) {
        const overlay = document.querySelector('.error-console-overlay');
        const console = document.querySelector('.error-console');

        console.textContent = message;
        overlay.style.display = 'block';
        console.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            overlay.style.display = 'none';
            console.style.display = 'none';
        }, 5000);

        // Click to dismiss
        overlay.onclick = () => {
            overlay.style.display = 'none';
            console.style.display = 'none';
        };
    }
}

// Gradient Editor Class
class GradientEditor {
    constructor(cropper) {
        this.cropper = cropper;
        this.overlay = document.getElementById('gradient-editor-overlay');
        this.dialog = document.querySelector('.gradient-editor-dialog');
        this.previewCanvas = document.getElementById('gradient-preview-canvas');
        this.previewCtx = this.previewCanvas.getContext('2d');

        this.currentGradient = {
            angle: 0,
            stops: [
                { pos: 0, color: '#ff0000' },
                { pos: 0.5, color: '#00ff00' },
                { pos: 1, color: '#0000ff' }
            ]
        };

        this.selectedStopIndex = 0;
        this.setupEventListeners();
        this.updatePreview();
    }

    setupEventListeners() {
        // Dialog controls
        document.querySelector('.gradient-editor-close').addEventListener('click', () => this.hide());
        document.getElementById('gradient-cancel-btn').addEventListener('click', () => this.hide());

        document.getElementById('gradient-save-btn').addEventListener('click', () => {
            this.saveGradient();
            this.hide();
        });

        // Angle control
        document.getElementById('gradient-angle').addEventListener('input', (e) => {
            this.currentGradient.angle = parseInt(e.target.value);
            document.getElementById('angle-value').textContent = `${this.currentGradient.angle}°`;
            this.updatePreview();
        });

        // Stop management
        document.getElementById('add-stop-btn').addEventListener('click', () => this.addStop());
        document.getElementById('remove-stop-btn').addEventListener('click', () => this.removeStop());
        document.getElementById('equidistant-btn').addEventListener('click', () => this.makeEquidistant());

        // Presets
        document.getElementById('gradient-presets').addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadPreset(e.target.value);
                e.target.value = '';
            }
        });

        // Click outside to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
    }

    show() {
        this.overlay.style.display = 'block';
        this.updateUI();
        this.updatePreview();
    }

    hide() {
        this.overlay.style.display = 'none';
    }

    updateUI() {
        // Update angle display
        document.getElementById('gradient-angle').value = this.currentGradient.angle;
        document.getElementById('angle-value').textContent = `${this.currentGradient.angle}°`;

        // Update stops list
        const stopsList = document.getElementById('gradient-stops-list');
        stopsList.innerHTML = '';

        this.currentGradient.stops.forEach((stop, index) => {
            const stopItem = document.createElement('div');
            stopItem.className = `gradient-stop-item ${index === this.selectedStopIndex ? 'current' : ''}`;

            stopItem.innerHTML = `
                <div class="gradient-stop-color" style="background-color: ${stop.color}" data-index="${index}"></div>
                <span class="gradient-stop-position">${Math.round(stop.pos * 100)}%</span>
                <button class="gradient-stop-remove" data-index="${index}">×</button>
            `;

            // Color picker event
            stopItem.querySelector('.gradient-stop-color').addEventListener('click', () => {
                this.selectStop(index);
                this.openColorPicker(index);
            });

            // Remove button event
            stopItem.querySelector('.gradient-stop-remove').addEventListener('click', () => {
                this.removeStopAt(index);
            });

            stopsList.appendChild(stopItem);
        });

        // Update info
        document.getElementById('gradient-stops-count').textContent = `Stops: ${this.currentGradient.stops.length}`;
        document.getElementById('gradient-angle-display').textContent = `Angle: ${this.currentGradient.angle}°`;
    }

    selectStop(index) {
        this.selectedStopIndex = index;
        this.updateUI();
    }

    openColorPicker(index) {
        const stop = this.currentGradient.stops[index];
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = stop.color;
        colorInput.style.position = 'absolute';
        colorInput.style.left = '-9999px';

        colorInput.addEventListener('change', (e) => {
            this.currentGradient.stops[index].color = e.target.value;
            this.updateUI();
            this.updatePreview();
            document.body.removeChild(colorInput);
        });

        colorInput.addEventListener('blur', () => {
            document.body.removeChild(colorInput);
        });

        document.body.appendChild(colorInput);
        colorInput.click();
    }

    addStop() {
        if (this.currentGradient.stops.length >= 10) {
            this.cropper.showError('Maximum 10 gradient stops allowed');
            return;
        }

        // Add stop at 50% position
        const newStop = { pos: 0.5, color: '#ffffff' };
        this.currentGradient.stops.push(newStop);
        this.selectedStopIndex = this.currentGradient.stops.length - 1;
        this.updateUI();
        this.updatePreview();
    }

    removeStop() {
        if (this.currentGradient.stops.length <= 2) {
            this.cropper.showError('Minimum 2 gradient stops required');
            return;
        }

        this.currentGradient.stops.splice(this.selectedStopIndex, 1);
        this.selectedStopIndex = Math.max(0, this.selectedStopIndex - 1);
        this.updateUI();
        this.updatePreview();
    }

    removeStopAt(index) {
        if (this.currentGradient.stops.length <= 2) {
            this.cropper.showError('Minimum 2 gradient stops required');
            return;
        }

        this.currentGradient.stops.splice(index, 1);
        this.selectedStopIndex = Math.max(0, Math.min(this.selectedStopIndex, this.currentGradient.stops.length - 1));
        this.updateUI();
        this.updatePreview();
    }

    makeEquidistant() {
        const count = this.currentGradient.stops.length;
        this.currentGradient.stops.forEach((stop, index) => {
            stop.pos = index / (count - 1);
        });
        this.updateUI();
        this.updatePreview();
    }

    loadPreset(presetName) {
        const presets = {
            rainbow: [
                { pos: 0, color: '#ff0000' },
                { pos: 0.17, color: '#ff8000' },
                { pos: 0.33, color: '#ffff00' },
                { pos: 0.5, color: '#80ff00' },
                { pos: 0.67, color: '#00ff00' },
                { pos: 0.83, color: '#0080ff' },
                { pos: 1, color: '#0000ff' }
            ],
            sunset: [
                { pos: 0, color: '#ff6b35' },
                { pos: 0.5, color: '#f7931e' },
                { pos: 1, color: '#ffb627' }
            ],
            ocean: [
                { pos: 0, color: '#001122' },
                { pos: 0.5, color: '#0066cc' },
                { pos: 1, color: '#00aaff' }
            ],
            fire: [
                { pos: 0, color: '#000000' },
                { pos: 0.33, color: '#ff4400' },
                { pos: 0.67, color: '#ffaa00' },
                { pos: 1, color: '#ffff00' }
            ],
            forest: [
                { pos: 0, color: '#0d4f3c' },
                { pos: 0.5, color: '#2d6a4f' },
                { pos: 1, color: '#52b788' }
            ]
        };

        if (presets[presetName]) {
            this.currentGradient.stops = [...presets[presetName]];
            this.currentGradient.angle = 0;
            this.selectedStopIndex = 0;
            this.updateUI();
            this.updatePreview();
        }
    }

    updatePreview() {
        const ctx = this.previewCtx;
        const canvas = this.previewCanvas;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Create gradient
        const angle = (this.currentGradient.angle * Math.PI) / 180;
        const x1 = canvas.width / 2 + Math.cos(angle - Math.PI/2) * canvas.width / 2;
        const y1 = canvas.height / 2 + Math.sin(angle - Math.PI/2) * canvas.height / 2;
        const x2 = canvas.width / 2 + Math.cos(angle + Math.PI/2) * canvas.width / 2;
        const y2 = canvas.height / 2 + Math.sin(angle + Math.PI/2) * canvas.height / 2;

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);

        // Add color stops
        this.currentGradient.stops.forEach(stop => {
            gradient.addColorStop(stop.pos, stop.color);
        });

        // Fill with gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw border
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    }

    saveGradient() {
        // Convert to the format expected by the border system
        const gradientData = {
            name: 'Custom Gradient',
            angle: this.currentGradient.angle,
            gradient: this.currentGradient.stops.map(stop => ({
                pos: stop.pos,
                color: stop.color
            }))
        };

        // Apply to cropper
        this.cropper.setCustomGradient(gradientData);
        this.cropper.showSuccess('Custom gradient applied!');
    }

    getCurrentGradient() {
        return { ...this.currentGradient };
    }

    setGradient(gradient) {
        this.currentGradient = { ...gradient };
        this.selectedStopIndex = 0;
        this.updateUI();
        this.updatePreview();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const cropper = new RetroAvatarCropper();
    const gradientEditor = new GradientEditor(cropper);

    // Add gradient editor trigger to border select
    document.getElementById('border-select').addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            gradientEditor.show();
            // Reset select to previous value
            e.target.value = cropper.borderType || 'none';
        }
    });

    // Make gradient editor globally accessible
    window.gradientEditor = gradientEditor;
});
