var ng = require('angular');

// load module dependencies
require('dap.shared.jsPlumb');
require('dap.shared.validation');
require('dap.shared.accordionWidget');
require('dap.shared.dropdownWidget');

module.exports = ng.module('flume.pages.flume-workflow', ['dap.shared.validation', 'dap.shared.jsPlumb', 'dap.shared.accordionWidget', 'dap.shared.dropdownWidget']);
