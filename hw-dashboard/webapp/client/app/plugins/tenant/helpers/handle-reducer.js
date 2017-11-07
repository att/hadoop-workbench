export default function handleReducer(initialState, handlers) {
    return (state = initialState, action)=> {
        if (handlers[action.type]) {
            return handlers[action.type](state, action);
        } else {
            return state;
        }
    }
}
