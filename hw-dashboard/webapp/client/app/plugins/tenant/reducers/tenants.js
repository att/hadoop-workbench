import cuid from 'cuid';
import {
    GET_TENANT_TEMPLATES_LISTING_REQUEST,
    GET_TENANT_TEMPLATES_LISTING_SUCCESS,
    GET_TENANT_TEMPLATES_LISTING_FAILURE,

    GET_TENANT_REQUEST,
    GET_TENANT_SUCCESS,
    GET_TENANT_FAILURE,

    POST_TENANT_REQUEST,
    POST_TENANT_SUCCESS,
    POST_TENANT_FAILURE,

    PUT_TENANT_REQUEST,
    PUT_TENANT_SUCCESS,
    PUT_TENANT_FAILURE,

    DELETE_TENANT_REQUEST,
    DELETE_TENANT_SUCCESS,
    DELETE_TENANT_FAILURE,

    DELETE_TENANT_FORCE_REQUEST

} from '../constants/action-types';
import handleReducer from '../helpers/handle-reducer';


let [DELETING, PUTTING, POSTING, GETTING] = ['DELETING', 'PUTTING', 'POSTING', 'GETTING'];
let {assign} = Object;
let cuidStore = {};
let getCuidFor = (id) => {
    if (!id) {
        return cuid();
    } else if (!cuidStore[id]) {
        cuidStore[id] = cuid();
    }
    return cuidStore[id];
};
let createMeta = (status, busy = true, error = null, errorType = null) => ({
    isDeleting: status === DELETING,
    isGetting: status === GETTING,
    isPosting: status === POSTING,
    isPutting: status === PUTTING,
    busy,
    error,
    errorType
});

export default handleReducer({}, {
    [GET_TENANT_TEMPLATES_LISTING_SUCCESS](state, action){
        return action.result.reduce((host, container)=> {
            let item = container.tenant;
            item.$cuid = getCuidFor(item.info && item.info.id);

            let oldTenant = state[item.$cuid];
            item.$meta = oldTenant ? oldTenant.$meta : createMeta(null, false);

            host[item.$cuid] = item;
            return host;
        }, Object.keys(state)
            .filter(cuid => !(state[cuid] &&
                              state[cuid].info &&
                              state[cuid].info.id))
            .reduce((host, cuid) => {
            host[cuid] = state[cuid];
            return host;
        }, {}));
    },

    [GET_TENANT_REQUEST](state, action){
        let $cuid = getCuidFor(action.tenantId);
        let item = assign({}, state[$cuid], {
            $cuid,
            id: action.tenantId,
            $meta: createMeta(GETTING)
        });
        return assign({}, state, {
            [item.$cuid]: item
        })
    },
    [GET_TENANT_FAILURE](state, action){
        let $cuid = getCuidFor(action.tenantId);
        let item = assign({}, state[$cuid], {
            $cuid,
            id: action.tenantId,
            $meta: createMeta(GETTING, false, action.error)
        });
        return assign({}, state, {
            [item.$cuid]: item
        })
    },
    [GET_TENANT_SUCCESS](state, action){
        let $cuid = getCuidFor(action.tenantId);
        let item = assign({}, state[$cuid], action.result, {
            $cuid,
            $meta: createMeta(null, false)
        });
        return assign({}, state, {
            [item.$cuid]: item
        })
    },

    [POST_TENANT_REQUEST](state, action){
        let item = assign({}, action.tenant, {
            $meta: createMeta(POSTING)
        });

        return assign({}, state, {
            [item.$cuid]: item
        });
    },
    [POST_TENANT_FAILURE](state, action){
        let item = assign({}, state[action.tenant.$cuid], {
            $meta: createMeta(POSTING, false, action.error)
        });

        return assign({}, state, {
            [item.$cuid]: item
        });
    },
    [POST_TENANT_SUCCESS](state, action){
        let item = assign({}, action.result, {
            $cuid: action.tenant.$cuid,
            $meta: createMeta(null, false)
        });

        return assign({}, state, {
            [item.$cuid]: item
        });
    },
    [PUT_TENANT_REQUEST](state, action){
        let item = assign({}, action.tenant, {
            $meta: createMeta(PUTTING)
        });

        return assign({}, state, {
            [item.$cuid]: item
        });
    },
    [PUT_TENANT_FAILURE](state, action){
        let item = assign({}, state[action.tenant.$cuid], {
            $meta: createMeta(PUTTING, false, action.error)
        });

        return assign({}, state, {
            [item.$cuid]: item
        });
    },
    [PUT_TENANT_SUCCESS](state, action){
        let item = assign({}, action.result, {
            $cuid: action.tenant.$cuid,
            $meta: createMeta(null, false)
        });

        return assign({}, state, {
            [item.$cuid]: item
        });
    },
    [DELETE_TENANT_REQUEST](state, action){
        let item = assign({}, action.tenant, {
            $meta: createMeta(DELETING)
        });

        return assign({}, state, {
            [item.$cuid]: item
        });
    },
    [DELETE_TENANT_FORCE_REQUEST](state, action){
        let item = assign({}, action.tenant, {
            $meta: createMeta(DELETING)
        });

        return assign({}, state, {
            [item.$cuid]: item
        });
    },
    [DELETE_TENANT_FAILURE](state, action){
        let item = assign({}, action.tenant, {
            $meta: createMeta(DELETING, false, action.error, action.errorType)
        });

        return assign({}, state, {
            [item.$cuid]: item
        });
    },
    [DELETE_TENANT_SUCCESS](state, action){
        let tenants = assign({}, state);
        delete tenants[action.tenant.$cuid];
        return tenants;
    }
});
export let getCuidById = tenantId => cuidStore[tenantId];
