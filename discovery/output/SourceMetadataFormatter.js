function SourceMetadataFormatter() {}

SourceMetadataFormatter.prototype.props = ["url", "type", "label", "id", "page"];

/**
 * apply custom rules to metadata
 * @param asset
 */
SourceMetadataFormatter.prototype.apply = function(source, assets) {
    var formatted = {};

    // map desired properties to formatted asset
    for (var prop in source) {
        if (SourceMetadataFormatter.prototype.props.indexOf(prop) != -1) {
            formatted[prop] = source[prop];
        } /*else {
         console.log(prop)
         }*/
    }

    // add assets
    formatted.assets = assets;
    return formatted;
}

exports = module.exports = SourceMetadataFormatter;