import cuid from 'cuid';
import {

    GET_OOZIE_TEMPLATES_REQUEST,
    GET_OOZIE_TEMPLATES_SUCCESS,
    GET_OOZIE_TEMPLATES_FAILURE,

    GET_OOZIE_COMPONENT_REQUEST,
    GET_OOZIE_COMPONENT_SUCCESS,
    GET_OOZIE_COMPONENT_FAILURE,

    GET_OOZIE_COMPONENT_FILES_REQUEST,
    GET_OOZIE_COMPONENT_FILES_SUCCESS,
    GET_OOZIE_COMPONENT_FILES_FAILURE,

    POST_OOZIE_TEMPLATE_REQUEST,
    POST_OOZIE_TEMPLATE_SUCCESS,
    POST_OOZIE_TEMPLATE_FAILURE
} from '../constants/action-types';

import {oozieComponentFilesWrapperRelease} from "../models/rest-helper";

import handleReducer from '../../../main/helpers/handle-reducer';

const initialState = {
    components: {},
    templates: {},
    busyCounter: 0,
    lastFailedPostTemplate: null,
    lastPostedTemplate: null
};

let [DELETING, PUTTING, POSTING, GETTING, LOADED] = ['DELETING', 'PUTTING', 'POSTING', 'GETTING', 'LOADED'];
let {assign} = Object;
let componentCuidStore = {};

let getComponentCompositeId = (idObject) => 'p' + idObject.platformId + '-c' + idObject.clusterId + '-' + idObject.componentId;

export let cuidFor = (idObject) => {
    let { componentId } = idObject;
    let compositeId = getComponentCompositeId(idObject);
    if (!componentId) {
        return cuid();
    } else if (!componentCuidStore[compositeId]) {
        componentCuidStore[compositeId] = cuid();
    }
    return componentCuidStore[compositeId];
};

export let createMeta = (status, busy = true, error = null, errorType = null) => ({
    isDeleting: status === DELETING,
    isGetting: status === GETTING,
    isPosting: status === POSTING,
    isPutting: status === PUTTING,
    isLoaded: status === LOADED,
    busy,
    error,
    errorType
});

/**
 *               idObject = {
 *                   platformId: source.platform.id,
 *                   clusterId: source.cluster.id,
 *                   componentId: source.module.id
 *               },
 *
 * @param idObject
 */

let increaseBusyCounter = state => state.busyCounter + 1;
let decreaseBusyCounter = state => state.busyCounter > 0 ? state.busyCounter - 1 : 0;

export default handleReducer(initialState, {

        [GET_OOZIE_COMPONENT_REQUEST] (state, action) {
            let $cuid = cuidFor(action.idObject);

            let item = assign({}, state.components[$cuid], {
                $cuid,
                idObject: action.idObject,
                component: {
                    compositeId: getComponentCompositeId(action.idObject),
                    idObject: action.idObject
                },
                $meta: createMeta(GETTING)
            });
            return assign({}, state, {
                components: assign({}, state.components, { [$cuid]: item })
            });
        },

        [GET_OOZIE_COMPONENT_FAILURE] (state, action) {
            let $cuid = cuidFor(action.idObject);
            let item = assign({}, state.components[$cuid], {
                $cuid,
                idObject: action.idObject,
                component: {
                    compositeId: getComponentCompositeId(action.idObject),
                    idObject: action.idObject
                },
                $meta: createMeta(GETTING, false, action.error)
            });

            return assign({}, state, {
                components: assign({}, state.components, {[$cuid]: item})
            });
        },
        [GET_OOZIE_COMPONENT_SUCCESS] (state, action) {

            let oozieComponent = action.result;
            let $cuid = cuidFor(action.idObject);

            let newOozieComponentItem = assign({}, state.components[$cuid], oozieComponent, {
                $cuid,
                idObject: action.idObject,
                $meta: createMeta(LOADED, false)
            });

            return assign({}, state, {
                components: assign({}, state.components, {[newOozieComponentItem.$cuid]: newOozieComponentItem})
            });
        },

        // [GET_OOZIE_COMPONENT_FILES_REQUEST] (state, action) {
        //     return state;
        // },

        // [GET_OOZIE_COMPONENT_FILES_FAILURE] (state, action) {
        //     return state;
        // },

        [GET_OOZIE_COMPONENT_FILES_SUCCESS] (state, action) {

            let oozieComponentFiles = action.result;
            let $cuid = cuidFor(action.idObject);

            let newOozieComponentItem = assign({}, state.components[$cuid], oozieComponentFilesWrapperRelease({files: oozieComponentFiles}), {
                $cuid,
                idObject: action.idObject
            });

            return assign({}, state, {
                components: assign({}, state.components, {[newOozieComponentItem.$cuid]: newOozieComponentItem})
            });
        },

        [GET_OOZIE_TEMPLATES_REQUEST] (state, action) {
            return assign({}, state, {
                busyCounter: increaseBusyCounter(state)
            });
        },
        [GET_OOZIE_TEMPLATES_FAILURE] (state, action) {
            return assign({}, state, {
                busyCounter: decreaseBusyCounter(state)
            });
        },
        [GET_OOZIE_TEMPLATES_SUCCESS] (state, action) {
            let templates = action.result.reduce((host, template)=> {
                host[template.info.id] = template;
                return host;
            }, {});
            return assign({}, state, {
                templates: assign({}, state.templates, templates),
                busyCounter: decreaseBusyCounter(state)
            });
        },

        [POST_OOZIE_TEMPLATE_REQUEST] (state, action) {
            return assign({}, state, {
                busyCounter: increaseBusyCounter(state)
            });
        },
        [POST_OOZIE_TEMPLATE_FAILURE] (state, action) {
            return assign({}, state, {
                lastFailedPostTemplate: action.data,
                busyCounter: decreaseBusyCounter(state)
            });
        },
        [POST_OOZIE_TEMPLATE_SUCCESS] (state, action) {
            return assign({}, state, {
                lastPostedTemplate: action.result,
                templates: assign({}, state.templates, {
                        [action.result.info.id]: action.result
                    }
                ),
                busyCounter: decreaseBusyCounter(state)
            });
        }
});
export let getComponentCuidByIdObject = (idObject) => componentCuidStore[getComponentCompositeId(idObject)];
