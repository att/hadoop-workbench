import { ADD_WIDGET, REMOVE_WIDGET, UPDATE_WIDGET } from '../constants/action-types';

const initialState = [];

export default function widgets(state = initialState, action) {
    switch (action.type) {
        case ADD_WIDGET:
            return [
                action.widget,
                ...state
            ];

        case REMOVE_WIDGET:
            return state.filter(widget =>
                widget.id !== action.id
            );

        case UPDATE_WIDGET:
            return state.map(w => w.id === action.widget.id ? Object.assign({}, w, action.widget) : w);

        default:
            return state;
    }
}
