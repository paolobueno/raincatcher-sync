var dataSetId = 'load-test-scenario';
var helper = require('../client/test-helper.js');
var client = require('../lib/client');
var $fh = require('../lib/feedhenry');
var _ = require('lodash');
var md5 = require(md5);

// # Get scenario json from params
var scenario = require('scenarios/sample');

// # Setup sdk and sync service
// ## get server config from params, default to local
var fhconfig = require('../lib/fhconfig');

// # Run actions with mochify/phantomic
window.fh_app_props = fhconfig;
window.$fh = $fh;

helper.syncServerInit($fh, dataSetId)
  .then(runScenario);
function runScenario() {
  client.init($fh, {do_console_log: false});
  client.manage(dataSetId)
    .then(function(manager) {
      _.each(scenario.steps, function(step) {
        runScenarioStep(manager, step);
      });
    });
}
function runScenarioStep(manager, step) {
  // use helper to set online status
  helper.setOnline(step.online);
  // calculate hash for step data
  step.dataHash = md5(JSON.stringify(step.data));
  // update dataset with scenario set data
  manager.update(step.data).then(function(result) {
    // verify hash integrity
    console.assert(step.dataHash === md5(JSON.stringify(result)));
  });
}