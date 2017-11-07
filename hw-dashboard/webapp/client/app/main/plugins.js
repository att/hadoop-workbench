import { combineReducers } from 'redux';
import tenant from '../plugins/tenant/plugin';
import oozie from '../plugins/oozie/plugin';
import deployment from '../plugins/deployment/plugin';
import platform from '../plugins/platform/plugin';
import provision from '../plugins/provision/plugin';
import alerts from './widgets/alerts/reducers/data';

let dataReducers = {
    [tenant.name]: tenant.dataReducer,
    [oozie.name]: oozie.dataReducer,
    [deployment.name]: deployment.dataReducer,
    [platform.name]: platform.dataReducer,
    [provision.name]: provision.dataReducer,
    [alerts.name]: alerts.dataReducer
};
export default {
    dataReducers: dataReducers
}
