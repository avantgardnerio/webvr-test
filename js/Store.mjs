export const ActionTypes = {
    INIT: '@@redux/INIT'
};

export default class Store {
    constructor(reducer, preloadedState) {
        this.state = preloadedState;
        this.reducer = reducer;
        this.isDispatching = false;
        this.listeners = [];

        this.dispatch({ type: ActionTypes.INIT });
    }

    getState() {
        return this.state;
    }

    dispatch(action) {
        if (this.isDispatching) throw new Error('Reducers may not dispatch actions.');

        try {
            this.isDispatching = true;
            this.state = this.reducer(this.state, action);
        } finally {
            this.isDispatching = false
        }

        this.listeners.forEach((func) => func());
        return action;
    }

    subscribe(listener) {
        if (typeof listener !== 'function') throw new Error('Expected listener to be a function.');
        this.listeners.push(listener);
        const unsubscribe = () => this.listeners = this.listeners.filter(l => l !== listener);
        return unsubscribe;
    }
}