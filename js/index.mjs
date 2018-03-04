import Canvas from './components/Canvas.mjs';
import Scene from './scene/Scene.mjs';
import Gamepads from "./renderables/Gamepads.mjs";
import Hmd from './Hmd.mjs';
import reducer from './reducers/reducer.mjs';
import RoomTool from "./tools/RoomTool.mjs";

window.onload = async () => {
    const canvas = new Canvas();
    document.body.appendChild(canvas.element);

    const store = Redux.createStore(reducer);
    const scene = new Scene(store);

    const tools = {
        room: new RoomTool(store)
    };
    let mode = `room`;

    const gamepads = new Gamepads();
    gamepads.onPress = (gpIdx, btnIdx, positions) => {
        console.log(`Pressed ${btnIdx} on gamepad ${gpIdx}`);
        const tool = tools[mode];
        if(!tool) return;
        tool.onPress(gpIdx, btnIdx, positions);
    };
    gamepads.onRelease = (gpIdx, btnIdx, positions) => {
        console.log(`Released ${btnIdx} on gamepad ${gpIdx}`);
        const tool = tools[mode];
        if(!tool) return;
        tool.onRelease(gpIdx, btnIdx, positions);
    };
    gamepads.onMove = (positions) => {
        const tool = tools[mode];
        if(!tool) return;
        tool.onMove(positions);
    };

    const hmd = new Hmd(canvas.element);
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
    hmd.addToScene(scene);
    hmd.addToScene(gamepads);
    hmd.addToScene(tools[`room`]);

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
    window.addEventListener(`resize`, onResize, false);
    onResize();
};

