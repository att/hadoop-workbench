define(function (require) {
    "use strict";

    require('../ngModule').constant('dashboard-isolated-widget-accessor.actions', {
        'SET_WIDGET': 'dashboard-isolated-widget-accessor.setWidget',
        'CLOSE': 'dashboard-isolated-widget-accessor.closeWidget',
        'SET_ERROR_MSG': 'dashboard-isolated-widget-accessor.setErrorMessage',
        'SET_STATUS_BAR_MSG': 'dashboard-isolated-widget-accessor.setStatusBarMessage',
        'SET_PROGRESS_BAR_MSG': 'dashboard-isolated-widget-accessor.setProgressBarMessage',
        'SET_STATUS_BAR_TABS': 'dashboard-isolated-widget-accessor.setStatusBarTabs',
        'SET_HOTKEY_BINDINGS': 'dashboard-isolated-widget-accessor.setHotkeyBindings',
        'SET_EXTERNAL_ACTIONS': 'dashboard-isolated-widget-accessor.setExternalActions',
        'SIZE_CHANGED': 'dashboard-isolated-widget-accessor.sizeChanged'
    });
});
