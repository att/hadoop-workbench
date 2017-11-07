import cuid from 'cuid';
import handleReducer from '../helpers/handle-reducer';
import {
    GET_TENANT_TEMPLATES_LISTING_REQUEST,
    GET_TENANT_TEMPLATES_LISTING_SUCCESS,
    GET_TENANT_TEMPLATES_LISTING_FAILURE,

    GET_TENANT_TEMPLATES_REQUEST,
    GET_TENANT_TEMPLATES_SUCCESS,
    GET_TENANT_TEMPLATES_FAILURE,

    DELETE_TENANT_TEMPLATE_REQUEST,
    DELETE_TENANT_TEMPLATE_SUCCESS,
    DELETE_TENANT_TEMPLATE_FAILURE,

    DELETE_TENANT_TEMPLATE_OOZIE_REQUEST,
    DELETE_TENANT_TEMPLATE_OOZIE_SUCCESS,
    DELETE_TENANT_TEMPLATE_OOZIE_FAILURE,

    DELETE_TENANT_TEMPLATE_FLUME_REQUEST,
    DELETE_TENANT_TEMPLATE_FLUME_SUCCESS,
    DELETE_TENANT_TEMPLATE_FLUME_FAILURE,

    PUT_TENANT_TEMPLATE_OOZIE_REQUEST,
    PUT_TENANT_TEMPLATE_OOZIE_SUCCESS,
    PUT_TENANT_TEMPLATE_OOZIE_FAILURE,

    PUT_TENANT_TEMPLATE_FLUME_REQUEST,
    PUT_TENANT_TEMPLATE_FLUME_SUCCESS,
    PUT_TENANT_TEMPLATE_FLUME_FAILURE

} from '../constants/action-types';


let [DELETING, PUTTING, POSTING, GETTING] = ['DELETING', 'PUTTING', 'POSTING', 'GETTING'];
let {assign} = Object;
let templateCuidStore = {};
export let cuidFor = id => {
    if (!id) {
        return cuid();
    } else if (!templateCuidStore[id]) {
        templateCuidStore[id] = cuid();
    }
    return templateCuidStore[id];
};

export let createMeta = (status, busy = true, error = null, errorType = null) => ({
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
        return action.result.reduce((host, item)=> {
            let templateCuid = cuidFor(item.info.id);
            let oldTemplate = state[templateCuid];

            item.$meta = oldTemplate ? oldTemplate.$meta : createMeta(null, false);
            item.$cuid = templateCuid;

            host[item.$cuid] = item;
            return host;
        }, Object.keys(state).filter(cuid => !state[cuid].info.id).reduce((host, cuid) => {
            host[cuid] = state[cuid];
            return host;
        }, {}));
    },
    [GET_TENANT_TEMPLATES_SUCCESS](state, action){
        let loadedTenantId = null;
        let newTemplates = action.result.reduce((host, item)=> {
            let templateCuid = cuidFor(item.info.id);
            loadedTenantId = item.info.tenantId;
            let oldTemplate = state[templateCuid];

            item.$meta = oldTemplate ? oldTemplate.$meta : createMeta(null, false);
            item.$cuid = templateCuid;

            host[item.$cuid] = item;
            return host;
        }, {});

        /**
         * Remove old templates for loaded tenant:
         */
        if (loadedTenantId !== null) {
            let allTemplateCuids = Object.keys(state);
            allTemplateCuids.forEach( cuid => {
                if (state[cuid] && state[cuid].info && state[cuid].info.tenantId === loadedTenantId) {
                    delete state[cuid];
                }
            });
        }
        return assign({}, state, newTemplates);
    },
    [DELETE_TENANT_TEMPLATE_REQUEST](state, action){
        let template = assign({}, action.template, {
            $meta: createMeta(DELETING)
        });

        return assign({}, state, {
            [template.$cuid]: template
        });
    },
    [DELETE_TENANT_TEMPLATE_FAILURE](state, action){
        let template = assign({}, action.template, {
            $meta: createMeta(DELETING, false, action.error)
        });

        return assign({}, state, {
            [template.$cuid]: template
        });
    },
    [DELETE_TENANT_TEMPLATE_SUCCESS](state, action){
        let templates = assign({}, state);
        delete templates[action.template.$cuid];

        return templates;
    },
    /**
     * Remove template from state if it's mirror object was removed from oozieTemplates
     * @param state // is data.tenant.templates[]
     * @param action // is {oozieTemplate:{...} } object
     */
    [DELETE_TENANT_TEMPLATE_OOZIE_SUCCESS](state, action){
        let templates = assign({}, state);
        if (templates[action.component.$cuid] !== undefined) {
            delete templates[action.component.$cuid];
        }

        return templates;
    },


    [PUT_TENANT_TEMPLATE_OOZIE_REQUEST](state, action){
        let template = assign({}, action.template, {
            $meta: createMeta(PUTTING)
        });

        return assign({}, state, {
            [template.$cuid]: template
        });
    },
    [PUT_TENANT_TEMPLATE_OOZIE_SUCCESS](state, action){
        let template = assign({}, action.template, {
            $cuid: action.template.$cuid,
            $meta: createMeta(null, false)
        });

        return assign({}, state, {
            [template.$cuid]: template
        });
    },
    [PUT_TENANT_TEMPLATE_OOZIE_FAILURE](state, action){
        let template = assign({}, action.template, {
            $meta: createMeta(PUTTING, false, action.error)
        });

        return assign({}, state, {
            [template.$cuid]: template
        });
    },
    [PUT_TENANT_TEMPLATE_FLUME_REQUEST](state, action){
        let template = assign({}, action.template, {
            $meta: createMeta(PUTTING)
        });

        return assign({}, state, {
            [template.$cuid]: template
        });
    },
    [PUT_TENANT_TEMPLATE_FLUME_SUCCESS](state, action){
        let template = assign({}, action.template, {
            $cuid: action.template.$cuid,
            $meta: createMeta(null, false)
        });

        return assign({}, state, {
            [template.$cuid]: template
        });
    },
    [PUT_TENANT_TEMPLATE_FLUME_FAILURE](state, action){
        let template = assign({}, action.template, {
            $meta: createMeta(PUTTING, false, action.error)
        });

        return assign({}, state, {
            [template.$cuid]: template
        });
    }


});
export let getTemplateCuidById = templateId => templateCuidStore[templateId];
