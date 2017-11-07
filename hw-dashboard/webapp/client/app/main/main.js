require('./ngModule');

require('./config');

require('./controllers/app');
require('./controllers/index');

//load filters
require('./filters/seconds-to-date-time');

//load directives
require('./directives/showAfterInit');
require('./directives/rpattern');
require('./directives/multiple-pattern');
require('./directives/scrollTo');
require('./directives/focusIt');
require('./directives/focus-catcher');
require('./directives/infinite-scroll');
require('./directives/ng-repeat-on-finish-render');
require('./directives/on-key-enter-callback');
require('./directives/on-key-escape-callback');
require('./directives/navigable-list');
require('./directives/autocompletable-part-of-input');
require('./directives/input-autocomplete');
require('./directives/input-autocomplete-smart');
require('./directives/unique');
require('./directives/contenteditable');
require('./directives/selectOnClick');
require('./directives/one-time-if');
require('./directives/click-outside');
require('./directives/pause-watchers');
require('./directives/drag-file-class');
require('./directives/window-resize-notifier');
require('./directives/include-replace');
require('./directives/download-file');
require('./directives/tooltip-icon');

// load module models
require('./models/User');
require('./models/Module');
require('./models/Connection');
require('./models/Node');
require('./models/ServiceDataSource');
require('./models/Platform');
require('./models/Cluster');
require('./models/Service');

require('./constants/STATES');

require('./widgets/search-component/main');
require('./widgets/search-tenant/main');
require('./widgets/alerts/main');
// not used
require('./widgets/search-provider/main');

require('./widgets/search-provision-web/main');
require('./widgets/search-cluster/main');
require('./widgets/search-hdfs-cluster/main');


//loaded but not included modules. need for isolated widgets
require('dashboard-isolated-widget-accessor');


