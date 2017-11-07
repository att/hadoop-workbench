var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var Clean = require('clean-webpack-plugin');

module.exports = {
    context: path.join(__dirname, './client'),
    entry: {
        'index': './app/entry'
    },
    output: {
        path: path.join(__dirname, '../target/webapp/dashboard'),
        publicPath: '',
        filename: 'js/[name].js'
    },
    plugins: [
        new Clean('../target/webapp/dashboard'),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, './client/index.tpl.html'),
            inject: 'body',
            filename: './index.html'
        }),
        // This replaces shim stuff in RequireJS.
        new webpack.ProvidePlugin({
            _: "lodash",
            jQuery: "jquery"
        })
    ],
    module: {
        loaders: [
            {
                test: /\.less$/,
                loader: 'style-loader!css-loader!less-loader'
            }, // use ! to chain loaders
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader'
            },
            {
                test: /\.js$/,
                loaders: ['babel'],
                exclude: /node_modules|bower_components/,
                include: [
                    path.resolve(__dirname, './client/app'),
                    path.resolve(__dirname, './client/vendors')
                ]
            },
            {
                test: /\.html$/,
                loader: 'html'
            },
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                loaders: [
                    'url-loader?limit=8192&hash=sha512&digest=hex&name=resources/img/[hash].[ext]',
                    'image-webpack?bypassOnDebug&optimizationLevel=7&git=false'
                ]
            }
        ],
        module: {
            noParse: ['ws', 'bindings'],
        },
        externals: ['ws', 'bindings']
    },
    resolve: {
        root: [
            path.join(__dirname, './client')
        ],
        extensions: ['', '.js'],
        alias: {
            'ngSanitize': 'angular-sanitize',
            setImmediate: "app/shared/utils/setImmediate",
            'angularResource': 'angular-resource',
            codemirrorWrapper: 'vendors/codemirrorWrapper',
            angularWidget: 'vendors/angular-widget',
            flux: 'vendors/angular-flux',
            'angular-inview': 'vendors/angular-inview',
            angularWebsocket: 'vendors/angular-websocket',

            "jqueryUi": "jquery-ui",
            // warning 1 !!! bower package jquery.caret is totally different, use npm package!!!!
            // warning 2 !!! npm package is outdated, using "github.com/ichord/Caret.js" version 0.3.1
            jqueryCaret: 'vendors/jquery.caret.js',
            'object-deep-diff': 'vendors/object-deep-diff.js',

            'dap.core': path.join(__dirname, "./client/app/core/main.js"),
            'dap.shared.validation': path.join(__dirname, "./client/app/shared/validation/main.js"),
            'dap.shared.jsPlumb/ngModule': path.join(__dirname, "./client/app/shared/jsPlumb/ngModule.js"),
            'dap.shared.jsPlumb': path.join(__dirname, "./client/app/shared/jsPlumb/main.js"),
            'dap.shared.templateCache': path.join(__dirname, "./client/app/shared/templateCache/main.js"),
            'mocks': path.join(__dirname, "./client/app/shared/mocks/main.js"),
            'dap.shared.accordionWidget': path.join(__dirname, "./client/app/shared/accordion-widget/main.js"),
            'dap.shared.dropdownWidget': path.join(__dirname, "./client/app/shared/dropdown-widget/main.js"),
            'shared.widgets': path.join(__dirname, "./client/app/shared/widgets/main.js"),
            'dap.shared.widget': path.join(__dirname, "./client/app/shared/dap-widget/main.js"),
            'dap.shared.tabsetWidget': path.join(__dirname, "./client/app/shared/tabset-widget/main.js"),
            'dap.shared.resizable': path.join(__dirname, "./client/app/shared/resizable/main.js"),
            'shared.strategies': path.join(__dirname, "./client/app/shared/strategies/main.js"),
            'shared.view-models': path.join(__dirname, "./client/app/shared/view-models/main.js"),
            'shared.assistants': path.join(__dirname, "./client/app/shared/assistants/main.js"),
            'shared.layouts': path.join(__dirname, "./client/app/shared/layouts/main.js"),
            'component': path.join(__dirname, "./client/app/shared/component/main.js"),
            'shared.components': path.join(__dirname, "./client/app/shared/components/main.js"),
            'dashboard-isolated-widget-accessor': path.join(__dirname, "./client/app/shared/dashboard-isolated-widget-accessor/main.js"),
            'dap.main': path.join(__dirname, "./client/app/main/main.js"),
            'dashboard': path.join(__dirname, './client/app/dashboard/main.js'),
            'auth': path.join(__dirname, './client/app/auth/main.js'),
            'userSettings': path.join(__dirname, './client/app/user-settings/main.js'),
            'uiSettings': path.join(__dirname, './client/app/ui-settings/main.js'),
            'flume/ngModule': path.join(__dirname, './client/app/plugins/flume/ngModule.js'),
            'flume': path.join(__dirname, './client/app/plugins/flume/main.js'),
            'oozie/ngModule': path.join(__dirname, './client/app/plugins/oozie/ngModule.js'),
            'oozie': path.join(__dirname, './client/app/plugins/oozie/main.js'),
            'addService': path.join(__dirname, './client/app/plugins/addService/main.js'),
            'tenant': path.join(__dirname, './client/app/plugins/tenant/main.js'),
            'editor': path.join(__dirname, './client/app/plugins/editor/main.js'),
            'scaleout': path.join(__dirname, './client/app/plugins/scaleout/main.js'),
            'platform': path.join(__dirname, './client/app/plugins/platform/main.js'),
            'kafka': path.join(__dirname, './client/app/plugins/kafka/main.js'),
            'provision': path.join(__dirname, './client/app/plugins/provision/main.js'),
            'hdfs': path.join(__dirname, './client/app/plugins/hdfs/main.js'),
            'configuration': path.join(__dirname, './client/app/plugins/configuration/main.js'),
            'contributors': path.join(__dirname, './client/app/plugins/contributors/main.js'),
            'deployment': path.join(__dirname, './client/app/plugins/deployment/main.js'),
            'plugins': path.join(__dirname, './client/app/plugins.js'),
            'shared': path.join(__dirname, './client/app/shared/'),


            jsPlumb: path.join(__dirname, './client/vendors/jsplumb-wrapper.js'),
            'cfpHotkeys': path.join(__dirname, "./bower_components/angular-hotkeys/build/hotkeys.js"),
            ngMockE2E: path.join(__dirname, './bower_components/angular-mocks/angular-mocks.js'),
            jsZip: path.join(__dirname, './bower_components/jszip/jszip.js'),
            ngTreeControl: path.join(__dirname, './bower_components/angular-tree-control/angular-tree-control.js'),
            angularFileUpload: path.join(__dirname, './bower_components/angular-file-upload/dist/angular-file-upload.min.js'),
            "ui.sortable": path.join(__dirname, './bower_components/angular-ui-sortable/sortable.js'),
            uiCodemirror: path.join(__dirname, './bower_components/angular-ui-codemirror/ui-codemirror.js'),
            "../../lib/codemirror": path.join(__dirname, './bower_components/codemirror/lib/codemirror.js'),
            codemirrorSqlMode: path.join(__dirname, './bower_components/codemirror/mode/sql/sql.js'),
            codemirrorXmlMode: path.join(__dirname, './bower_components/codemirror/mode/xml/xml.js'),
            codemirrorPigMode: path.join(__dirname, './bower_components/codemirror/mode/pig/pig.js'),
            codemirrorShellMode: path.join(__dirname, './bower_components/codemirror/mode/shell/shell.js'),
            codemirrorPythonMode: path.join(__dirname, './bower_components/codemirror/mode/python/python.js'),
            codemirrorPropertiesMode: path.join(__dirname, './bower_components/codemirror/mode/properties/properties.js'),
            codemirrorAddonSearch: path.join(__dirname, './bower_components/codemirror/addon/search/search.js'),
            codemirrorAddonDialog: path.join(__dirname, './bower_components/codemirror/addon/dialog/dialog.js'),
            ngContextMenu: path.join(__dirname, './bower_components/ng-context-menu/dist/ng-context-menu.min.js'),
            xDate: path.join(__dirname, './bower_components/xdate/src/xdate.js'),
            lodash: path.join(__dirname, './bower_components/lodash/lodash.js'),
            es6shim: path.join(__dirname, './bower_components/es6-shim/es6-shim.js'),
            angularPromiseExtras: path.join(__dirname, './bower_components/angular-promise-extras/angular-promise-extras.js'),
            eventemitter2: path.join(__dirname, './bower_components/eventemitter2/lib/eventemitter2.js'),
            immutable: path.join(__dirname, './bower_components/immutable/dist/immutable.js'),
            ngClipboard: path.join(__dirname, './bower_components/ngclipboard/dist/ngclipboard.js'),
            clipboard: path.join(__dirname, './bower_components/clipboard/dist/clipboard.js'),
            // angularWebsocket: path.join(__dirname, './bower_components/angular-websocket/dist/angular-websocket.js')
        }
    },
    postcss: [
        //require('autoprefixer')
    ]
};
