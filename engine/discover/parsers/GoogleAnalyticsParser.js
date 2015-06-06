var querystring = require('querystring'),
    https = require('https');


// TODO: Not enough info stored in my GA account to download a favorite fresh - add in the UI, and then consume it here
/**
 * Google Analytics Class - mostly stolen from
 * https://github.com/ncb000gt/node-googleanalytics
 * but that didn't seem to work
 * @constructor
 */
function GoogleAnalyticsParser(source, cb, config) {

    var self = this;

    if ( config && config.log ) {
        this.log = config.log;
    } else {
        this.log = function(){};
    }

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
            self.log("Google Analytics Parser", "Google Analytics Login Failed", { date: new Date(), level: "error", source: source, error: err });
            cb.apply(self, []);
            return;
        }

        self.log("Google Analytics Parser", "Google Analytics Login Success", { date: new Date(), level: "verbose", source: source });
        var options = {
            'ids': 'ga:' + source.account,
            'start-date': self.startDate,
            'end-date': self.endDate,
            'dimensions': 'ga:' + source.dimensions,
            'metrics': 'ga:' + source.metrics,
            'filters': 'ga:' + source.filters,
            'sort': '-ga:' + source.sort,
            'max-results': source.maxItems
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

                try {
                    var data_data = self._combineChunks(chunks, length).toString();
                    var data = JSON.parse(data_data).rows;

                    if (!data) {
                        self.log("Google Analytics Parser", "Google Analytics No valid data Error", { date: new Date(), level: "error", source: source, error: JSON.parse(data_data).error });
                    }

                    for (var c in data) {
                        results.push( self._createAsset(data[c][0], data[c][1]) );
                    }

                    self.log("Google Analytics Parser", "Google Analytics Returned " + results.length + " results", { date: new Date(), level: "verbose", source: source });
                    cb.apply(self, [results]);
                } catch (error) {
                    console.log(error)
                    self.log("Google Analytics Parser", "Google Analytics Error", { date: new Date(), level: "error", source: source, error: error });
                    cb.apply(self, []);
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

    /**
     * add a leading zero to date/month if necessary
     * @param value
     */
    this._addLeadingZero = function(value) {
        if (value.toString().length == 1) {
            return "0" + value;
        }
        return value;
    }

    /**
     * create an asset and return it
     * @param data
     * @private
     * @return asset
     */
    this._createAsset = function(data, rating) {
        var a = {};
        a.label = self._getQueryVariable(data, "title");
        a.filename = self._getQueryVariable(data, "filename");
        a.assetTye = "audio"; // not enough info in data, so assume
        a.mediaType = "mp3"; // not enough info in data, so assume
        a.description = source.description;
        a.link = "";
        a.media = "";
        a.publisher = source.id;
        a.rating = rating;
        return a;
    }

    /**
     * get query var
     */
    this._getQueryVariable = function(query, variable) {
        var vars = query.split('&');
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            if (decodeURIComponent(pair[0]) == variable) {
                return decodeURIComponent(pair[1]);
            }
        }
        return "";
    }

    this.startDate = source.startDate.getFullYear() + "-" + this._addLeadingZero(source.startDate.getMonth()+1) + "-" + this._addLeadingZero(source.startDate.getDate());;
    this.endDate = source.endDate.getFullYear() + "-" + this._addLeadingZero(source.endDate.getMonth()+1) + "-" + this._addLeadingZero(source.endDate.getDate());;
    self.log("Google Analytics Parser", "Google Analytics Date Range: " + self.startDate + " , " + self.endDate, { date: new Date(), level: "verbose", source: source });
    self.login(source.username, source.password);

}
exports = module.exports = GoogleAnalyticsParser;