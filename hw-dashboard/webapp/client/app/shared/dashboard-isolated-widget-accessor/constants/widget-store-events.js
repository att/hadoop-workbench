define(function (require) {
    "use strict";

    require('../ngModule').constant('dashboard-isolated-widget-accessor.widget-store-events', {
        'SIZE_CHANGED': 'size-changed',
        'STATUS_BAR_CHANGED': 'status-bar-text-updated',
        'PROGRESS_BAR_CHANGED': 'progress-bar-text-updated',
        'STATUS_BAR_TABS_CHANGED': 'status-bar-tabs-updated',
        'HOTKEY_BINDINGS_CHANGED': 'hotkey-bindings-updated',
        'EXTERNAL_ACTIONS_CHANGED': 'external-actions-updated',
        'STATE_CHANGED': 'widget-state-changed'
    });
});
