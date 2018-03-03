import Canvas from './Canvas.mjs';

let gl = undefined;
let shaderProgram;
let mvMatrix = mat4.create();
let pMatrix = mat4.create();
const identity = mat4.create();
let myMatrix = mat4.create();
let viewMat = mat4.create();
let gamepadMatTemp = mat4.create();
let gamepadMatHandle = mat4.create();
let triangleBuff;
let lineBuff;
let vrDisplay;
let gamepads = [];
const frameData = new VRFrameData();
let canvas;

window.onload = async () => {
    canvas = new Canvas();
    canvas.onClick = async () => {
        try {
            await vrDisplay.requestPresent([{source: canvas.element}]);
        } catch (ex) {
            alert(`Error: ${ex}`);
        }
    };
    document.body.appendChild(canvas.element);

    initGL(canvas.element);
    await initShaders();
    initBuffers();

    const displays = await navigator.getVRDisplays();
    if (displays.length < 1) alert(`No headset detected!`);
    vrDisplay = displays[0];
    vrDisplay.depthNear = 0.1;
    vrDisplay.depthFar = 1024.0;
    if (vrDisplay.capabilities.canPresent !== true) {
        alert(`Headset cannot present!`);
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
    window.addEventListener(`resize`, onResize, false);
    onResize();
};

const initGL = (canvas) => {
    gl = canvas.getContext(`webgl`);
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
};

const onResize = () => {
    if (vrDisplay && vrDisplay.isPresenting) {
        const leftEye = vrDisplay.getEyeParameters(`left`);
        const rightEye = vrDisplay.getEyeParameters(`right`);
        canvas.width = Math.max(leftEye.renderWidth, rightEye.renderWidth) * 2;
        canvas.height = Math.max(leftEye.renderHeight, rightEye.renderHeight);
    } else {
        canvas.width = canvas.offsetWidth * window.devicePixelRatio;
        canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    }
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

    shaderProgram.projectionMat = gl.getUniformLocation(shaderProgram, `projectionMat`);
    shaderProgram.viewMat = gl.getUniformLocation(shaderProgram, `viewMat`);
    shaderProgram.modelMat = gl.getUniformLocation(shaderProgram, `modelMat`);
};

const initBuffers = () => {
    // Triangle
    triangleBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuff);
    const vertices = [
        0.0, 0.5, -1.0,
        -0.5, -0.5, -1.0,
        0.5, -0.5, -1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    triangleBuff.itemSize = 3;
    triangleBuff.numItems = 3;

    // lines
    lineBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuff);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.75, 1.2,
        0.0, 0.75, 1.0
    ]), gl.STATIC_DRAW);
    lineBuff.itemSize = 3;
    lineBuff.numItems = 2;
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

const getPoseMatrix = (out, pose) => {
    mat4.fromRotationTranslation(out, pose.orientation, pose.position);
    mat4.multiply(out, vrDisplay.stageParameters.sittingToStandingTransform, out);
};

const getStandingViewMatrix = (out, view) => {
    mat4.invert(out, vrDisplay.stageParameters.sittingToStandingTransform);
    mat4.multiply(out, view, out);
};

const render = (t) => {
    vrDisplay.getFrameData(frameData);
    mat4.identity(identity);
    if (vrDisplay.isPresenting) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Left
        gl.viewport(0, 0, canvas.width / 2, canvas.height);
        getStandingViewMatrix(viewMat, frameData.leftViewMatrix);
        gl.uniformMatrix4fv(shaderProgram.projectionMat, false, frameData.leftProjectionMatrix);
        gl.uniformMatrix4fv(shaderProgram.viewMat, false, viewMat);

        // Triangles
        gl.uniformMatrix4fv(shaderProgram.modelMat, false, identity);
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuff);
        gl.vertexAttribPointer(shaderProgram.vertPosAttr, triangleBuff.itemSize, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, triangleBuff.numItems);

        // Controller
        mat4.identity(myMatrix);
        mat4.identity(gamepadMatHandle);
        if (gamepads.length > 0) {
            getPoseMatrix(myMatrix, gamepads[0].pose);
            mat4.identity(gamepadMatTemp);
            mat4.translate(gamepadMatTemp, gamepadMatTemp, [0, -0.5, -0.3]);
            mat4.rotateX(gamepadMatTemp, gamepadMatTemp, -Math.PI * 0.2);
            mat4.scale(gamepadMatTemp, gamepadMatTemp, [0.25, 0.25, 0.5]);
            mat4.multiply(gamepadMatHandle, myMatrix, gamepadMatTemp);
        }
        gl.uniformMatrix4fv(shaderProgram.modelMat, false, gamepadMatHandle);
        gl.bindBuffer(gl.ARRAY_BUFFER, lineBuff);
        gl.vertexAttribPointer(shaderProgram.vertPosAttr, lineBuff.itemSize, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINE_STRIP, 0, lineBuff.numItems);

        // Right
        gl.viewport(canvas.width / 2, 0, canvas.width / 2, canvas.height);
        getStandingViewMatrix(viewMat, frameData.rightViewMatrix);
        gl.uniformMatrix4fv(shaderProgram.projectionMat, false, frameData.rightProjectionMatrix);
        gl.uniformMatrix4fv(shaderProgram.viewMat, false, viewMat);

        // Triangles
        gl.uniformMatrix4fv(shaderProgram.modelMat, false, identity);
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuff);
        gl.vertexAttribPointer(shaderProgram.vertPosAttr, triangleBuff.itemSize, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, triangleBuff.numItems);

        // Controller
        mat4.identity(myMatrix);
        mat4.identity(gamepadMatHandle);
        if (gamepads.length > 0) {
            getPoseMatrix(myMatrix, gamepads[0].pose);
            mat4.identity(gamepadMatTemp);
            mat4.translate(gamepadMatTemp, gamepadMatTemp, [0, -0.5, -0.3]);
            mat4.rotateX(gamepadMatTemp, gamepadMatTemp, -Math.PI * 0.2);
            mat4.scale(gamepadMatTemp, gamepadMatTemp, [0.25, 0.25, 0.5]);
            mat4.multiply(gamepadMatHandle, myMatrix, gamepadMatTemp);
        }
        gl.uniformMatrix4fv(shaderProgram.modelMat, false, gamepadMatHandle);
        gl.bindBuffer(gl.ARRAY_BUFFER, lineBuff);
        gl.vertexAttribPointer(shaderProgram.vertPosAttr, lineBuff.itemSize, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINE_STRIP, 0, lineBuff.numItems);

        vrDisplay.submitFrame();
        vrDisplay.requestAnimationFrame(render);
    } else {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
        mat4.identity(mvMatrix);

        mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, -7.0]);
        mat4.rotateZ(mvMatrix, t * 0.001);
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuff);
        gl.vertexAttribPointer(shaderProgram.vertPosAttr, triangleBuff.itemSize, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(shaderProgram.viewMat, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.modelMat, false, mvMatrix);
        gl.drawArrays(gl.TRIANGLES, 0, triangleBuff.numItems);

        window.requestAnimationFrame(render);
    }
};
