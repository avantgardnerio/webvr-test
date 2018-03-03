import Canvas from './Canvas.mjs';
import Triangle from "./Triangle.mjs";
import Gamepads from "./Gamepads.mjs";
import Hmd from './Hmd.mjs';

let gl = undefined;
let shaderProgram;
let canvas;
let triangle;
let gamepads;
let hmd;

window.onload = async () => {
    canvas = new Canvas();
    document.body.appendChild(canvas.element);

    initGL(canvas.element);
    await initShaders();
    initBuffers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    hmd = new Hmd(gl, canvas.element, shaderProgram);
    hmd.scene.push(triangle);
    hmd.scene.push(gamepads);
    try {
        await hmd.init();
    } catch (ex) {
        console.error(ex);
        alert(`Error: ${ex}`);
    }
    canvas.onClick = async () => {
        try {
            await hmd.requestPresent();
        } catch (ex) {
            console.error(ex);
            alert(`Error: ${ex}`);
        }
    };

    window.addEventListener(`resize`, onResize, false);
    onResize();
};

const initGL = (canvas) => {
    gl = canvas.getContext(`webgl`);
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
};

const onResize = () => {
    if (hmd.isPresenting) {
        const renderSize = hmd.renderSize;
        canvas.width = renderSize[0];
        canvas.height = renderSize[1];
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
    triangle = new Triangle();
    triangle.init(gl);

    // lines
    gamepads = new Gamepads();
    gamepads.init(gl);
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
