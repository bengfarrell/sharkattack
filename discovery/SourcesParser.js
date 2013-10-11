var sax = require('sax')
    , request = require('request')
    , fs = require('fs')
    , url = require('url')
    , util = require('util')
    , events = require('events')
    , Log = require('./../utils/Log.js');

function SourcesParser () {
    var self = this;

    this._currentTag = "";
    this._currentNode = null;
    this._sources = [];
    this._callback = null;

    this.saxStream = require('sax').createStream(false, {lowercasetags: true}); // https://github.com/isaacs/sax-js
    //self.saxStream.on('error', function (e){ self.handleSaxError(e, self) });
    this.saxStream.on('opentag', function (n){ self.onOpenTag(n, self) });
    this.saxStream.on('closetag', function (el){ self.onCloseTag(el, self) });
    this.saxStream.on('text', function (text){ self.onText(text, self) });
    //self.saxStream.on('cdata', function (text){ self.handleText(text, self) });
    this.saxStream.on('end', function (){ self.onEnd(self) });

    this.onOpenTag = function (node, scope) {
        switch (node.name) {
            case "source":
                scope._currentNode = {};
                break;

            case "sources":
                break;

            default:
                scope._currentTag = node.name;
                break;
        }
    }

    this.onCloseTag = function (node, scope) {
        scope._currentTag = "";
        if (node == "source") {
            scope._sources.push(scope._currentNode);
        }
    }

    this.onText = function (text, scope) {
        if (scope._currentNode && scope._currentTag !="") {
            scope._currentNode[scope._currentTag] = text;
        }
    }

    this.parseFile = function(file, callback) {
        Log.prototype.log("Sources Parser", "Read sources from " + file);
        self._callback = callback;
        if ( file.substr(0, 7) == "http://" ||
            file.substr(0, 8) == "https://" ) {
            request(file).pipe(self.saxStream);
        } else {
            fs.createReadStream(file)
                .on('error', function (e){ self.handleError(e, self); })
                .pipe(self.saxStream);
        }
    }

    this.onEnd = function (scope) {
        scope.emit(SourcesParser.prototype.SOURCE_PARSING_COMPLETE, scope._sources);
    }

}

util.inherits(SourcesParser, events.EventEmitter);


SourcesParser.prototype.SOURCE_PARSING_COMPLETE = "sourceParsingComplete";

exports = module.exports = SourcesParser;