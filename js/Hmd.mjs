export default class Hmd {
    constructor(vrDisplay, gl, canvas, shaderProgram) {
        this.vrDisplay = vrDisplay;
        this.gl = gl;
        this.canvas = canvas;
        this.shaderProgram = shaderProgram;

        this.scene = [];
        this.mvMatrix = mat4.create();
        this.pMatrix = mat4.create();
        this.identity = mat4.create();
        this.viewMat = mat4.create();
        this.frameData = new VRFrameData();

        window.requestAnimationFrame((t) => this.render(t));
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