var fs = require("fs"),
    util = require('util'),
    events = require("events"),
    Log = require('Log.js'),
    FileUtils = require('../utils/File.js');

function QueueProcessor(cb, itemProc) {
    var self = this;
    this.callback = cb;
    this.itemProcessor = itemProc;
}

/**
 * process queue
 * @param queue
 * @private
 */
QueueProcessor.prototype.process = function(queue) {
    this.index = -1;
    this.queue = queue;
    this.next(this);
}

/**
 * next
 * @private
 */
QueueProcessor.prototype.next = function(scope) {
    if (scope == null) {
        scope = this;
    }

    scope.index ++;
    if (scope.index >=  scope.queue.length) {
        scope.callback.apply(scope);
        return;
    }
    scope.currentItem = scope.queue[scope.index];
    scope.itemProcessor.apply(scope, [scope.queue[scope.index]]);
}

exports = module.exports = QueueProcessor;