var fs = require('fs');

function File() {}


/**
 * make sure directories exist
 * @param dirs
 */
File.prototype.ensureDirectoriesExist = function(dirs) {
    for (var c in dirs) {
        try {
            fs.mkdirSync(dirs[c]);
        }  catch(e) {}
    }
}

/**
 * delete file list
 * @param files
 * @param dir
 */
File.prototype.deleteFiles = function(files, dir) {
    for (var c in files) {
        if (File.prototype.doesExist(dir + "/" + files[c])) {
            fs.unlinkSync(dir + "/" + file)
        }
    }
}

/**
 * delete all associated files in directory
 * @param files
 * @param directory
 */
File.prototype.deleteAllAssociatedFiles = function(files, dir) {
    for (var c in files) {
        var file = File.prototype.removeExtension(files[c]);
        if (File.prototype.doesExist(dir + "/" + files[c])) {
            fs.unlinkSync(dir + "/" + files[c])
        }
        if (File.prototype.doesExist(dir + "/" + file)) {
            fs.unlinkSync(dir + "/" + file)
        }
        if (File.prototype.doesExist(dir + "/" + file + ".mp3")) {
            fs.unlinkSync(dir + "/" + file + ".mp3")
        }
        if (File.prototype.doesExist(dir + "/" + file + ".mp4")) {
            fs.unlinkSync(dir + "/" + file + ".mp4")
        }
        if (File.prototype.doesExist(dir + "/" + file + ".flv")) {
            fs.unlinkSync(dir + "/" + file + ".flv")
        }
    }
}

/**
 * filename from path
 * @param path
 * @return filename without extension
 */
File.prototype.convertPathToFilename = function(path) {
    return path.substr(path.lastIndexOf("/")+1, path.length);
}

/**
 * filename from link
 * @param link
 * @param media type
 * @return filename
 */
File.prototype.convertLinkToFilename = function(link, type) {
    if (type == "youtube") {
        var f;
        if (link.indexOf("v=") != -1) {
            f = link.substr(link.indexOf("v=") +2, link.length);
        } else if (link.indexOf("embed/") != -1) {
            f = link.substr(link.indexOf("embed/") +6, link.length);
        }
        return f;
    } else if (type == "soundcloud") {
        var file = link.substr(link.lastIndexOf("/tracks/")+8, 8);
        return file + ".mp3";
    } else {
        var f = File.prototype.removeExtension(link);
        var file = f.substr(f.lastIndexOf("/")+1, f.length);
        if (file == "") {
            file = (parseInt(Math.random()*1000)).toString();
        }

        if (file.substr(file.length - 4, file.length).toLowerCase() != ".mp3") {
            file += ".mp3";
        }
        return file;
    }
}

/**
 * remove file extension
 * @param filename
 * @return filename without extension
 */
File.prototype.removeExtension = function(filename) {
    if (filename.lastIndexOf(".") > -1) {
        filename = filename.substr(0,filename.lastIndexOf("."));
    }
    return filename;
}

/**
 * does media exist in any format?
 * @param path
 */
File.prototype.getMediaFileRef = function(path) {
    if (File.prototype.doesExist(path)) {
        return path;
    }
    if (File.prototype.doesExist(File.prototype.removeExtension(path) + ".mp3")) {
        return File.prototype.removeExtension(path) + ".mp3";
    }
    if (File.prototype.doesExist(File.prototype.removeExtension(path) + ".mp4")) {
        return File.prototype.removeExtension(path) + ".mp4";
    }
    if (File.prototype.doesExist(File.prototype.removeExtension(path) + ".flv")) {
        return File.prototype.removeExtension(path) + ".flv";
    }
    if (File.prototype.doesExist(File.prototype.removeExtension(path) + ".webm")) {
        return File.prototype.removeExtension(path) + ".webm";
    }
    return null;
}

/**
 * does file exist?
 * @param path
 */
File.prototype.doesExist = function(path) {
    try {
        stats = fs.lstatSync(path);
        return true;
    }
    catch (e) {
        return false;
    }
}

/**
 * check if directory
 * @param path
 * @return {Boolean}
 */
File.prototype.isDirectory = function(path) {
    try {
        stats = fs.lstatSync(path);
        if (stats.isDirectory() ) {
            return true;
        } else {
            return false;
        }
    }
    catch (e) {
        return false;
    }
}

/**
 * copy files
 * @param files
 * @param source
 * @param dest
 * @param do all extensions (mp3, flv, mp4)
 */
File.prototype.copyFiles = function(files, source, dest, appendExtensions) {
    if (!files instanceof Array) {
        files = [files];
    }

    if (!appendExtensions) {
        appendExtensions = [""];
    }

    var uncopied = [];

    for (var c in files) {
        var file = files[c];

        for (var d in appendExtensions)  {
            try {
                buffer = fs.readFileSync(source + "/" + file + appendExtensions[d]);
                fs.writeFileSync(dest + "/" + file + appendExtensions[d], buffer);
            } catch (e) {
                console.log(e)
                uncopied.push(source + "/" + file);
            }
        }
    }
    return uncopied;
}

/**
 * write list of files
 * @param files {path: xxxx, data: xxxx}
 * @param mode
 */
File.prototype.writeFiles = function(files) {
    if (!files instanceof Array) {
        files = [files];
    }

    for (var c in files) {
        f = files[c];
        try {
            var fd = fs.openSync(f.path, "w");
            fs.writeSync(fd, f.data);
            fs.closeSync(fd);
        } catch (e) {
            throw "Can't write file: " + f.path;
        }
    }
}

/**
 * clean a list of paths/files
 * @param paths
 */
File.prototype.clean = function(paths) {
    if (!paths instanceof Array)  {
        paths = [paths];
    }
    for (var c in paths) {
        var path = paths[c];
        if (File.prototype.doesExist(path)) {
            if (File.prototype.isDirectory(path)) {
                File.prototype.removeDir(path);
                fs.mkdirSync(path);
            } else {
                fs.unlinkSync(path);
            }
        }
    }
}

/**
 * remove a directory recursively
 * @param dirPath
 */
File.prototype.removeDir = function(dirPath) {
    try { var files = fs.readdirSync(dirPath); }
    catch(e) { return; }
    if (files.length > 0)
        for (var i = 0; i < files.length; i++) {
            var filePath = dirPath + '/' + files[i];
         rmDir = function(dirPath) {
      try { var files = fs.readdirSync(dirPath); }
      catch(e) { return; }
      if (files.length > 0)
        for (var i = 0; i < files.length; i++) {
          var filePath = dirPath + '/' + files[i];
          if (fs.statSync(filePath).isFile())
            fs.unlinkSync(filePath);
          else
            rmDir(filePath);
        }
      fs.rmdirSync(dirPath);
    };   if (fs.statSync(filePath).isFile())
                fs.unlinkSync(filePath);
            else
                rmDir(filePath);
        }
    fs.rmdirSync(dirPath);
};

exports = module.exports = File;