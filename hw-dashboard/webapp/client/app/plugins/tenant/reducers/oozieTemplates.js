import handleReducer from '../helpers/handle-reducer';
import {
    cuidFor,
    createMeta,
    getTemplateCuidById
} from './templates';
import {
    GET_TENANT_TEMPLATE_OOZIE_REQUEST,
    GET_TENANT_TEMPLATE_OOZIE_SUCCESS,
    GET_TENANT_TEMPLATE_OOZIE_FAILURE,

    DELETE_TENANT_TEMPLATE_REQUEST,
    DELETE_TENANT_TEMPLATE_SUCCESS,
    DELETE_TENANT_TEMPLATE_FAILURE,

    DELETE_TENANT_TEMPLATE_OOZIE_REQUEST,
    DELETE_TENANT_TEMPLATE_OOZIE_SUCCESS,
    DELETE_TENANT_TEMPLATE_OOZIE_FAILURE,

    PUT_TENANT_TEMPLATE_OOZIE_REQUEST,
    PUT_TENANT_TEMPLATE_OOZIE_SUCCESS,
    PUT_TENANT_TEMPLATE_OOZIE_FAILURE,

    PUT_TENANT_TEMPLATE_FLUME_REQUEST,
    PUT_TENANT_TEMPLATE_FLUME_SUCCESS,
    PUT_TENANT_TEMPLATE_FLUME_FAILURE


} from '../constants/action-types';


let [DELETING, PUTTING, POSTING, GETTING] = ['DELETING', 'PUTTING', 'POSTING', 'GETTING'];
let {assign} = Object;

export default handleReducer({}, {

    [GET_TENANT_TEMPLATE_OOZIE_REQUEST](state, action){
        let $cuid = cuidFor(action.oozieTemplateId);
        let item = assign({}, state[$cuid], {
            $cuid,
            component: {id: action.oozieTemplateId},
            $meta: createMeta(GETTING)
        });
        return assign({}, state, {
            [item.$cuid]: item
        })
    },
    [GET_TENANT_TEMPLATE_OOZIE_FAILURE](state, action){
        let $cuid = cuidFor(action.oozieTemplateId);
        let item = assign({}, state[$cuid], {
            $cuid,
            component: {id: action.oozieTemplateId},
            $meta: createMeta(GETTING, false, action.error)
        });
        return assign({}, state, {
            [item.$cuid]: item
        })
    },
    [GET_TENANT_TEMPLATE_OOZIE_SUCCESS](state, action){

        let oozieTemplateItem = action.result;
        let $cuid = cuidFor(oozieTemplateItem.id);

        let newOozieTemplateItem = assign({}, state[$cuid], oozieTemplateItem, {
            $cuid,
            $meta: createMeta(null, false)
        });

        let newOozieTemplates = {};
        newOozieTemplates[newOozieTemplateItem.$cuid] = newOozieTemplateItem;

        return assign({}, state, newOozieTemplates);
    },
    /**
     * Remove template from state if it's mirror object was removed from templates
     * @param state // is data.tenant.templates[]
     * @param action // is {template:{...} } object
     */
    [DELETE_TENANT_TEMPLATE_SUCCESS](state, action){
       let oozieTemplates = assign({}, state);

        if (oozieTemplates[action.template.$cuid] !== undefined) {
            delete oozieTemplates[action.template.$cuid];
        }
       return oozieTemplates;
    },

    [DELETE_TENANT_TEMPLATE_OOZIE_REQUEST](state, action){
        let oozieTemplate = assign({}, action.oozieTemplate, {
            $meta: createMeta(DELETING)
        });

        return assign({}, state, {
            [oozieTemplate.$cuid]: oozieTemplate
        });
    },
    [DELETE_TENANT_TEMPLATE_OOZIE_FAILURE](state, action){
        let oozieTemplate = assign({}, action.oozieTemplate, {
            $meta: createMeta(DELETING, false, action.error)
        });

        return assign({}, state, {
            [oozieTemplate.$cuid]: oozieTemplate
        });
    },
    [DELETE_TENANT_TEMPLATE_OOZIE_SUCCESS](state, action){
        let oozieTemplates = assign({}, state);
        delete oozieTemplates[action.component.$cuid];

        return oozieTemplates;
    }
});
export let getOozieTemplateCuidById = getTemplateCuidById;