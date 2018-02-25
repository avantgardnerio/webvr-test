let gl = undefined;
let shaderProgram;
let mvMatrix = mat4.create();
let pMatrix = mat4.create();
let vertBuff;
let vrDisplay;
let gamepads = [];
const frameData = new VRFrameData();

const initGL = (canvas) => {
    gl = canvas.getContext(`webgl`);
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
};

const getShader = async (url) => {
    const code = await (await fetch(url)).text();
    const type = url.endsWith(`.frag`) ? gl.FRAGMENT_SHADER : gl.VERTEX_SHADER;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const msg = gl.getShaderInfoLog(shader);
        throw new Error(`Error compiling shader ${url}: ${msg}`);
    }
    return shader;
};

const initShaders = async () => {
    const fragmentShader = await getShader(`shader/index.frag`);
    const vertexShader = await getShader(`shader/index.vert`);

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert(`Could not initialise shaders`);
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertPosAttr = gl.getAttribLocation(shaderProgram, `aVertexPosition`);
    gl.enableVertexAttribArray(shaderProgram.vertPosAttr);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, `uPMatrix`);
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, `uMVMatrix`);
};

const initBuffers = () => {
    vertBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuff);
    const vertices = [
        0.0, 0.5, -1.0,
        -0.5, -0.5, -1.0,
        0.5, -0.5, -1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    vertBuff.itemSize = 3;
    vertBuff.numItems = 3;
};

const render = (t) => {
    vrDisplay.getFrameData(frameData);
    if (vrDisplay.isPresenting) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Left
        gl.viewport(0, 0, gl.viewportWidth / 2, gl.viewportHeight);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertBuff);
        gl.vertexAttribPointer(shaderProgram.vertPosAttr, vertBuff.itemSize, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, frameData.leftProjectionMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, frameData.leftViewMatrix);
        gl.drawArrays(gl.TRIANGLES, 0, vertBuff.numItems);

        // Right
        gl.viewport(gl.viewportWidth / 2, 0, gl.viewportWidth / 2, gl.viewportHeight);
        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix, [0.0, 0.0, -7.0]);
        mat4.rotateZ(mvMatrix, t * 0.001);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertBuff);
        gl.vertexAttribPointer(shaderProgram.vertPosAttr, vertBuff.itemSize, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, frameData.rightProjectionMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, frameData.rightViewMatrix);
        gl.drawArrays(gl.TRIANGLES, 0, vertBuff.numItems);

        vrDisplay.submitFrame();
        vrDisplay.requestAnimationFrame(render);
    } else {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
        mat4.identity(mvMatrix);

        mat4.translate(mvMatrix, [0.0, 0.0, -7.0]);
        mat4.rotateZ(mvMatrix, t * 0.001);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertBuff);
        gl.vertexAttribPointer(shaderProgram.vertPosAttr, vertBuff.itemSize, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        gl.drawArrays(gl.TRIANGLES, 0, vertBuff.numItems);

        window.requestAnimationFrame(render);
    }
};
window.onload = async () => {
    const canvas = document.createElement(`canvas`);
    canvas.width = 500;
    canvas.height = 500;
    canvas.onclick = async () => {
        try {
            const res = await vrDisplay.requestPresent([{source: canvas}]);
        } catch (ex) {
            console.error(ex);
        }
    };
    document.body.appendChild(canvas);

    initGL(canvas);
    await initShaders();
    initBuffers();

    const displays = await navigator.getVRDisplays();
    if (displays.length < 1) alert(`No headset detected!`);
    vrDisplay = displays[0];
    vrDisplay.depthNear = 0.1;
    vrDisplay.depthFar = 1024.0;
    if (vrDisplay.capabilities.canPresent !== true) {
        alert(`Headset cannot present!`);
    } else {
        //console.log(res);
    }

    window.addEventListener('gamepadconnected', (e) => {
        console.log(`Gamepad ${e.gamepad.index}`);
        gamepads = navigator.getGamepads();
        console.log(gamepads);
    });
    window.addEventListener('gamepaddisconnected', (e) => {
        console.log(`Gamepad ${e.gamepad.index}`);
        gamepads = navigator.getGamepads();
    });

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    window.requestAnimationFrame(render);
};