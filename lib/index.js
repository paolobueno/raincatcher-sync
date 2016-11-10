if (window && window.angular) {
  module.exports = require('./lib/sync-ng');
} else {
  var q = require('q');
  module.exports = require('./syncService')(q);
}