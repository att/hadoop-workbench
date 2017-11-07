import {
    GET_TENANT_TEMPLATES_LISTING_REQUEST,
    GET_TENANT_TEMPLATES_LISTING_SUCCESS,
    GET_TENANT_TEMPLATES_LISTING_FAILURE,

    GET_TENANT_TEMPLATES_REQUEST,
    GET_TENANT_TEMPLATES_SUCCESS,
    GET_TENANT_TEMPLATES_FAILURE,

    GET_TENANT_TEMPLATE_OOZIE_REQUEST,
    GET_TENANT_TEMPLATE_OOZIE_SUCCESS,
    GET_TENANT_TEMPLATE_OOZIE_FAILURE,

    DELETE_TENANT_TEMPLATE_OOZIE_REQUEST,
    DELETE_TENANT_TEMPLATE_OOZIE_SUCCESS,
    DELETE_TENANT_TEMPLATE_OOZIE_FAILURE,

    DELETE_TENANT_TEMPLATE_FLUME_REQUEST,
    DELETE_TENANT_TEMPLATE_FLUME_SUCCESS,
    DELETE_TENANT_TEMPLATE_FLUME_FAILURE,

    DELETE_TENANT_TEMPLATE_REQUEST,
    DELETE_TENANT_TEMPLATE_SUCCESS,
    DELETE_TENANT_TEMPLATE_FAILURE,

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

    DELETE_TENANT_FORCE_REQUEST,

    PUT_TENANT_TEMPLATE_OOZIE_REQUEST,
    PUT_TENANT_TEMPLATE_OOZIE_SUCCESS,
    PUT_TENANT_TEMPLATE_OOZIE_FAILURE,

    PUT_TENANT_TEMPLATE_FLUME_REQUEST,
    PUT_TENANT_TEMPLATE_FLUME_SUCCESS,
    PUT_TENANT_TEMPLATE_FLUME_FAILURE

} from '../constants/action-types';

angular.module('tenant').factory('tenant.redux-actions', actions);

actions.$inject = [
    'tenant.restService',
    'main.alerts.alertsManagerService',
    'oozie.restService',
    'flume.restService'
];
function actions(tenantRestService, alertsManagerService, oozieRestService, flumeRestService) {
    return {
        getComponentsListing(){
            return {
                types: [GET_TENANT_TEMPLATES_LISTING_REQUEST, GET_TENANT_TEMPLATES_LISTING_SUCCESS, GET_TENANT_TEMPLATES_LISTING_FAILURE],
                notifications: [null, null, alertsManagerService.createAlertError("Search tenant components")],
                call: () => tenantRestService.getTemplatesListing()
            }
        },
        getTemplates(tenantId){
            return {
                types: [GET_TENANT_TEMPLATES_REQUEST, GET_TENANT_TEMPLATES_SUCCESS, GET_TENANT_TEMPLATES_FAILURE],
                notifications: [],
                call: () => tenantRestService.getTemplates('v1.0', tenantId)
            }
        },
        getTemplateOozie(oozieTemplateId) {
            return {
                types: [GET_TENANT_TEMPLATE_OOZIE_REQUEST, GET_TENANT_TEMPLATE_OOZIE_SUCCESS, GET_TENANT_TEMPLATE_OOZIE_FAILURE],
                notifications: [],
                oozieTemplateId,
                call: () => tenantRestService.getOozieComponent('v1.0', oozieTemplateId).then( component => {
                        // moved into controller
                        // let fileManager = new FileManager(component.info.id, restService);
                        // fileManager.init(component.files);
                        return component;
                    }
                )
            }
        },

        deleteOozieTemplate(component = {}){
            return {
                types: [DELETE_TENANT_TEMPLATE_OOZIE_REQUEST, DELETE_TENANT_TEMPLATE_OOZIE_SUCCESS, DELETE_TENANT_TEMPLATE_OOZIE_FAILURE],
                notifications: [
                    null,
                    alertsManagerService.createAlertSuccess(
                        "Delete",
                        "Component " + (component.name || component.id) + " has been successfully deleted"),
                    alertsManagerService.createAlertError("Delete template [" + (component.name || component.id) + "] failure")],
                component,
                call: ()=> tenantRestService.deleteTemplate("v1.0", component.tenantId, component.id)
            }
        },

        deleteFlumeTemplate(flumeTemplate){
            let component = flumeTemplate.component ? flumeTemplate.component : {};
            return {
                types: [DELETE_TENANT_TEMPLATE_FLUME_REQUEST, DELETE_TENANT_TEMPLATE_FLUME_SUCCESS, DELETE_TENANT_TEMPLATE_FLUME_FAILURE],
                notifications: [
                    null,
                    alertsManagerService.createAlertSuccess(
                        "Delete",
                        "Component " + (component.name || component.id) + " has been successfully deleted"),
                    alertsManagerService.createAlertError("Delete template [" + (component.name || component.id) + "] failure")],
                flumeTemplate,
                call: ()=> tenantRestService.deleteTemplate("v1.0", component.tenantId, component.id)
            }
        },

        /**
         * Removes components template
         *
         * @param template {TemplateContainer} [required]
         *
         * @param showSuccessNotification {boolean} [optional]
         *
         * @param successCallback {function} [optional, but if provided than "failureCallback" && "finallyCallback" is required]
         * @param failureCallback {function}  [optional, but if provided than "successCallback: && "finallyCallback" is required]
         * @param finallyCallback {function} [optional, buit  if provided than "successCallback: && "failureCallback" is required]
         *
         * @returns {{types: *[], notifications: *[], template: *, call: *}}
         */
        deleteTemplate(template, showSuccessNotification, successCallback, failureCallback, finallyCallback){
            let templateInfo = template.info ? template.info : {};
            let successNotification;

            if (showSuccessNotification) {
                successNotification = alertsManagerService.createAlertSuccess(
                    "Delete",
                    "Component " + (templateInfo.name || templateInfo.id) + " has been successfully deleted");
            } else {
                successNotification = null
            }

            let callFn;
            if (successCallback && failureCallback && finallyCallback) {
                callFn = (() => {
                    return tenantRestService.deleteTemplate("v1.0", templateInfo.tenantId, templateInfo.id)
                        .then(successCallback, failureCallback)
                        .finally(finallyCallback)
                })
            } else {
                callFn = (()=> tenantRestService.deleteTemplate("v1.0", templateInfo.tenantId, templateInfo.id))
            }

            return {
                types: [DELETE_TENANT_TEMPLATE_REQUEST, DELETE_TENANT_TEMPLATE_SUCCESS, DELETE_TENANT_TEMPLATE_FAILURE],
                notifications: [null, successNotification, alertsManagerService.createAlertError("Delete template " + templateInfo.name + " failure")],
                template,
                call: callFn
            }
        },

        getTenant(tenantId){
            return {
                types: [GET_TENANT_REQUEST, GET_TENANT_SUCCESS, GET_TENANT_FAILURE],
                notifications: [],
                tenantId,
                call: ()=> tenantRestService.getTenant('v1.0', tenantId)
            };
        },
        /**
         * @param tenant
         * @returns {{types: *[], tenant: *, call: call}}
         */
        createTenant(tenant){
            return {
                types: [POST_TENANT_REQUEST, POST_TENANT_SUCCESS, POST_TENANT_FAILURE],
                notifications: [],
                tenant: tenant,
                call: ()=> tenantRestService.createTenant(tenant.name, tenant.description, tenant.version)
            }
        },

        updateTenant(tenant){
            return {
                types: [PUT_TENANT_REQUEST, PUT_TENANT_SUCCESS, PUT_TENANT_FAILURE],
                notifications: [
                    null,
                    alertsManagerService.createAlertSuccess(
                        "Tenant '" + (tenant.name || tenant.id) + "'",
                        "Tenant '" + (tenant.name || tenant.id) + "' has been successfully updated"
                    ),
                    alertsManagerService.createAlertError("Tenant " + (tenant.name || tenant.id) + " update failure")
                ],
                tenant: tenant,
                call: ()=> tenantRestService.updateTenant(tenant.id, tenant.name, tenant.description, tenant.version)
            };
        },

        updateTenantComponent(template){
            switch (template.info.type) {
                case 'oozie': {
                    return {
                        types: [PUT_TENANT_TEMPLATE_OOZIE_REQUEST, PUT_TENANT_TEMPLATE_OOZIE_SUCCESS, PUT_TENANT_TEMPLATE_OOZIE_FAILURE],
                        notifications: [
                            null,
                            alertsManagerService.createAlertSuccess(
                                "Template '" + (template.info.name || template.info.id) + "'",
                                "Template '" + (template.info.name || template.info.id) + "' has been successfully updated"
                            ),
                            alertsManagerService.createAlertError("Template " + (template.info.name || template.info.id) + " update failure")
                        ],
                        template,
                        call: ()=> oozieRestService.updateTenantComponent(template.info.id, template.info)
                    };
                }
                case 'flume': {
                    return {
                        types: [PUT_TENANT_TEMPLATE_FLUME_REQUEST, PUT_TENANT_TEMPLATE_FLUME_SUCCESS, PUT_TENANT_TEMPLATE_FLUME_FAILURE],
                        notifications: [
                            null,
                            alertsManagerService.createAlertSuccess(
                                "Template '" + (template.info.name || template.info.id) + "'",
                                "Template '" + (template.info.name || template.info.id) + "' has been successfully updated"
                            ),
                            alertsManagerService.createAlertError("Template " + (template.info.name || template.info.id) + " update failure")
                        ],
                        template,
                        call: ()=> flumeRestService.updateTenantComponent(template.info.id, template.info)
                    };
                }
            }
        },

        deleteTenant(tenant){
            return {
                types: [DELETE_TENANT_REQUEST, DELETE_TENANT_SUCCESS, DELETE_TENANT_FAILURE],
                notifications: [],
                tenant,
                call: ()=> tenantRestService.deleteTenantContainer("v1.0", tenant.id)
            }
        },
        deleteTenantForce(tenant){
            return {
                types: [DELETE_TENANT_FORCE_REQUEST, DELETE_TENANT_SUCCESS, DELETE_TENANT_FAILURE],
                notifications: [],
                tenant,
                call: ()=> tenantRestService.deleteTenantContainerForce("v1.0", tenant.id)
            }
        }

    }
}
