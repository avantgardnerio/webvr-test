export default class RoomTool {

    constructor() {
        this.dirty = true;
        this.vertices = [];
        this.identity = mat4.create();
        this.currentController = undefined;
        this.y = undefined;
    }

    onPress(gpIdx, btnIdx, positions) {
        this.currentController = gpIdx;
        const position = positions[gpIdx];
        console.log(`Adding `, position);
        const vert = [this.snap(position[0]), this.snap(position[2])];
        this.vertices.push(vert);
        if (this.vertices.length === 1) {
            this.y = this.snap(position[1]);
            this.vertices.push(vert);
        } else if (
            this.vertices[0][0] === this.vertices[this.vertices.length - 1][0]
            && this.vertices[0][1] === this.vertices[this.vertices.length - 1][1]
        ) {
            this.vertices = [];
        }
        this.dirty = true;
    }

    onMove(positions) {
        if (this.currentController === undefined) return;
        if (this.vertices.length < 2) return;
        const position = positions[this.currentController];
        const vert = [this.snap(position[0]), this.snap(position[2])];
        this.vertices[this.vertices.length - 1] = vert;
        this.dirty = true;
    }

    snap(coord) {
        return Math.round(coord * 100) / 100;
    }

    onRelease(gpIdx, btnIdx, positions) {
    }

    init(gl) {
        if (!this.buffer) this.buffer = gl.createBuffer();
        const verts = this.vertices.reduce((acc, cur) => {
            acc.push(cur[0], this.y, cur[1]);
            return acc;
        }, []);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
        this.dirty = false;
    }

    render(gl, shaderProgram) {
        if (this.vertices.length < 2) return;
        if (this.dirty) this.init(gl);
        gl.uniformMatrix4fv(shaderProgram.modelMat, false, this.identity);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.vertexAttribPointer(shaderProgram.vertPosAttr, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINE_STRIP, 0, this.vertices.length);
    }
}