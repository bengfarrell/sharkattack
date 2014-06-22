var Log = require('./../deprecated/Log.js'),
    events = require('events'),
    FileUtils = require('../utils/File.js'),
    FilterFactory = require('./../package/FilterFactory');
    fs = require("fs");

function FilterLibrary() {
    /**
     * process library
     * @param library
     */
    this.process = function(lib, filters) {
        if (lib.sources) {
            var filtered = {sources:[]};
            for (var c in lib.sources) {
                var assets = [];
                for (var d in lib.sources[c].assets) {
                    if (this._isFilteredOut(lib.sources[c],lib.sources[c].assets[d], filters) == false) {
                        var cln =  this._clone(lib.sources[c].assets[d]);
                        assets.push(cln);
                    }
                }
                if (assets.length > 0) {
                    var source = this._clone(lib.sources[c], "assets");
                    source.assets = assets;
                    filtered.sources.push(source);
                }
            }
        } else {
            // assume flat structure - no source parents
            filtered = [];
            for (var c in lib) {
                if (this._isFilteredOut(null, lib[c], filters) == false) {
                    var cln =  this._clone(lib[c]);
                    filtered.push(cln);
                }
            }
        }
        return filtered;
    }

    /**
     * check if asset is filtered
     * @param source
     * @param asset
     * @param filter
     * @return {Boolean}
     * @private
     */
    this._isFilteredOut = function(source, asset, filters) {
        if (!Array.isArray(filters)) {
             filters = [filters];
        }

        for (filter in filters) {
            filterFn = FilterFactory.prototype.createFilter(filters[filter].name);
            if ( filterFn.apply(this, [source, asset, filters[filter].params] ) == true) {
                return true;
            }
        }
        return false;
    }

    /**
     * clone a node/object
     * @param node
     * @param array of props to exclude from clone
     * @return {Object}
     * @private
     */
    this._clone = function(node, exclude) {
        var newnode = {}
        for (var prop in node) {
            if (node.hasOwnProperty(prop)) {
                if (exclude == null || exclude.indexOf(prop) == -1) {
                    newnode[prop] = node[prop];
                }
            }
        }
        return newnode;
    }
}
exports = module.exports = FilterLibrary;