import {
    GET_OOZIE_TEMPLATES_REQUEST,
    GET_OOZIE_TEMPLATES_SUCCESS,
    GET_OOZIE_TEMPLATES_FAILURE,

    POST_OOZIE_TEMPLATE_REQUEST,
    POST_OOZIE_TEMPLATE_SUCCESS,
    POST_OOZIE_TEMPLATE_FAILURE,

    GET_OOZIE_COMPONENT_REQUEST,
    GET_OOZIE_COMPONENT_SUCCESS,
    GET_OOZIE_COMPONENT_FAILURE,

    GET_OOZIE_COMPONENT_FILES_REQUEST,
    GET_OOZIE_COMPONENT_FILES_SUCCESS,
    GET_OOZIE_COMPONENT_FILES_FAILURE,

    GET_OOZIE_DEPLOYED_COMPONENTS_REQUEST,
    GET_OOZIE_DEPLOYED_COMPONENTS_SUCCESS,
    GET_OOZIE_DEPLOYED_COMPONENTS_FAILURE,

} from '../constants/action-types';

angular.module('oozie').factory('oozie.redux-actions', actions);

actions.$inject = ['oozie.restService'];
function actions(restService) {
    return {
        getTemplates(version){
            return {
                types: [GET_OOZIE_TEMPLATES_REQUEST, GET_OOZIE_TEMPLATES_SUCCESS, GET_OOZIE_TEMPLATES_FAILURE],
                notifications: [],
                call: () => restService.getTemplates(version)
            }
        },
        createTemplate(data){
            return {
                types: [POST_OOZIE_TEMPLATE_REQUEST, POST_OOZIE_TEMPLATE_SUCCESS, POST_OOZIE_TEMPLATE_FAILURE],
                notifications: [],
                data,
                call: () => restService.getTemplates(data).then(id => restService.getTenantComponent('v1.0', id))
            }
        },

        getDeployedComponents(source) {
            return {
                types: [GET_OOZIE_DEPLOYED_COMPONENTS_REQUEST, GET_OOZIE_DEPLOYED_COMPONENTS_SUCCESS, GET_OOZIE_DEPLOYED_COMPONENTS_FAILURE],
                idObject: {
                    platformId: source.platform.id,
                    clusterId: source.cluster.id,
                },
                notifications: [],
                call: () => restService.getDeployedComponents(source).then( component => {
                    return component;
                })
            }
        },

        loadOozieModule(source) {
            return {
                types: [GET_OOZIE_COMPONENT_REQUEST, GET_OOZIE_COMPONENT_SUCCESS, GET_OOZIE_COMPONENT_FAILURE],
                notifications: [],
                source,
                idObject: {
                    platformId: source.platform.id,
                    clusterId: source.cluster.id,
                    componentId: source.module.id
                },
                call: () => restService.loadOozieModule('v1.0', source).finally( component => {
                        return component;
                    }
                )
            }
        },

        loadOozieModuleFiles(source) {
            return {
                types: [GET_OOZIE_COMPONENT_FILES_REQUEST, GET_OOZIE_COMPONENT_FILES_SUCCESS, GET_OOZIE_COMPONENT_FILES_FAILURE],
                notifications: [],
                source,
                idObject: {
                    platformId: source.platform.id,
                    clusterId: source.cluster.id,
                    componentId: source.module.id
                },
                call: () => restService.loadOozieModuleFiles('v1.0', source).then( componentFiles => {
                        return componentFiles;
                    }
                )
            }
        },
    }
}
