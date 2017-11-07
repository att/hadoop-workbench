import {
    GET_PLATFORM_MODULES_LISTING_REQUEST,
    GET_PLATFORM_MODULES_LISTING_SUCCESS,
    GET_PLATFORM_MODULES_LISTING_FAILURE
} from '../constants/action-types';

const initialState = {
    isUpdating: false,
    modules: {}
};

let {assign} = Object;

export default function tenant(state = initialState, action) {
    switch (action.type) {
        case GET_PLATFORM_MODULES_LISTING_REQUEST:
            return assign({}, state, {
                isUpdating: true
            });
        case GET_PLATFORM_MODULES_LISTING_FAILURE:
            return assign({}, state, {
                isUpdating: false
            });
        case GET_PLATFORM_MODULES_LISTING_SUCCESS:
            return assign({},
                state,
                action.result.reduce((host, item)=> {
                    host.modules[item.id] = item;
                    return host;
                }, {
                    isUpdating: false,
                    modules: {}
                }));

        default:
            return state;
    }
}
