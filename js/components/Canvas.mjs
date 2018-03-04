export default class Canvas {
    constructor() {
        this.canvas = document.createElement(`canvas`);
        this.canvas.width = 500;
        this.canvas.height = 500;
        this.canvas.style.height = `100%`;
        this.canvas.style.width = `100%`;
    }

    set onClick(func) {
        this.canvas.onclick = func;
    }

    get width() {
        return this.canvas.width;
    }

    set width(val) {
        this.canvas.width = val;
    }

    get height() {
        return this.canvas.height;
    }

    set height(val) {
        this.canvas.height = val;
    }

    get offsetWidth() {
        return this.canvas.offsetWidth;
    }

    get offsetHeight() {
        return this.canvas.offsetHeight;
    }

    get element() {
        return this.canvas;
    }
}