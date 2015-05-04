var Time = require('../utils/Time.js');
var File = require('../utils/File.js');

function Playlist(assets) {

    this.assets = assets;

    /**
     * insert a vo after a specific asset
     * @param vo asset
     * @param asset to place VO after
     * @param offset by
     */
    this.insertVOAfterAsset = function(voasset, asset, offset) {
        for (var c = 0; c <= this.assets.length; c++) {
            // todo: this is only necessary to check the label because of duplicate files - fix this!
            if (File.prototype.removeExtension(asset.filename) === File.prototype.removeExtension(this.assets[c].filename)
                && asset.label === this.assets[c].label) {
                this.assets.splice(c + 1 + offset, 0, voasset);
                return;
            }
        }

    };

    /**
     * get playlist length
     * @return {Number}
     */
    this.getLength = function() {
        var dur = 0;
        for (var c in this.assets) {
            if (this.assets[c].duration) {
                dur += this.assets[c].duration;
            }
        }
        return dur;
    };

    /**
     * export html playlist
     * @return text based playlist
     */
    this.exportToHTML = function() {
        var output = "<html><body>";
        output += "<h2>SharkAttack</h2>\r\n";
        var currentTime = 0;
        for (var c in this.assets ) {
            var dur = 0;
            if (this.assets[c].duration) {
                dur = parseInt(this.assets[c].duration);
            }

            var localPath = this.assets[c].filename;
            if (this.assets[c].audioTranscodeFilename) {
                localPath = this.assets[c].audioTranscodeFilename;
            }
            //var src = this._findSourceFromLibrary(this.assets[c].sourceid);
            output += "<br />\r\n";

            output += "\r\n";
            output += "<div>\r\n";
            output += "<em class='currenttime'>Start Time: " + Time.prototype.formatToString(currentTime) + "</em>\r\n";

            var label = "";
            if (this.assets[c].text) {
                label = this.assets[c].text
            } else {
                label = this.assets[c].label;
            }
            output += "<div class='tracklabel'><strong>" + label + "</strong> (" + Time.prototype.formatToString(dur) + ")</div>\r\n";
            output += "<div class='tracksource'>" + this.assets[c].sourceid + "</div>\r\n";
            output += "</div>\r\n";
            output += "\r\n";

            currentTime += dur;
        }

        output += "\r\n";
        output += "<br /><br />\r\n";
        output += "<h2>Total Time: " + Time.prototype.formatToString(currentTime)  + "</h2>\r\n"
        output += "</body></html>"
        return output;
    };

    /**
     * export m3u8 playlist
     * @return text based playlist
     */
    this.exportToM3U8 = function() {
        var output = "#EXTM3U";
        for (var c in this.assets ) {
            var dur = 0;
            if (this.assets[c].duration) {
                dur = this.assets[c].duration;
            }

            var localPath = this.assets[c].filename;
            if (this.assets[c].audioTranscodeFilename) {
                localPath = this.assets[c].audioTranscodeFilename;
            }
            output += "\r\n";
            output += "#EXTINF:" + dur + "," + this.assets[c].sourceid + " :: " + this.assets[c].label;
            output += "\r\n";
            output += localPath;
        }
        return output;
    };

    /**
     * export json playlist
     * @return json based playlist
     */
    this.exportToJSON = function() {
        return JSON.stringify(this.assets, null, "\t");
    }
}
exports = module.exports = Playlist;
