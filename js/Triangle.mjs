export default class Triangle {

    constructor() {
        this.itemSize = 3;
        this.numItems = 3;
        this.identity = mat4.create();
    }

    init(gl) {
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        const vertices = [
            0.0, 0.5, -1.0,
            -0.5, -0.5, -1.0,
            0.5, -0.5, -1.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    }

    render(gl, shaderProgram) {
        gl.uniformMatrix4fv(shaderProgram.modelMat, false, this.identity);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.vertexAttribPointer(shaderProgram.vertPosAttr, this.itemSize, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, this.numItems);
    }
}