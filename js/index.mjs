import Store from './Store.mjs';
import Canvas from './components/Canvas.mjs';
import Triangle from "./renderables/Triangle.mjs";
import Gamepads from "./renderables/Gamepads.mjs";
import Hmd from './Hmd.mjs';
import reducer from './reducers/reducer.mjs';

window.onload = async () => {
    const canvas = new Canvas();
    document.body.appendChild(canvas.element);

    const store = new Store(reducer);

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
    hmd.addToScene(new Triangle());
    hmd.addToScene(new Gamepads());

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

