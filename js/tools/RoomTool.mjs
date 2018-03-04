export default class RoomTool {

    constructor() {
        this.dirty = true;
        this.vertices = [];
        this.identity = mat4.create();
    }

    onPress(gpIdx, btnIdx, positions) {
        const position = positions[gpIdx];
        console.log(`Adding `, position);
        this.vertices.push(...position);
        this.dirty = true;
    }
    
    onRelease(gpIdx, btnIdx, positions) {
    }

    init(gl) {
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
        this.dirty = false;
    }

    render(gl, shaderProgram) {
        if(this.vertices.length < 2) return;
        if(this.dirty) this.init(gl);
        gl.uniformMatrix4fv(shaderProgram.modelMat, false, this.identity);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.vertexAttribPointer(shaderProgram.vertPosAttr, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINE_STRIP, 0, this.vertices.length / 3);
    }
}