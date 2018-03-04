const initialState = {
    rooms: []
};

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'ADD_ROOM':
            return addRoom(state, action);
        default:
            return state;
    }
};

const addRoom = (state, action) => {
    console.log(`Adding room!`);
    const newState = JSON.parse(JSON.stringify(state));
    newState.rooms.push(action.room);
    return newState;
};

export default reducer;