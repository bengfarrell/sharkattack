var AssetMetadata = require('./AssetMetadataFormatter');
var SourceMetadata = require('./SourceMetadataFormatter');
var Database = require('../../utils/Database');
var path = require('path');
var fs = require('fs');

function Output(data, config) {
    var self = this;

    /** database instance */
    this.db = new Database(config);

    if ( config && config.log ) {
        this.log = config.log;
    } else {
        this.log = function(){};
    }

    /** failed assets */
    this.failedAssets = [];

    /** library */
    this.lib = { sources: [] };


    // format asset metadata
    data.sources.forEach( function(src) {

        var assets = [];
        if (src.assets) {
            src.assets.forEach( function(a) {
                var isFailure = a._$flow.failure;
                var asset = AssetMetadata.prototype.apply(a,src);
                if (isFailure) {
                    self.failedAssets.push(asset);
                    self.db.connectSync('assets/blacklisted/' + asset.sourceid);
                    self.db.insert(asset.media, asset);
                } else {
                    assets.push(asset);
                    self.db.connectSync('assets/discovered/' + asset.sourceid);
                    self.db.insert(asset.media, asset);
                }
            });
        }

        if (assets.length > 0) {
            self.lib.sources.push( SourceMetadata.prototype.apply(src, assets) );
        }
    });

    // write library file
    if (config.libLocation) {
        if (!fs.existsSync(path.dirname(config.libLocation))){
            fs.mkdirSync(path.dirname(config.libLocation));
        }
        fs.writeFileSync(config.libLocation, JSON.stringify(self.lib, undefined, 2));
    }

    return self.lib;

}

exports = module.exports = Output;