const renderRoom = (room, lineVerts) => {
    const floor = room.vertices.reduce((acc, cur) => {
        acc.push(cur[0], room.floor, cur[1]);
        return acc;
    }, []);
    lineVerts.push(...floor);

    const ceiling = room.vertices.reduce((acc, cur) => {
        acc.push(cur[0], room.ceiling, cur[1]);
        return acc;
    }, []);
    lineVerts.push(...ceiling);
};
export default renderRoom;