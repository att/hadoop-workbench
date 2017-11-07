import {CLOSE_MENU, SELECT_MENU_ITEM, SET_MENU_SEARCH_QUERY} from '../constants/action-types';
import { GET_TENANT_TEMPLATES_LISTING_REQUEST, GET_TENANT_TEMPLATES_LISTING_SUCCESS, GET_TENANT_TEMPLATES_LISTING_FAILURE } from '../../plugins/tenant/constants/action-types';
import { GET_PLATFORM_MODULES_LISTING_REQUEST, GET_PLATFORM_MODULES_LISTING_SUCCESS, GET_PLATFORM_MODULES_LISTING_FAILURE } from '../../plugins/platform/constants/action-types';
import { GET_PLATFORM_PROVIDERS_LISTING_REQUEST, GET_PLATFORM_PROVIDERS_LISTING_SUCCESS, GET_PLATFORM_PROVIDERS_LISTING_FAILURE } from '../../plugins/provision/constants/action-types';
var Immutable = require("immutable");

let {assign} = Object;

const COMPONENT = {
    id: 'COMPONENT',
    title: 'Component',
    icon: 'dap-navigation-list-item-component',
    dapWidget: 'search-component'
};
const TENANT = {
    id: 'TENANT',
    title: 'Tenant',
    icon: 'dap-navigation-list-item-tenant',
    dapWidget: 'search-tenant'
};
const SCALEOUT = {
    id: 'SCALEOUT',
    title: 'Scaleout',
    icon: 'dap-navigation-list-item-scaleout',
    dapWidget: 'scaleout'
};
const PROVISION = {
    id: 'PROVISION',
    title: 'Provision',
    icon: 'dap-navigation-list-item-provision',
    dapWidget: 'search-provider'
};
const PROVISION_WEB = {
    id: 'PROVISION_WEB',
    title: 'Provision',
    icon: 'dap-navigation-list-item-provision',
    dapWidget: 'search-provision-web'
};
const HDFS = {
    id: 'HDFS',
    title: 'HDFS',
    icon: 'dap-navigation-list-item-hdfs',
    dapWidget: 'search-hdfs-cluster'
};
const CLUSTERS = {
    id: 'CLUSTERS',
    title: 'Clusters',
    icon: 'dap-navigation-list-item-cluster',
    dapWidget: 'search-cluster'
};
const DEPLOYMENT = {
    id: 'DEPLOYMENT',
    title: 'Deployment',
    icon: 'dap-navigation-list-item-deployment',
    action: 'addWidget',
    dapWidget: 'deployment-manager'
};

var searchStatus = Immutable.fromJS({
    requesting: {
        component: {tenants: false, platforms: false},
        tenant: false,
        hdf: false,
        cluster: false
    }
});

const initialState = {
    items: [COMPONENT, TENANT, /*SCALEOUT, *//*PROVISION, */PROVISION_WEB, HDFS, CLUSTERS, DEPLOYMENT],
    // items: [COMPONENT, TENANT, /*SCALEOUT, *//*PROVISION, */PROVISION_WEB, HDFS, CLUSTERS, DEPLOYMENT],
    selectedItem: null,
    searchQuery: '',
    searchStatus: searchStatus
};

export default function widgets(state = initialState, action) {
    switch (action.type) {
        case CLOSE_MENU:
            return assign({}, state, {
                selectedItem: null
            });
        case SELECT_MENU_ITEM:
            return assign({}, state, {
                selectedItem: state.items.indexOf(action.item) > -1 ? action.item : null
            });
        case SET_MENU_SEARCH_QUERY:
            return assign({}, state, {
                searchQuery: action.searchQuery
            });
        case GET_TENANT_TEMPLATES_LISTING_REQUEST:
            return assign({}, state, {
                searchStatus: state.searchStatus.updateIn(['requesting', 'component', 'tenants'], () => true)
            });
        case GET_PLATFORM_MODULES_LISTING_REQUEST:
            return assign({}, state, {
                searchStatus: state.searchStatus.updateIn(['requesting', 'component', 'platforms'], () => true)
            });
        case GET_PLATFORM_PROVIDERS_LISTING_REQUEST:
            return assign({}, state, {
                searchStatus: state.searchStatus.updateIn(['requesting', 'component', 'provision'], () => true)
            });
        case GET_TENANT_TEMPLATES_LISTING_SUCCESS:
        case GET_TENANT_TEMPLATES_LISTING_FAILURE:
            return assign({}, state, {
                searchStatus: state.searchStatus.updateIn(['requesting', 'component', 'tenants'], () => false)
            });
        case GET_PLATFORM_MODULES_LISTING_SUCCESS:
        case GET_PLATFORM_MODULES_LISTING_FAILURE:
            return assign({}, state, {
                searchStatus: state.searchStatus.updateIn(['requesting', 'component', 'platforms'], () => false)
            });
        case GET_PLATFORM_PROVIDERS_LISTING_SUCCESS:
        case GET_PLATFORM_PROVIDERS_LISTING_FAILURE:
            return assign({}, state, {
                searchStatus: state.searchStatus.updateIn(['requesting', 'component', 'provision'], () => false)
            });
        default:
            return state;
    }
}
