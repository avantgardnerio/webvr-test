import renderRoom from './Room.mjs';

export default class Scene {
    constructor(store) {
        this.store = store;
        this.state = undefined;
        this.dirty = true;
        this.itemCount = 0;
        this.identity = mat4.create();

        store.subscribe(() => this.stateChange());
    }

    stateChange() {
        console.log(`state change!`);
        const state = this.store.getState();
        this.dirty = true;
        this.state = state;
    }

    init(gl) {
        if(this.state) {
            console.log(`rendering ${this.state.rooms.length} rooms`);
            const lineVerts = [];
            this.state.rooms.forEach(room => renderRoom(room, lineVerts));
            this.itemCount = lineVerts.length / 3;
            if(!this.buffer) this.buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVerts), gl.STATIC_DRAW);
        }
        this.dirty = false;
    }

    render(gl, shaderProgram) {
        if (this.dirty) this.init(gl);
        if (this.itemCount < 3) return;
        gl.uniformMatrix4fv(shaderProgram.modelMat, false, this.identity);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.vertexAttribPointer(shaderProgram.vertPosAttr, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINE_STRIP, 0, this.itemCount);
    }
}