module.exports = function(grunt) {
    var Log = require('../deprecated/Log.js');
    var nodemailer = require("nodemailer");

    // ==========================================================================
    // TASKS
    // ==========================================================================

    grunt.registerMultiTask('sa-email', 'Email Task', function() {
        Log.prototype.log("Grunt", "SA - Notify via Email");
        var self = this;
        self.done = this.async();

        var body = templatize(this.data.body);
        var subject = templatize(this.data.subject);

        var smtpTransport = nodemailer.createTransport("SMTP", this.data.config);

        var mailOptions = {
            from: this.data.from,
            to: this.data.recipients.join(","),
            subject: subject,
            html: body
        }

        // send mail with defined transport object
        smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
                Log.prototype.log("Email Error :: ", error.toString());
            }else{
                Log.prototype.log("Email sent (" + self.target + ")", self.data.recipients.join(","));
            }
            smtpTransport.close();
            self.done.apply();
        });


        function templatize(message, data) {
            if (message.indexOf("<numAssets>") != -1) {
                var assets = grunt.file.readJSON(self.data.assets);
                message = message.replace("<numAssets>", assets.length);
            }

            if (message.indexOf("<assets>") != -1) {
                var assets = grunt.file.readJSON(self.data.assets);
                message = message.replace("<assets>", serializeAssetList(assets, "<br />"));
            }

            if (message.indexOf("<showHTMLOutput>") != -1) {
                message = message.replace("<showHTMLOutput>", grunt.file.read(self.data.showHTML));
            }
            return message;
        }

        function serializeAssetList(list, sep) {
            var str = "";
            for (var c in list) {
                str += list[c].label + sep;
                str += "from <strong>" + list[c].source + "</strong>" + sep;
                str += "<a href='" + list[c].link + "'>" + list[c].link + "</a>" + sep + sep;
            }
            return str;
        }
    });
};