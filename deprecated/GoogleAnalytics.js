var querystring = require('querystring'),
    https = require('https'),
    events = require('events'),
    util = require('util');

/**
 * Google Analytics Class - mostly stolen from
 * https://github.com/ncb000gt/node-googleanalytics
 * but that didn't seem to work
 * @constructor
 */
function GoogleAnalytics() {

    var self = this;

    /** start date of data */
    this.startDate = "";

    /** end date of data */
    this.endDate = "";

    /** Google Analytics account */
    this.account = "";

    /** filter by */
    this.filters = "";

    /** sort on */
    this.sort = "";

    /** metrics */
    this.metrics = "";

    /** dimensions */
    this.dimensions = "";

    /** max results */
    this.maxResults = 50;

    /**
     * login/authentication
     * @param user
     * @param pass
     * @param cb
     */
    this.login = function(user, pass, cb) {
        var postData = {
            Email: user,
            Passwd: pass,
            accountType: "HOSTED_OR_GOOGLE",
            source: "curl-accountFeed-v2",
            service: "analytics"
        };

        var options = { host: "www.google.com", port: 443, method: 'POST', path: '/accounts/ClientLogin', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
        var req = https.request(options, function(res) {
            var chunks = [];
            var length = 0;
            res.on('data', function(chunk) {
                chunks.push(chunk);
                length += chunk.length;
            });
            res.on('end', function() {
                var data = self._combineChunks(chunks, length).toString();
                var m = data.match(/(Auth=[^\s]*)\s/);
                if (!m) {
                    self._onAuthenticated("Token Error", m[1]);
                } else {
                    self._onAuthenticated(null, m[1]);
                }
            });
        });
        req.write(querystring.stringify(postData));
        req.end();
    }

    /**
     * on authenticated
     * @param err
     * @param tok
     */
    this._onAuthenticated = function(err, tok) {
        if (err) {
            self.emit(GoogleAnalytics.prototype.GA_ERROR, "token error");
            return;
        }
        var options = {
            'ids': 'ga:' + self.account,
            'start-date': self.startDate,
            'end-date': self.endDate,
            'dimensions': 'ga:' + self.dimensions,
            'metrics': 'ga:' + self.metrics,
            'filters': 'ga:' + self.filters,
            'sort': '-ga:' + self.sort,
            'max-results':this.maxResults
        };
        self._makeRequest(options, tok);
    }

    /**
     * make request
     * @private
     */
    this._makeRequest = function(options, token) {
        var data_url = "/analytics/v3/data/ga?" + querystring.stringify(options);

        var get_options = {
            host: 'www.googleapis.com',
            port: 443,
            path: data_url,
            method: 'GET',
            headers: {
                Authorization:"GoogleLogin "+token,
                "GData-Version": 2
            }
        };

        var req = https.request(get_options, function(res) {
            var chunks = [];
            var length = 0;
            res.on('data', function(chunk) {
                chunks.push(chunk);
                length += chunk.length;
            });
            res.on('end', function() {
                var results = [];
                var rankings = [];

                try {
                    var data_data = self._combineChunks(chunks, length).toString();
                    var data = JSON.parse(data_data).rows;

                    for (var c in data) {
                        rankings.push(data[c][1]);
                        results.push(data[c][0]);
                    }
                    self.emit(GoogleAnalytics.prototype.GA_COMPLETE, results, rankings);
                } catch (error) {
                    self.emit(GoogleAnalytics.prototype.GA_ERROR, data_data);
                }
            });
        });
        req.end();
    }

    /**
     * format return data
     * @param chunks
     * @param length
     * @return {Function}
     * @private
     */
    this._combineChunks = function(chunks, length) {
        var buf = new Buffer(length);
        var off = 0;
        for (var i = 0; i < chunks.length; i++) {
            var chunk = chunks[i];
            chunk.copy(buf, off, 0);
            off += chunk.length;
        }
        return buf;
    }
}

util.inherits(GoogleAnalytics, events.EventEmitter);
exports = module.exports = GoogleAnalytics;

GoogleAnalytics.prototype.GA_COMPLETE = "complete";
GoogleAnalytics.prototype.GA_ERROR = "error";