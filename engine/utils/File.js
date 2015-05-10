var fs = require('fs');
var path = require('path');

function File() {}

/**
 * convert to a safe filename
 * @param dirs
 */
File.prototype.safeFilename = function(filename) {
    filename = escape(filename);
    filename = filename.replace(/\\|\//g, ' ');
    return filename;
};

/**
 * get all files in a directory
 * @param dir
 * @param ignore directories
 * @param files_
 * @returns {*|Array}
 */
File.prototype.getAllFiles = function(dir, ignore, files_){
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + path.sep + files[i];
        if (fs.statSync(name).isDirectory()) {
            if (ignore.indexOf(name) === -1) {
                File.prototype.getAllFiles(name, ignore, files_);
            }
        } else {
            files_.push(name);
        }
    }
    return files_;
};


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
};

/**
 * delete file list
 * @param files
 * @param dir
 */
File.prototype.deleteFiles = function(files, dir) {
    for (var c in files) {
        if (File.prototype.doesExist(dir + path.sep + files[c])) {
            fs.unlinkSync(dir + path.sep + file)
        }
    }
};

/**
 * delete all associated files in directory
 * @param files
 * @param directory
 */
File.prototype.deleteAllAssociatedFiles = function(files, dir) {
    for (var c in files) {
        var file = File.prototype.removeExtension(files[c]);
        if (File.prototype.doesExist(dir + path.sep + files[c])) {
            fs.unlinkSync(dir + path.sep + files[c])
        }
        if (File.prototype.doesExist(dir + path.sep + file)) {
            fs.unlinkSync(dir + path.sep + file)
        }
        if (File.prototype.doesExist(dir + path.sep + file + ".mp3")) {
            fs.unlinkSync(dir + path.sep + file + ".mp3")
        }
        if (File.prototype.doesExist(dir + path.sep + file + ".mp4")) {
            fs.unlinkSync(dir + path.sep + file + ".mp4")
        }
        if (File.prototype.doesExist(dir + path.sep + file + ".flv")) {
            fs.unlinkSync(dir + path.sep + file + ".flv")
        }
    }
};

/**
 * filename from path
 * @param path
 * @return filename without extension
 */
File.prototype.convertPathToFilename = function(pth) {
    return pth.substr(pth.lastIndexOf(path.sep)+1, pth.length);
};

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
};

/**
 * get file extension
 * @param filename
 * @return file extension
 */
File.prototype.getExtension = function(filename) {
    if (filename.lastIndexOf(".") > -1) {
        filename = filename.substr(filename.lastIndexOf(".")+1, filename.length);
    }
    return filename;
};

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
};

/**
 * does media exist in any format?
 * @param path
 */
File.prototype.getMediaFileRef = function(pth) {
    if (File.prototype.doesExist(pth)) {
        return pth;
    }
    if (File.prototype.doesExist(File.prototype.removeExtension(pth) + ".mp3")) {
        return File.prototype.removeExtension(pth) + ".mp3";
    }
    if (File.prototype.doesExist(File.prototype.removeExtension(pth) + ".mp4")) {
        return File.prototype.removeExtension(pth) + ".mp4";
    }
    if (File.prototype.doesExist(File.prototype.removeExtension(pth) + ".flv")) {
        return File.prototype.removeExtension(pth) + ".flv";
    }
    if (File.prototype.doesExist(File.prototype.removeExtension(pth) + ".webm")) {
        return File.prototype.removeExtension(pth) + ".webm";
    }
    return null;
};

/**
 * does file exist?
 * @param path
 */
File.prototype.doesExist = function(pth) {
    try {
        stats = fs.lstatSync(pth);
        return true;
    }
    catch (e) {
        return false;
    }
};

/**
 * check if directory
 * @param path
 * @return {Boolean}
 */
File.prototype.isDirectory = function(pth) {
    try {
        stats = fs.lstatSync(pth);
        if (stats.isDirectory() ) {
            return true;
        } else {
            return false;
        }
    }
    catch (e) {
        return false;
    }
};

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
                buffer = fs.readFileSync(source + path.sep + file + appendExtensions[d]);
                fs.writeFileSync(dest + path.sep + file + appendExtensions[d], buffer);
            } catch (e) {
                console.log(e)
                uncopied.push(source + path.sep + file);
            }
        }
    }
    return uncopied;
};

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
};

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
};

/**
 * remove a directory recursively
 * @param dirPath
 */
File.prototype.removeDir = function(dirPath) {
    try { var files = fs.readdirSync(dirPath); }
    catch(e) { return; }
    if (files.length > 0)
        for (var i = 0; i < files.length; i++) {
            var filePath = dirPath + path.sep + files[i];
         rmDir = function(dirPath) {
      try { var files = fs.readdirSync(dirPath); }
      catch(e) { return; }
      if (files.length > 0)
        for (var i = 0; i < files.length; i++) {
          var filePath = dirPath + path.sep + files[i];
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