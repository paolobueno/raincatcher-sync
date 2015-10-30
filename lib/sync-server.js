'use strict';

var defaultConfig = require('./default-config');

function initSync(mediator, mbaasApi, datasetId, syncOptions){
  syncOptions = syncOptions || defaultConfig.syncOptions;

  var dataListHandler = function(dataset_id, query_params, cb, meta_data){
    var syncData = {};
    mediator.publish('workorders:load');
    return mediator.promise('done:workorders:load').then(function(data) {
      data.forEach(function(workorder) {
        syncData[workorder.id] = workorder;
      });
      return cb(null, syncData);
    });
  };

  var dataCreateHandler = function(datasetId, data, cb, meta_data) {
    var ts = new Date().getTime();  // TODO: replace this with a proper uniqe (eg. a cuid)
    var workorder = data;
    workorder.createdTs = ts;
    mediator.publish('workorder:create', workorder);
    return mediator.promise('done:workorder:create:' + ts).then(function(createdWorkorder) {
      var res = {
        "uid" : createdWorkorder.id,
        "data" : createdWorkorder
      }
      return cb(null, res);
    });
  };

  var dataSaveHandler = function(datasetId, uid, data, cb, meta_data) {
    mediator.publish('workorder:save', data);
    return mediator.promise('done:workorder:save:' + uid).then(function(updatedWorker) {
      return cb(null, updatedWorker);
    });
  };

  var dataGetHandler = function(datasetId, uid, cb, meta_data) {
    mediator.publish('workorder:load', uid);
    return mediator.promise('done:workorder:load:' + uid).then(function(loadedWorker) {
      return cb(null, loadedWorker);
    });

  };

  //start the sync service
  mbaasApi.sync.init(datasetId, syncOptions, function(err) {
    if (err) {
      console.error(err);
    } else {
      mbaasApi.sync.handleList(datasetId, dataListHandler);
      mbaasApi.sync.handleCreate(datasetId, dataCreateHandler);
      mbaasApi.sync.handleUpdate(datasetId, dataSaveHandler);
      mbaasApi.sync.handleRead(datasetId, dataGetHandler);
    }
  });
}

module.exports = {
  init: initSync
};