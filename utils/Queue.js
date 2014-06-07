function Queue(config) {
    var self = this;

    /** the item queue */
    this.queue = [];

    /** queue finish callback */
    this.onComplete;

    /** config */
    this.config = config;

    /** logging */
    if ( config.logging ) {
        this.logging = config.logging;
    } else {
        this.logging = function(){};
    }

    self.logging(Queue.prototype.name, "Instantiated", { date: new Date(), level: "verbose" } );

    /**
     * process items
     * @param callback
     */
    this.run = function(cb) {
        self.logging(Queue.prototype.name, "Run", { date: new Date(), level: "verbose" } );
        self.onComplete = cb;
        self.next();
    }

    /**
     * clear the queue
     */
    this.clear = function() {
        self.queue = [];
    }

    /**
     * get queue length
     * @returns {Number}
     */
    this.getLength = function() {
        return self.queue.length;
    }

    /**
     * start next item(s)
     */
    this.next = function() {
        self.logging(Queue.prototype.name, "Start Next", { date: new Date(), level: "verbose" } );
        self.queue.forEach( function(i) {
            self._startItem(i)
        });
    }

    /**
     * add an item to our queue
     * @param item
     * @param task
     * @param cb
     * @param concurrent
     */
    this.add = function(item, task, cb, concurrent) {
        // assign an internal callback
        item._$queueCallback = self._itemCallback;

        // assign the external callback we want from the arg
        item._$callback = cb;

        // assign the work task to be done
        item._$task = task;

        // the task is neither done nor running right now
        item._$done = false;
        item._$running = false;

        // placeholder to set later
        item._$timestarted = null;

        // mark it as concurrent or not
        item._$concurrent = concurrent;

        self.logging(Queue.prototype.name, "Add Item", { date: new Date(), level: "verbose" } );
        self.queue.push(item);
    }

    /**
     * start an item if we can
     * @param item
     * @private
     */
    this._startItem = function(item) {
        if (self._canItemStartNow(item)) {
            if (item._$task) {
                item._$running = true;
                item._$timestarted = new Date();
                self.logging(Queue.prototype.name, "Start Task of new item", { date: new Date(), level: "verbose" } );
                item._$task.apply(self, [item, function() {
                    if (!item._$done) {
                        item._$queueCallback.apply(self, [item]);
                    }}]
                );
                return true;
            } else {
                // prematurely finished, no task to do
                item._$done = true;
                item._$running = false;
                self.logging(Queue.prototype.name, "Finish item, there is no associated task", { date: new Date(), level: "verbose" } );
                item._$callback.apply(self, [item]);
                return true;
            }
        } else {
            return false;
        }
    }

    /**
     * check if item can start now
     * @param item
     * @returns {boolean}
     * @private
     */
    this._canItemStartNow = function(item) {
        // if item is already done, move on
        if (item._$done == true) {
            return false;
        }

        // if item is running, move on
        if (item._$running == true) {
            return false;
        }

        // is another sync item is running, we can't start
        var runningCount = 0;
        self.queue.forEach(function(i) {
            if (i._$running == true) {
                runningCount ++;
                if (i._$concurrent == false) {
                    console.log(item.name + " blocked")
                    self.logging(Queue.prototype.name, "Item blocked from running because other tasks are running", { date: new Date(), level: "verbose" } );
                    return false;
                }
            }
        });

        // if item is sync and there are other items running, we can't start
        if (item._$concurrent && runningCount > 0) {
            self.logging(Queue.prototype.name, "Item blocked from running because other tasks are running", { date: new Date(), level: "verbose" } );
            return false;
        }

        // we can start the item
        return true;

    }

    /**
     * item is complete, fire callback
     * @param item
     * @private
     */
    this._itemCallback = function(item) {
        self.logging(Queue.prototype.name, "Item callback", { date: new Date(), level: "verbose" } );
        item._$done = true;
        item._$running = false;
        item._$callback.apply(self, [item]);

        var done = true;
        self.queue.forEach( function(i) {
            if (i._$done == false) {
                done = false;
            }
            if (i._$running == true) {
                done = false;
            }
        });

        if (done) {
            self.onComplete.apply(self, [self.queue]);
        } else {
            self.next();
        }
    }
}

Queue.prototype.name = "Queue";
exports = module.exports = Queue;