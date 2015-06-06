var Database = require('../../utils/Database');

function CriteriaCheck(config) {
    var self = this;

    /** database */
    var db = new Database(config);

    /** asset list */
    this.assets = [];

    if ( config && config.log ) {
        this.log = config.log;
    } else {
        this.log = function(){};
    }

    /**
     * check if asset passes criteria - only check what's appropriate for asset step
     * @param asset
     * @returns {boolean}
     */
    this.isPassing = function(asset) {
        var step = asset._$flow.steps[asset._$flow.currentStep].name;
        switch (step) {
            case "discover":
                if (self.isBlacklisted(asset)) { return false; }
                if (self.isDuplicate(asset)) { return false; }
                if (self.isOutdated(asset)) { return false; }
                return true;
                break;

            case "download":
                return true;
                break;

            case "transcode":
                return true;
                break;

            case "mediainfo":
                return self.overDuration(asset);
                break;

            case "complete":
                return true;
                break;

            default:
                return true;
                break;
        }
    };

    /**
     * asset duplicate check
     * @param asset
     * @returns {boolean}
     */
    this.isDuplicate = function(asset) {
        for (var c in this.assets) {
            if (this.assets.filename === asset.filename) {
                self.log("Criteria Check", "Asset " + asset.filename + " is a duplicate" , { date: new Date(), level: "verbose", asset: asset });
                return true;
            }
        }
        this.assets.push(asset);
        return false;
    };

    /**
     * asset duration check against source configuration
     * @param asset
     * @returns {boolean}
     */
    this.overDuration = function(asset) {
        if (!asset.duration) { return true; } // unknown duration - pass for now
        if (!asset.source.maxDuration) { return true; } // no duration limit - pass
        if (asset.source.maxDuration > asset.duration) { return true; } // duration check passes

       self.log("Criteria Check", "Asset " + asset.media + " is over duration at " + asset.duration + " compared to " + asset.source.maxDuration , { date: new Date(), level: "verbose", asset: asset });
        return false;
    };

    /**
     * check if blacklisted asset
     * @param asset
     * @returns {boolean}
     */
    this.isBlacklisted = function(asset) {
        db.connectSync('assets/blacklisted/' + asset.source.id);
        var result = db.find(asset.media);
        if (!result) { return false; } // not blacklisted: pass

        self.log("Criteria Check", "Asset " + asset.media + " is blacklisted" , { date: new Date(), level: "verbose", asset: asset });
        return true;
    };

    /**
     * check if outdated
     * @param asset
     */
    this.isOutdated = function(asset) {
        if (!asset.source.maxAge) { return false; }
        var d = new Date(asset.date);
        var now = new Date(Date.now());
        var diff = now -d;
        var daysOld = diff / 1000 / 60 / 60 / 24;
        if (daysOld < asset.source.maxAge) { return false; }

        self.log("Criteria Check", "Asset " + asset.media + " is " + daysOld + " and greater than max age of " + asset.source.maxAge , { date: new Date(), level: "verbose", asset: asset });
        return true;
    }
}

exports = module.exports = CriteriaCheck;