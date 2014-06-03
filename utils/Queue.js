function Queue() {
    var self = this;

    /** the item queue */
    this.queue = [];

    /** count of items that are running */
    this.itemRunningCount = 0;

    /** is sync item running */
    this.isSyncItemRunning = false;


    /**
     * process items
     * @param callback
     */
    this.process = function(cb) {
        self.next();
    }

    /**
     * start next item(s)
     */
    this.next = function() {
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
        item._$concurrent = concurrent ? true : false
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
                item._$task.apply(self, [item]);
                return true;
            } else {
                // prematurely finished, no task to do
                item._$done = true;
                item._$callback.apply(self, [item]);
                return true;
            }
        } else {
            console.log("can't start item due to other items running");
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
        // is another sync item is running, we can't start
        if (self.isSyncItemRunning == true) {
            return false;
        }

        // if item is sync and there are other items running, we can't start
        if (item._$concurrent && self.itemRunningCount > 0) {
            return false;
        }

        // we can start the item
        return true;

    }

    this._itemCallback = function(item) {

    }
}

exports = module.exports = Queue;