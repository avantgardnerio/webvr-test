const initialState = {
    scene: [
        {
            type: `room`,
            vertices: [[-2, -2], [2, -2], [2, 2], [-2, 2]],
            height: 2.5
        }
    ]
};

const reducer = (state = initialState, action) => {
    return state;
};

export default reducer;