export default class Hmd {
    constructor(canvas) {
        this.canvas = canvas;

        this.scene = [];
        this.mvMatrix = mat4.create();
        this.pMatrix = mat4.create();
        this.identity = mat4.create();
        this.viewMat = mat4.create();
        this.frameData = new VRFrameData();

        this.gl = this.canvas.getContext(`webgl`);
        this.gl.viewportWidth = this.canvas.width;
        this.gl.viewportHeight = this.canvas.height;
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
    }

    addToScene(renderable) {
        renderable.init(this.gl);
        this.scene.push(renderable);
    }

    async init() {
        const displays = await navigator.getVRDisplays();
        if (displays.length < 1) {
            throw new Error(`No headset detected!`);
        }
        this.vrDisplay = displays[0];
        this.vrDisplay.depthNear = 0.1;
        this.vrDisplay.depthFar = 1024.0;
        if (this.vrDisplay.capabilities.canPresent !== true) {
            throw new Error(`Headset cannot present!`);
        }
        await this.initShaders();
        window.requestAnimationFrame((t) => this.render(t));
    }

    async initShaders() {
        const fragmentShader = await this.getShader(`shader/index.frag`);
        const vertexShader = await this.getShader(`shader/index.vert`);

        this.shaderProgram = this.gl.createProgram();
        this.gl.attachShader(this.shaderProgram, vertexShader);
        this.gl.attachShader(this.shaderProgram, fragmentShader);
        this.gl.linkProgram(this.shaderProgram);

        if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
            throw new Error(`Could not initialise shaders`);
        }

        this.gl.useProgram(this.shaderProgram);

        this.shaderProgram.vertPosAttr = this.gl.getAttribLocation(this.shaderProgram, `aVertexPosition`);
        this.gl.enableVertexAttribArray(this.shaderProgram.vertPosAttr);

        this.shaderProgram.projectionMat = this.gl.getUniformLocation(this.shaderProgram, `projectionMat`);
        this.shaderProgram.viewMat = this.gl.getUniformLocation(this.shaderProgram, `viewMat`);
        this.shaderProgram.modelMat = this.gl.getUniformLocation(this.shaderProgram, `modelMat`);
    };

    async getShader(url) {
        const code = await (await fetch(url)).text();
        const type = url.endsWith(`.frag`) ? this.gl.FRAGMENT_SHADER : this.gl.VERTEX_SHADER;
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, code);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const msg = this.gl.getShaderInfoLog(shader);
            throw new Error(`Error compiling shader ${url}: ${msg}`);
        }
        return shader;
    }

    getStandingViewMatrix(out, view) {
        mat4.invert(out, this.vrDisplay.stageParameters.sittingToStandingTransform);
        mat4.multiply(out, view, out);
    }

    renderEye(left, view, projMat) {
        this.gl.viewport(left, 0, this.canvas.width / 2, this.canvas.height);
        this.getStandingViewMatrix(this.viewMat, view);
        this.gl.uniformMatrix4fv(this.shaderProgram.projectionMat, false, projMat);
        this.gl.uniformMatrix4fv(this.shaderProgram.viewMat, false, this.viewMat);

        this.scene.forEach(renderable => renderable.render(this.gl, this.shaderProgram, this.vrDisplay));
    }

    get isPresenting() {
        return this.vrDisplay && this.vrDisplay.isPresenting;
    }

    get renderSize() {
        const leftEye = this.vrDisplay.getEyeParameters(`left`);
        const rightEye = this.vrDisplay.getEyeParameters(`right`);
        const width = Math.max(leftEye.renderWidth, rightEye.renderWidth) * 2;
        const height = Math.max(leftEye.renderHeight, rightEye.renderHeight);
        return [width, height];
    }

    async requestPresent() {
        await this.vrDisplay.requestPresent([{source: this.canvas}]);
    }

    render(t) {
        this.vrDisplay.getFrameData(this.frameData);
        mat4.identity(this.identity);
        if (this.vrDisplay.isPresenting) {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

            this.renderEye(0, this.frameData.leftViewMatrix, this.frameData.leftProjectionMatrix);
            this.renderEye(this.canvas.width / 2, this.frameData.rightViewMatrix, this.frameData.rightProjectionMatrix);

            this.vrDisplay.submitFrame();
            this.vrDisplay.requestAnimationFrame((t) => this.render(t));
        } else {
            this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
            mat4.perspective(this.pMatrix, 45, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100.0);
            mat4.identity(this.mvMatrix);

            mat4.translate(this.mvMatrix, this.mvMatrix, [0.0, 0.0, -7.0]);
            mat4.rotateZ(this.mvMatrix, t * 0.001);

            this.scene.forEach(renderable => renderable.render(this.gl, this.shaderProgram, this.vrDisplay));

            window.requestAnimationFrame((t) => this.render(t));
        }
    }

}