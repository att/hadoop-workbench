import {
    GET_PLATFORM_PROVISION_WEB_LISTING_REQUEST,
    GET_PLATFORM_PROVISION_WEB_LISTING_SUCCESS,
    GET_PLATFORM_PROVISION_WEB_LISTING_FAILURE,

    GET_PLATFORM_PROVIDERS_LISTING_REQUEST,
    GET_PLATFORM_PROVIDERS_LISTING_SUCCESS,
    GET_PLATFORM_PROVIDERS_LISTING_FAILURE,

    GET_PLATFORM_PROVIDERS_METADATA_REQUEST,
    GET_PLATFORM_PROVIDERS_METADATA_SUCCESS,
    GET_PLATFORM_PROVIDERS_METADATA_FAILURE,

    POST_PLATFORM_PROVISION_REQUEST,
    POST_PLATFORM_PROVISION_SUCCESS,
    POST_PLATFORM_PROVISION_FAILURE,

    DELETE_PLATFORM_PROVISION_REQUEST,
    DELETE_PLATFORM_PROVISION_SUCCESS,
    DELETE_PLATFORM_PROVISION_FAILURE

} from '../constants/action-types';

angular.module('provision').factory('provision.redux-actions', actions);

actions.$inject = ['provision.restService', 'main.alerts.alertsManagerService'];
function actions(restService, alertsManagerService) {
    return {
        getPlatformProvisionWebListing() {
            return {
                types: [GET_PLATFORM_PROVISION_WEB_LISTING_REQUEST, GET_PLATFORM_PROVISION_WEB_LISTING_SUCCESS, GET_PLATFORM_PROVISION_WEB_LISTING_FAILURE],
                notifications: [null, null, alertsManagerService.createAlertError('Error: Search platform provision providers')],
                call: () => restService.getPlatformProvisionWebs()
            }
        },
        getPlatformProviderListing() {
            return {
                types: [GET_PLATFORM_PROVIDERS_LISTING_REQUEST, GET_PLATFORM_PROVIDERS_LISTING_SUCCESS, GET_PLATFORM_PROVIDERS_LISTING_FAILURE],
                notifications: [null, null, alertsManagerService.createAlertError('Error: Search platform providers')],
                call: () => restService.getPlatformProviders()
            }
        },
        getPlatformProviderMetadata(providerId, distributionId, version) {
            return {
                types: [GET_PLATFORM_PROVIDERS_METADATA_REQUEST, GET_PLATFORM_PROVIDERS_METADATA_SUCCESS, GET_PLATFORM_PROVIDERS_METADATA_FAILURE],
                notifications: [],
                provider: {
                    providerId,
                    distributionId,
                    version
                },
                call: () => restService.getPlatformProviderMetadata(providerId, distributionId, version)
            }
        },
        postPlatformProvision(providerId, distributionId, version) {
            return {
                types: [POST_PLATFORM_PROVISION_REQUEST, POST_PLATFORM_PROVISION_SUCCESS, POST_PLATFORM_PROVISION_FAILURE],
                notifications: [],
                provider: {
                    providerId,
                    distributionId,
                    version
                },
                call: () => restService.provisionPlatform(providerId, distributionId, version)
            }
        },
        destroyPlatform(installationId) {
            return {
                types: [DELETE_PLATFORM_PROVISION_REQUEST, DELETE_PLATFORM_PROVISION_SUCCESS, DELETE_PLATFORM_PROVISION_FAILURE],
                notifications: [
                    null,
                    alertsManagerService.createAlertSuccess("Destroy platform", "Platform destroy operation started successfully"),
                    alertsManagerService.createAlertError("Platform destroy failed", "Unknown Error")],
                installationId,
                call: () => restService.silent().destroyPlatform(installationId)
            }
        }
    }
}
