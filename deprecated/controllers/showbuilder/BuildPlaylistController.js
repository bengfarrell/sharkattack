var Log = require('../../utils/Log.js'),
    AssetUtils = require('../../utils/AssetsLibrary.js');
    Time = require('../../utils/Time.js'),
    File = require('../../utils/File.js'),
    Playlist = require('../../package/Playlist.js'),
    FilterLibrary = require('./../../package/FilterLibrary.js');

function BuildPlaylistController() {
    var self = this;

    /** configuration for task */
    this.config = {};

    /**
     * process controller
     */
    this.process = function(data, callback) {
        this.config = data;
        this.callback = callback;

        // flatten assets
        this.assets = AssetUtils.prototype.flatten(this.config.library);

        var totalPlaylistTime = Time.prototype.parseDuration(this.config.script.duration, this.config.script.durationFormat);

        var playlist = new Playlist([]);

        var filter = new FilterLibrary();
        this.config.script.script.forEach(function(item) {
            if (item.type == "interstitial") {
                item.duration = self.findInterstitial(item.media).duration;
                totalPlaylistTime -= item.duration;
                item.filename = File.prototype.convertLinkToFilename(item.media);
                playlist.assets.push( item );
            } else if (item.type == "block") {
                var block = { script: item, source: filter.process(self.assets, item.filters) };
                var srt = item.sort;
                block.source = block.source.sort( function(a, b) {
                    return a[srt] < b[srt];
                });

                block.duration = 0;
                block.durationToFill = Time.prototype.parseDuration(item.duration, item.durationFormat, totalPlaylistTime);
                self.fillBlock(block);
                self.mapBlock(block);

                Log.prototype.log(
                    BuildPlaylistController.prototype.classDescription,
                    "Found " + Time.prototype.formatToString(block.duration) + " in "
                        + block.script.label + " with target of "
                        + Time.prototype.formatToString(block.durationToFill));

                block.assets.forEach( function(asset) {
                    playlist.assets.push(asset);
                });
            }
        });

        var outputs = [];
        for (var c in self.config.output) {
            switch (c) {
                case "m3u8":
                    outputs.push( {file: self.config.output[c], data: playlist.exportToM3U8() });
                    break;

                case "json":
                    outputs.push( {file: self.config.output[c], data: playlist.exportToJSON() });
                    break;

                case "html":
                    outputs.push( {file: self.config.output[c], data: playlist.exportToHTML() });
                    break;
            }
        }

        self.callback.apply(self, [ outputs ]);
    }

    /**
     * map block assets to VO in mapping list
     * @param block
     */
    this.mapBlock = function(block) {
        if (!block.script.mapping) {
            return;
        }

        // sort so that assets from same source are in sequence
        block.assets = block.assets.sort(function(a,b) {
            return a.source > b.source;
        });

        Log.prototype.log( BuildPlaylistController.prototype.classDescription, "Duration of block before VO: " + Time.prototype.formatToString(block.duration));
        // map VO's to source blocks
        var currentSource = "";
        var assetsWithVO = [];
        block.assets.forEach( function(asset) {
            if (asset.sourceid != currentSource) {
                currentSource = asset.sourceid;
                block.script.mapping.forEach( function(map) {
                    if (asset.sourceid == map.source) {
                        Log.prototype.log( BuildPlaylistController.prototype.classDescription, "Adding VO: " + map.source);
                        map.filename = File.prototype.convertLinkToFilename(map.media);
                        map.type = "interstitial";
                        map.duration = self.findInterstitial(map.media).duration;
                        block.duration += map.duration;
                        assetsWithVO.push(map);
                    }
                });
            }

            Log.prototype.log( BuildPlaylistController.prototype.classDescription, "Adding: " + asset.label + " from " + asset.date);
            assetsWithVO.push(asset);
        });

        block.assets = assetsWithVO;
    }

    /**
     * fill block with assets according to script
     * @param block
     */
    this.fillBlock = function(block) {
        block.assets = [];
        for (var a in block.source) {
            if (block.duration + block.source[a].duration < block.durationToFill) {
                block.assets.push(block.source[a]);
                block.duration += block.source[a].duration;
            }
        }
    }

    /**
     * find interstitial from library
     * @param media
     */
    this.findInterstitial = function(media) {
        for (var c in self.config.interstitialLibrary) {
            if (self.config.interstitialLibrary[c].media == media) {
                return self.config.interstitialLibrary[c];
            }
        }
        Log.prototype.error( BuildPlaylistController.prototype.classDescription, "Error - can't find interstitial: " + media);
    }

    /**
     * process complete
     * @private
     */
    this.onComplete = function() {
        self.callback.apply();
    }
}

BuildPlaylistController.prototype.className = "BuildPlaylistController";
BuildPlaylistController.prototype.classDescription = "Build Show/Playlist";
exports = module.exports = BuildPlaylistController;