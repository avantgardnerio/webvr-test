window.onload = () => {
    const cnvMain = document.createElement(`canvas`);
    cnvMain.style.width = `100%`;
    cnvMain.style.height = `100%`;
    document.body.appendChild(cnvMain);

    const onResize = () => {
        cnvMain.width = cnvMain.offsetWidth * window.devicePixelRatio;
        cnvMain.height = cnvMain.offsetHeight * window.devicePixelRatio;
    };
    onResize();
};
