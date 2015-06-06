var fs = require('fs');
var events = require('events');
var util = require('util');
var Time = require('../utils/Time');
var Queue = require( '../utils/Queue');

/**
 * Scheduler task
 * @param config
 * @param timer frequency (seconds)
 * @constructor
 */
function Scheduler(config, frequency) {
    var self = this;

    /** currently running task */
    this.running = 'none';

    /**
     * c-tor
     */
    this.init = function() {
        this.refresh();

        if (frequency) {
            setInterval( function() {
                self.runCheck();
            }, frequency * 1000)
        }
    };

    /**
     * continuously check for task to run
     */
    this.runCheck = function() {
        var now = new Date();
        var diff = parseInt( (self.nextUp.date.getTime() - now.getTime()) / 1000 );

        if (diff < 0) {
            this.runTask(self.nextUp.task);
        }
        return diff;
    };

    /**
     * run task of type task
     * @param task
     */
    this.runTask = function(task) {
        self.nextUp = self.upcoming.pop();
        self.emit(this.RUN_TASK, task);
    };

    /**
     * refresh configuration
     */
    this.refresh = function() {
        self.upcoming = self.getUpcomingDates(config.scheduling).reverse();
        self.nextUp = self.upcoming.pop();

    };


    /**
     * get last logged task runs
     * @return run object
     */
    this.getLastTaskRuns = function(tasktype) {
        if (fs.existsSync(config.logging.runlog)) {
            log = JSON.parse(fs.readFileSync(config.logging.runlog));
        } else {
            return {};
        }

        var returnobj = {};
        for (var c in log) {
            returnobj[c] = log[c][log[c].length-1];
            if (returnobj[c].start) {
                returnobj[c].start = new Date(returnobj[c].start.split('(')[0]);
            }
            if (returnobj[c].end) {
                returnobj[c].end = new Date(returnobj[c].end.split('(')[0]);
            }
        }

        console.log(returnobj)
        return returnobj;
    };

    /**
     * get upcoming dates
     * @param schedule
     * @return upcoming tasks
     */
    this.getUpcomingDates = function(schedule) {
        var lastrun = this.getLastTaskRuns([this.PACKAGING_TASK, this.CLEANING_TASK, this.DISCOVERY_TASK]);
        var scheduledtasks = [];
        for (var c in schedule) {
            for (var d in schedule[c]) {
                var date;
                if (schedule[c][d].day && schedule[c][d].time) {
                    date = self.convertDayTimeToDate(schedule[c][d].day, schedule[c][d].time);
                    scheduledtasks.push( {task: c, date: self.convertDayTimeToDate(schedule[c][d].day, schedule[c][d].time)});
                }

                // add to plan ahead for next week in case of wraparound
                if (date) {
                    scheduledtasks.push( {task: c, date: new Date( date.getTime() + 7 * 24 * 60 * 60 * 1000) });
                }
            }
        }

        scheduledtasks.sort(function(a, b) {
           if (a.date.getTime() > b.date.getTime()) { return 1; } else { return -1; }
        });

        // remove past dates
        var upcoming = [];
        var now = new Date();
        for ( var e = 0; e < scheduledtasks.length; e++) {
            var hasRun = false;

            if (lastrun[scheduledtasks[e].task] && lastrun[scheduledtasks[e].task].start) {
                var timediff = scheduledtasks[e].date.getTime() - lastrun[scheduledtasks[e].task].start.getTime();
                if (timediff > 0 && timediff < 120 * 1000) {
                    hasRun = true;
                }
            }

            if (now.getTime() < scheduledtasks[e].date.getTime() && hasRun === false) {
                upcoming.push(scheduledtasks[e]);

            }
        }
        return upcoming;
    };

    /**
     * assuming this week is in scope, convert day time to date object
     * @param day
     * @param time
     */
    this.convertDayTimeToDate = function(day, time) {
        var now = new Date();
        now.setHours(0);
        now.setMinutes(0);
        now.setSeconds(0);
        var currentday = now.getDay();
        var daydiff = (currentday - day) * 24 * 60 * 60 * 1000;
        var t = parseInt(time.split(':')[0] * 60 * 60 * 1000) + parseInt(time.split(':')[1] * 60 * 1000);
        return new Date( now.getTime() + daydiff + t);
    };

    this.init();
}

Scheduler.prototype.RUN_TASK = 'runtask';
util.inherits(Scheduler, events.EventEmitter);

exports = module.exports = Scheduler;