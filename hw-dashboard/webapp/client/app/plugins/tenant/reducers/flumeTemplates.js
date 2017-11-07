import handleReducer from '../helpers/handle-reducer';
import {
    cuidFor,
    createMeta,
    getTemplateCuidById
} from './templates';
import {

    DELETE_TENANT_TEMPLATE_REQUEST,
    DELETE_TENANT_TEMPLATE_SUCCESS,
    DELETE_TENANT_TEMPLATE_FAILURE,

    DELETE_TENANT_TEMPLATE_FLUME_REQUEST,
    DELETE_TENANT_TEMPLATE_FLUME_SUCCESS,
    DELETE_TENANT_TEMPLATE_FLUME_FAILURE,

} from '../constants/action-types';


let [DELETING, PUTTING, POSTING, GETTING] = ['DELETING', 'PUTTING', 'POSTING', 'GETTING'];
let {assign} = Object;

export default handleReducer({}, {

    /**
     * Remove template from state if it's mirror object was removed from templates
     * @param state // is data.tenant.templates[]
     * @param action // is {template:{...} } object
     */
    [DELETE_TENANT_TEMPLATE_SUCCESS](state, action){
       let flumeTemplates = assign({}, state);

        if (flumeTemplates[action.template.$cuid] !== undefined) {
            delete flumeTemplates[action.template.$cuid];
        }
       return flumeTemplates;
    },

    [DELETE_TENANT_TEMPLATE_FLUME_REQUEST](state, action){
        let flumeTemplate = assign({}, action.flumeTemplate, {
            $meta: createMeta(DELETING)
        });

        return assign({}, state, {
            [flumeTemplate.$cuid]: flumeTemplate
        });
    },
    [DELETE_TENANT_TEMPLATE_FLUME_FAILURE](state, action){
        let flumeTemplate = assign({}, action.flumeTemplate, {
            $meta: createMeta(DELETING, false, action.error)
        });

        return assign({}, state, {
            [flumeTemplate.$cuid]: flumeTemplate
        });
    },
    [DELETE_TENANT_TEMPLATE_FLUME_SUCCESS](state, action){
        let flumeTemplates = assign({}, state);
        delete flumeTemplates[action.flumeTemplate.$cuid];

        return flumeTemplates;
    }
});
export let getFlumeTemplateCuidById = getTemplateCuidById;