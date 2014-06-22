var AssetMetadata = require('./AssetMetadataFormatter');
var SourceMetadata = require('./SourceMetadataFormatter');
var Database = require('../../utils/Database');

function Output(data, config) {
    var self = this;

    /** database instance */
    this.db = new Database(config);

    if ( config && config.logging ) {
        this.logging = config.logging;
    } else {
        this.logging = function(){};
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
                    failedAssets.push(asset);
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

    return self.lib;

}

exports = module.exports = Output;