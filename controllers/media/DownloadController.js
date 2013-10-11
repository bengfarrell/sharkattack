var http = require("http-get"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    util = require('util');

var Log = require('../../utils/Log.js');
var FileUtils = require('../../utils/File.js');
var YouTubeDownload = require('../../download/YouTubeDownload.js');
var LinkResolver = require('../../download/LinkResolver.js');
var FileInfo = require('../../download/FileInfo.js');
var QueueProcessor = require('../QueueProcessor.js');

function DownloadController() {

    var self = this;
    var AssetMetadataCustomRules = require('../../discovery/AssetMetadataCustomRules.js');

    /** configuration for task */
    this.config = {};

    /** downloaded assets */
    this.media = [];

    /**
     * start loading our asset queue
     * @param assets
     */
    this.process = function(data, callback) {
        this.config = data;
        this.callback = callback;
        this._ytdl = new YouTubeDownload(this.config);
        this._resolve = new LinkResolver(this.config);
        this._dlresolve = new FileInfo();
        this._resolve.on(LinkResolver.prototype.LINK_RESOLVED, this._onLinkResolved);
        this._dlresolve.on(FileInfo.prototype.FILE_RESOLVED, this._onFileResolved);
        this._ytdl.on(YouTubeDownload.prototype.FINISH, this._onFileDownloaded);

        if (!this.config.assetslist || this.config.assetslist.length == 0) {
            Log.prototype.log(DownloadController.prototype.classDescription, "No assets to download");
            this.callback.apply();
            return;
        }

        this.queueProcessor = new QueueProcessor(this.onComplete, this.onProcessItem);
        this.queueProcessor.process(this.config.assetslist);
    }

    /**
     * process complete
     * @private
     */
    this.onComplete = function() {
        self.callback.apply(self, [ [
            {file: self.config.output, data: JSON.stringify(self.media, null, '\t')},
            {file: self.config.removalListFile, data: JSON.stringify(self.config.removalList, null, '\t')}] ]);
    }

    /**
     * load next asset
     */
    this.onProcessItem = function(item) {
        // no media URL - load next
        if (!item.media) {
            Log.prototype.log(DownloadController.prototype.classDescription, "Media not found");
            if (self.queueProcessor.currentItem.media) {
                self.config.removalList.push({ media: item.media, reason: "media not found"});
            }
            self.queueProcessor.next(self.queueProcessor);
            return;
        }
        Log.prototype.addLineBreak();
        Log.prototype.log(DownloadController.prototype.classDescription, "Starting - " + item.source + " :: " + item.media);

        Log.prototype.log(DownloadController.prototype.classDescription, "Resolving link " + item.media + " of type " + item.publisher);
        self._resolve.resolve(item.publisher, item.media);
    }

    /**
     * on link resolved
     * @param info
     * @private
     */
    this._onLinkResolved = function(error, info) {
        if (error) {
            Log.prototype.log(DownloadController.prototype.classDescription, error + " Link Cannot be Resolved for " + self.queueProcessor.currentItem.media);
            if (self.queueProcessor.currentItem.media) {
                self.config.removalList.push({ media: self.queueProcessor.currentItem.media, reason: "link not resolved"});
            }
            self.queueProcessor.next(self.queueProcessor);
            return;
        }

        AssetMetadataCustomRules.prototype.apply(self.queueProcessor.currentItem, info, DownloadController.prototype.className);
        Log.prototype.log(DownloadController.prototype.classDescription, "URL resolved to " + self.queueProcessor.currentItem.media);
        self._checkUnique();
    }

    /**
     * on file resolved
     * @param info
     * @private
     */
    this._onFileResolved = function(info) {
        if (!info.duration) {
            self.queueProcessor.currentItem.downloadError = true;
            self.config.removalList.push({ media: self.queueProcessor.currentItem.media, reason: "not a media file"});
            Log.prototype.error(DownloadController.prototype.classDescription, "Found file that doesn't appear to be a media file: " + self.queueProcessor.currentItem.media);
            self.queueProcessor.next(self.queueProcessor);
            return;
        }

        AssetMetadataCustomRules.prototype.apply(self.queueProcessor.currentItem, info, DownloadController.prototype.className);
        self.queueProcessor.next(self.queueProcessor);
    }


    /**
     * check file uniqueness
     * @param err
     * @param stats
     */
    this._checkUnique = function() {
        if (FileUtils.prototype.getMediaFileRef(self.config.mediaDirectory + "/" + self.queueProcessor.currentItem.filename)) {
            self.queueProcessor.currentItem.filename = FileUtils.prototype.convertPathToFilename( FileUtils.prototype.getMediaFileRef(self.config.mediaDirectory + "/" + self.queueProcessor.currentItem.filename));
            Log.prototype.log(DownloadController.prototype.classDescription, "File exists - " + self.queueProcessor.currentItem.filename);
            self.media.push(self.queueProcessor.currentItem);
            self._dlresolve.resolve(self.queueProcessor.currentItem.publisher, self.config.mediaDirectory + "/" + self.queueProcessor.currentItem.filename);
        } else {
            Log.prototype.log(DownloadController.prototype.classDescription, "Now Downloading " + self.queueProcessor.currentItem.media);
            if (self.queueProcessor.currentItem.publisher == "youtube" ||
                self.queueProcessor.currentItem.publisher == "vimeo") {
                self._ytdl.download(self.queueProcessor.currentItem.media, self.queueProcessor.currentItem.filename, self.config.mediaDirectory);
            } else {
                http.get({url:self.queueProcessor.currentItem.media}, self.config.mediaDirectory + "/" + self.queueProcessor.currentItem.filename, self._onFileDownloaded);
            }
        }
    }

    /**
     * on file downloaded
     * @param error
     * @param response
     */
    this._onFileDownloaded = function(error, response) {
        // use Youtube info data to populate asset info
        if (self.queueProcessor.currentItem.publisher == "youtube" || self.queueProcessor.currentItem.publisher == "vimeo") {
            AssetMetadataCustomRules.prototype.apply(self.queueProcessor.currentItem, response, DownloadController.prototype.className);
        }

        if (error) {
            Log.prototype.error(DownloadController.prototype.classDescription, "File Error: " + error);
            self.config.removalList.push({ media: self.queueProcessor.currentItem.media, reason: "file error"});
            self.queueProcessor.currentItem.downloadError = true;
        } else {
            Log.prototype.log(DownloadController.prototype.classDescription, "Finished - " + self.queueProcessor.currentItem.filename);
            self.media.push(self.queueProcessor.currentItem);
        }

        self._dlresolve.resolve(self.queueProcessor.currentItem.publisher, self.config.mediaDirectory + "/" + self.queueProcessor.currentItem.filename);
    }
}

DownloadController.prototype.className = "DownloadController";
DownloadController.prototype.classDescription = "Download Media";

exports = module.exports = DownloadController;