export const addRoom = (vertices, floor, ceiling) => {
    return {
        type: 'ADD_ROOM',
        room: {
            vertices,
            floor,
            ceiling
        }
    }
};