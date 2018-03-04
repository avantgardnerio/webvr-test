export default class RoomTool {

    constructor() {
        this.dirty = true;
        this.vertices = [];
        this.identity = mat4.create();
        this.currentController = undefined;
        this.floor = undefined;
        this.ceiling = undefined;
        this.mode = `draw`;
    }

    onPress(gpIdx, btnIdx, positions) {
        this.currentController = gpIdx;
        const position = positions[gpIdx];
        console.log(`Adding `, position);
        if(this.mode === `draw`) {
            const vert = [this.snap(position[0]), this.snap(position[2])];
            this.vertices.push(vert);
            if (this.vertices.length === 1) {
                this.floor = this.snap(position[1]);
                this.vertices.push(vert);
            } else if (
                this.vertices[0][0] === this.vertices[this.vertices.length - 1][0]
                && this.vertices[0][1] === this.vertices[this.vertices.length - 1][1]
            ) {
                this.mode = `extrude`;
                this.ceiling = this.floor;
            }
        } else {
            this.vertices = [];
            this.floor = undefined;
            this.ceiling = undefined;
            this.mode = `draw`;
        }
        this.dirty = true;
    }

    onMove(positions) {
        if (this.currentController === undefined) return;
        if (this.vertices.length < 2) return;
        const position = positions[this.currentController];
        if(this.mode === `draw`) {
            const vert = [this.snap(position[0]), this.snap(position[2])];
            this.vertices[this.vertices.length - 1] = vert;
        } else {
            this.ceiling = this.snap(position[1]);
        }
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
            acc.push(cur[0], this.floor, cur[1]);
            return acc;
        }, []);
        if(this.ceiling) {
            const ceiling = this.vertices.reduce((acc, cur) => {
                acc.push(cur[0], this.ceiling, cur[1]);
                return acc;
            }, []);
            verts.push(...ceiling);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
        this.dirty = false;
    }

    render(gl, shaderProgram) {
        if (this.vertices.length < 2) return;
        if (this.dirty) this.init(gl);
        const len = this.ceiling ? this.vertices.length * 2 : this.vertices.length;
        gl.uniformMatrix4fv(shaderProgram.modelMat, false, this.identity);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.vertexAttribPointer(shaderProgram.vertPosAttr, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINE_STRIP, 0, len);
    }
}