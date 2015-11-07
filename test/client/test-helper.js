'use strict';

var _ = require('lodash');
var q = require('q');
var syncTestHelper = {};
var navigatorOnLine, navigatorOffLine, oldNavigator;

syncTestHelper.startLoggingNotifications = function(mediator, datasetId) {
  var topic = 'sync:notification:'+datasetId;
  var subscription = mediator.subscribe(topic, function(event) {
    console.log('\x1b[36m%s\x1b[0m', '** sync event:', event.dataset_id, ':', event.code, ':',  event.message);
  });
  console.log('Listening for events on topic:', topic);
}

syncTestHelper.stopLoggingNotifications = function(mediator, datasetId) {
  var topic = 'sync:notification:'+datasetId;
  mediator.remove(topic);
  console.log('Stopped listnening for events on topic:', topic);
}

syncTestHelper.syncServerReset = function($fh) {
  var deferred = q.defer();
  $fh.cloud({
    path: '/sync/reset',
    method: 'GET'
  }, function() {
    deferred.resolve();
  }, function(err) {
    deferred.reject(err);
  })
  return deferred.promise;
}

syncTestHelper.syncServerInit = function($fh, datasetId) {
  var deferred = q.defer();
  $fh.cloud({
    path: '/sync/init/' + datasetId,
    method: 'GET'
  }, function() {
    deferred.resolve();
  }, function(err) {
    deferred.reject(err);
  })
  return deferred.promise;
}

syncTestHelper.syncServerStop = function($fh, datasetId) {
  var deferred = q.defer();
  $fh.cloud({
    path: '/sync/stop/' + datasetId,
    method: 'GET'
  }, function() {
    deferred.resolve();
  }, function(err) {
    deferred.reject(err);
  });
  return deferred.promise;
}

syncTestHelper.overrideNavigator = function() {
  // Overide window.navigator.onLine to make sync work
  if (! oldNavigator) {
    navigatorOnLine = {};
    navigatorOffLine = {}
    for (var i in navigator) {
      navigatorOnLine[i] = navigator[i];
      navigatorOffLine[i] = navigator[i];
    }
    navigatorOnLine.onLine = true;
    navigatorOffLine.onLine = false;
    oldNavigator = navigator;
    navigator = navigatorOnLine;
  }
}

syncTestHelper.restoreNavigator = function() {
  if (navigator.oldNavigator) {
    navigator = navigator.oldNavigator;
  }
}

syncTestHelper.setOnline = function(onLine) {
  navigator = onLine ? navigatorOnLine : navigatorOffLine;
}

syncTestHelper.waitForSyncComplete = function(mediator, datasetId) {
  var deferred = q.defer();
  mediator.promise('sync:notification:'+datasetId, {predicate: function(notification) {
    return _.isMatch(notification, {code: 'sync_complete'}) || _.isMatch(notification, {code: 'sync_failed'})
  }}).then(function(notification) {
    if (notification.code === 'sync_complete') {
      deferred.resolve(notification);
    } else if (notification.code === 'sync_failed') {
      deferred.reject(new Error('Sync Failed', notification));
    }
  });
  return deferred.promise;
}

syncTestHelper.notificationPromise = function(mediator, datasetId, condition) {
  return mediator.promise('sync:notification:'+datasetId, {
    predicate: function(notification) {
      return _.isMatch(notification, condition);
    }
  });
}

module.exports = syncTestHelper;
