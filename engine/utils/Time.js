function Time() {}

/**
 * format to time string
 * @param seconds
 * @return {String}
 */
Time.formatToString = Time.prototype.formatToString = function(seconds) {
    seconds = parseInt(seconds);
    var negative = "";
    if (seconds < 0 ) {
        seconds = Math.abs(seconds);
        negative = "-";
    }
    var secs = seconds % 60;
    var mins = parseInt(seconds / 60);

    var hrs = parseInt(mins/60);
    mins = parseInt(mins % 60);

    if (secs.toString().length == 1) {
        secs = "0" + parseInt(secs);
    }

    if (hrs > 0) {
        if (mins.toString().length == 1) {
            mins = "0" + parseInt(mins);
        }
        return negative + hrs + ":" + mins + ":" + secs;
    }  else {
        return negative + mins + ":" + secs;
    }
}

/**
 * parse a date string to a date accepting dynamic values
 * @param dateStr
 * @return date object
 * @private
 */
Time.prototype.parseDate = function(dateStr) {
    var d;
    if (dateStr.toString().substr(0,3) == "NOW") {
        // dynamic date
        var now = new Date();
        if (dateStr.toString().length > 3) {
            var mod = parseInt(dateStr.toString().substr(3, dateStr.toString().length));
            now.setDate(now.getDate() + mod);
        }
        d = now;
    } else {
        // normal date
        d = new Date(dateStr.toString());
    }
    return d;
}

/**
 *
 * @param duration string
 * @param duration format
 * @oaram duration of parent container (helpful to use percentage to calculate time)
 * @return numeric duration
 * @private
 */
Time.prototype.parseDuration = function(durStr, durFmt, durationOfParent) {
    var dur;
    if (durStr.toString().indexOf("%") == durStr.toString().length-1) {
        var perc = durStr.toString().substr(0,durStr.toString().length-1);
        dur = ( parseFloat(perc) /100 ) * durationOfParent;
    } else {
        dur = parseFloat(durStr);
        switch (durFmt) {
            case "minutes":
                dur *= 60;
                break;
            case "hours":
                dur *= 3600;
                break;
        }
    }
    return dur;
}
exports = module.exports = Time;