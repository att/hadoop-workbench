import {
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
    DELETE_PLATFORM_PROVISION_FAILURE,

    GET_PLATFORM_PROVISION_WEB_LISTING_REQUEST,
    GET_PLATFORM_PROVISION_WEB_LISTING_SUCCESS,
    GET_PLATFORM_PROVISION_WEB_LISTING_FAILURE,

} from '../constants/action-types';

const initialState = {
    isUpdating: false,
    isUpdatingProvisionWeb: false,
    isMetadataUpdating: false,
    providers: [],
    provisionWebs: []
};

let {assign} = Object;

export default function provision(state = initialState, action) {
    switch (action.type) {
        case GET_PLATFORM_PROVIDERS_LISTING_REQUEST:
            return assign({}, state, {
                isUpdating: true
            });
        case GET_PLATFORM_PROVIDERS_LISTING_SUCCESS:
            return assign({},
                state,
                action.result.providers.reduce(
                    (host, item) => {
                        host.providers.push(item);
                        return host
                    },
                    {isUpdating: false, providers: []}
                )
            );
        case GET_PLATFORM_PROVIDERS_LISTING_FAILURE:
            return assign({}, state, {
                isUpdating: false
            });

        case GET_PLATFORM_PROVIDERS_METADATA_REQUEST:
            return assign({}, state, {
                isMetadataUpdating: true
            });
        case GET_PLATFORM_PROVIDERS_METADATA_SUCCESS:
            // @TODO: implement reducers
            return assign({}, state, {
                isMetadataUpdating: false
            });
        case GET_PLATFORM_PROVIDERS_METADATA_FAILURE:
            return state;

        case POST_PLATFORM_PROVISION_REQUEST:
            return assign({}, state, {
                isUpdating: true
            });
        case POST_PLATFORM_PROVISION_SUCCESS:
            return assign({}, state, {
                isUpdating: false
            });
        case POST_PLATFORM_PROVISION_FAILURE:
            return state;

        case DELETE_PLATFORM_PROVISION_REQUEST:
            return assign({}, state, {
                isUpdating: true
            });
        case DELETE_PLATFORM_PROVISION_SUCCESS:
            return assign({}, state, {
                isUpdating: false
            });
        case DELETE_PLATFORM_PROVISION_FAILURE:
            return assign({}, state, {
                isUpdating: false
            });

        case GET_PLATFORM_PROVISION_WEB_LISTING_REQUEST:
            return assign({}, state, {
                isUpdatingProvisionWeb: true
            });
        case GET_PLATFORM_PROVISION_WEB_LISTING_SUCCESS:
            return assign({},
                state,
                action.result.reduce(
                    (host, item) => {
                        host.provisionWebs.push(item);
                        return host
                    },
                    {isUpdatingProvisionWeb: false, provisionWebs: []}
                )
            );
        case GET_PLATFORM_PROVISION_WEB_LISTING_FAILURE:
            return assign({}, state, {
                isUpdatingProvisionWeb: false
            });

        default:
            return state;
    }
}
