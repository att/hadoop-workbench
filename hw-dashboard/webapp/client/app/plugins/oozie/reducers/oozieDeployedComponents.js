import cuid from 'cuid';
import {

    GET_OOZIE_DEPLOYED_COMPONENTS_REQUEST,
    GET_OOZIE_DEPLOYED_COMPONENTS_SUCCESS,
    GET_OOZIE_DEPLOYED_COMPONENTS_FAILURE,

} from '../constants/action-types';

import handleReducer from '../../../main/helpers/handle-reducer';

const initialState = {
    componentClusters: {},
    busyCounter: 0,
    lastPostedTemplate: null
};

let [DELETING, PUTTING, POSTING, GETTING, LOADED] = ['DELETING', 'PUTTING', 'POSTING', 'GETTING', 'LOADED'];
let {assign} = Object;
let componentClusterCuidStore = {};
// let componentCuidStore = {};

let getCompositeId = ({platformId = '', clusterId = '', componentId = ''}) => 'p' + platformId + '-c' + clusterId + '-' + componentId;

export let cuidFor = (idObject) => {
    let { clusterId } = idObject;
    let compositeId = getCompositeId(idObject);
    if (clusterId === undefined) {
        return cuid();
    } else if (!componentClusterCuidStore[compositeId]) {
        componentClusterCuidStore[compositeId] = cuid();
    }
    return componentClusterCuidStore[compositeId];
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

        [GET_OOZIE_DEPLOYED_COMPONENTS_REQUEST] (state, action) {
            let $cuid = cuidFor(action.idObject);

            let item = assign({}, state.componentClusters[$cuid], {
                $cuid,
                idObject: action.idObject,
                componentCluster: {
                    compositeId: getCompositeId(action.idObject),
                    idObject: action.idObject
                },
                $meta: createMeta(GETTING)
            });
            return assign({}, state, {
                componentClusters: assign({}, state.componentClusters, { [$cuid]: item })
            });
        },

        [GET_OOZIE_DEPLOYED_COMPONENTS_FAILURE] (state, action) {
            let $cuid = cuidFor(action.idObject);
            let item = assign({}, state.componentClusters[$cuid], {
                $cuid,
                idObject: action.idObject,
                componentCluster: {
                    compositeId: getCompositeId(action.idObject),
                    idObject: action.idObject
                },
                $meta: createMeta(GETTING, false, action.error)
            });

            return assign({}, state, {
                componentClusters: assign({}, state.componentClusters, {[$cuid]: item})
            });
        },
        [GET_OOZIE_DEPLOYED_COMPONENTS_SUCCESS] (state, action) {
            let oozieComponentCluster = action.result;
            let $cuid = cuidFor(action.idObject);

            let newOozieComponentClusterItem = assign({}, state.componentClusters[$cuid], oozieComponentCluster, {
                $cuid,
                idObject: action.idObject,
                $meta: createMeta(LOADED, false)
            });

            return assign({}, state, {
                componentClusters: assign({}, state.componentClusters, {[newOozieComponentClusterItem.$cuid]: newOozieComponentClusterItem})
            });
        },

});
// export let getDeployedComponentCuidByIdObject = (idObject) => componentCuidStore[getComponentCompositeId(idObject)];
let getDeployedComponentClusterCuidByIdObject = (idObject) => componentClusterCuidStore[getCompositeId(idObject)];
export {getCompositeId, getDeployedComponentClusterCuidByIdObject};
