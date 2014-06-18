module.exports = function(grunt) {

    var path = require("path");
    var workspace = grunt.option( "workspace") ? grunt.option( "workspace") : "";
    var showname = grunt.option( "showname") ? grunt.option( "showname") : "show";
    var dev = grunt.option( "dev") ? grunt.option( "dev") : false;

    if (!grunt.file.exists(workspace + "config.json")) {
        grunt.file.copy("backups/config.json", workspace + "config.json");
    }

    // Project configuration.
    grunt.initConfig({
        workspace: workspace,
        showname: showname,
        config: grunt.file.readJSON( workspace + "config.json"),

        curl: {
            "feed-library": {
                src: "http://www.blastanova.com/bnova-admin/feed-library.json",
                dest: "<%= config.locations.libraryLocation %>/data/feed-library.json"
            },
            "show-script": {
                src: "http://www.blastanova.com/bnova-admin/playlist-script.json",
                dest: "<%= config.locations.libraryLocation %>/data/playlist-script.json"
            },
            "whats-my-ip": {
                src: "http://ifconfig.me/all.json",
                dest: "<%= config.locations.libraryLocation %>/data/whatsmyip.json"
            }
        },

        clean: {
            options: { force: true },
            show: ["<%= config.locations.showLocation %>"]
        },

        copy: {
            "show-playlists": {
                files: [
                    {expand: true, flatten: true,
                        rename: function(dest, src) {
                            return dest + path.sep + showname + path.extname(src);
                        },
                        src: [
                        "<%= config.locations.libraryLocation %>/data/temp/pls.json",
                        "<%= config.locations.libraryLocation %>/data/temp/pls.html",
                        "<%= config.locations.libraryLocation %>/data/temp/pls.m3u8"],
                        dest: '<%= config.locations.showLocation %>', filter: 'isFile'}
                ]
            },
            "initial-setup": {
                files: [
                    {expand: true, flatten: true,
                        src: [
                            "backups/feed-library.json",
                            "backups/playlist-script.json",],
                        dest: '<%= config.locations.libraryLocation %>/data/'}]
            }
        },

        "ftp-deploy": {
            "bnova-trunk": {
                auth: "<%= config.ftpauth %>",
                src: "<%= config.locations.libraryLocation %>/data",
                dest: "/htdocs/play-trunk/json",
                exclusions: [ "<%= config.locations.libraryLocation %>/data/temp %>", "<%= config.locations.libraryLocation %>/data/logs %>"]
            },
            "bnova": {
                auth: "<%= config.ftpauth %>",
                src: "<%= config.locations.libraryLocation %>/data",
                dest: "/htdocs/play/json",
                exclusions: [ "<%= config.locations.libraryLocation %>/data/temp %>", "<%= config.locations.libraryLocation %>/data/logs %>"]
            }
        },

        "sa": {
            // Ensure required directories are created and logs are initialized
            init: {
                dirs: [
                    "<%= config.locations.libraryLocation %>/data/temp",
                    "<%= config.locations.libraryLocation %>/data/logs",
                    "<%= config.locations.libraryLocation %>/data/backup",
                    "<%= config.locations.mediaLocation %>",
                    "<%= config.locations.showLocation %>",
                    "<%= config.locations.interstitialLocation %>" ],
                libraryLocation: "<%= config.locations.libraryLocation %>",
                logDir: "<%= config.locations.libraryLocation %>/data/logs",
                logAge: 10
            },
            "refresh-wan-ip": {
                source: "<%= config.locations.libraryLocation %>/data/whatsmyip.json",
                dest: "<%= config.locations.libraryLocation %>/data/whatsmyip.html"
            },
            "zip": {
                src: ["<%= config.locations.showLocation %>"],
                dest: "<%= config.locations.zipOutputLocation %>/" + showname + ".zip"
            },
            "end": {}
        },

        "sa-discover": {
            // Parse source feed and create an asset list
            discover: {
                dev: dev,
                feedlistSource: "<%= config.locations.libraryLocation %>/data/feed-library.json",
                maxItemsInSource: 5,
                soundcloud: "<%= config.soundcloud %>",
                allowVimeo: true,
                allowYouTube: true,
                allowSoundcloud: true,
                output: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json",
                removalListFile: "<%= config.locations.libraryLocation %>/data/removal-list.json"
            },

            // Poll Google Analytics to get top favorites and append them to list
            "discover-favorites": {
                assetslistFile: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json",
                maxItems: 5,
                output: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json",
                googleAnalytics: "<%= config.googleAnalytics %>"
            }
        },

        "sa-library": {
            // Download assets from asset list
            download: {
                soundcloud: "<%= config.soundcloud %>",
                assetslistFile: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json",
                mediaDirectory: "<%= config.locations.mediaLocation %>",
                removalListFile: "<%= config.locations.libraryLocation %>/data/removal-list.json",
                output: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json"
            },

            // Transcoder.js any video assets to audio
            transcode: {
                assetslistFile: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json",
                mediaDirectory: "<%= config.locations.mediaLocation %>",
                removeVideosAfterTranscode: true,
                removalListFile: "<%= config.locations.libraryLocation %>/data/removal-list.json",
                output: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json"
            },

            // Inject metadata in assets that don't have sufficient metadata
            "metadata-inject": {
                assetslistFile: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json",
                mediaDirectory: "<%= config.locations.mediaLocation %>"
            },

            // Create Spotify links for assets
            "spotify-resolve": {
                assetslistFile: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json",
                mediaDirectory: "<%= config.locations.mediaLocation %>",
                output: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json"
            },

            // Create purchase links for assets
            "apply-purchase-links": {
                amazon: "<%= config.amazon %>",
                assetslistFile: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json",
                mediaDirectory: "<%= config.locations.mediaLocation %>",
                output: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json"
            },

            // Sync Library data with Filesystem
            "sync-library-data": {
                assetslistFile: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json",
                mediaDirectory: "<%= config.locations.mediaLocation %>",
                output: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json"
            },

            // Remove artists that are duplicates to prevent large numbers of assets from the same
            // album for example
            "remove-duplicate-artists": {
                assetslistFile: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json",
                mediaDirectory: "<%= config.locations.mediaLocation %>",
                removalListFile: "<%= config.locations.libraryLocation %>/data/removal-list.json",
                output: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json"
            },

            // Remove assets that are too long in duration
            "remove-over-duration": {
                assetslistFile: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json",
                maxDuration: 600,
                removalListFile: "<%= config.locations.libraryLocation %>/data/removal-list.json",
                output: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json"
            },

            // Remove assets that are too old
            "remove-old-assets": {
                assetslistFile: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json",
                maxAgeInDays: 14,
                removalListFile: "<%= config.locations.libraryLocation %>/data/removal-list.json",
                output: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json"
            },

            // Remove assets that don't have enough metadata
            "remove-insufficient-metadata-assets": {
                assetslistFile: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json",
                mediaDirectory: "<%= config.locations.mediaLocation %>",
                removalListFile: "<%= config.locations.libraryLocation %>/data/removal-list.json",
                output: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json"
            },

            // Reconcile assets against database or last run to sync dates and other properties
            "reconcile-library": {
                useDatabase: true,
                database: "<%= config.database%>",
                /*useLastRun: false,
                lastRunFile: "library/data/assets-library.json",*/
                assetslistFile: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json",
                output: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json"
            }
        },

        "sa-publish": {
            // Output files
            "library-output": {
                assetslistFile: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json",
                sourceslistFile: "<%= config.locations.libraryLocation %>/data/feed-library.json",
                outputfilters: [ {filters: [
                                    {name: "includeMP3Only"},
                                    {name: "excludeSources", params:"sareq wolfpack"}],
                                    file:"<%= config.locations.libraryLocation %>/data/webassets.json"},
                                {filters: [
                                    {name: "includeMP3Only"},
                                    {name: "includeSources", params:"wolfpack"}],
                                    file:"<%= config.locations.libraryLocation %>/data/wolfpack-test.json"},
                                { filters: [
                                    {name: "includeMP3Only"},
                                    {name: "includeSpotifyOnly", params:"sareq"}],
                                    file:"<%= config.locations.libraryLocation %>/data/spotify.json"},
                                { filters: [],
                                    file:"<%= config.locations.libraryLocation %>/data/assets.json"},
                                { filters: [],
                                    file:"<%= config.locations.libraryLocation %>/data/flattened-assets.json"}
                                ]
            },

            // Create output for all sources to be consumed by a source directory reader
            // (one that doesn't read assets - just sources)
            "build-source-list": {
                exclude: ["sareq"],
                libraryFile: "<%= config.locations.libraryLocation %>/data/assets.json",
                output: "<%= config.locations.libraryLocation %>/data/sources.json"
            },

            // Record new assets in DB and JSON
            "record-new-assets": {
                newfiles: "<%= config.locations.libraryLocation %>/data/temp/new-files.json",
                assetslistFile: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json",
                output: "<%= config.locations.libraryLocation %>/data/temp/temp-library.json",
                useDatabase: true,
                database: "<%= config.database%>"
            },

            // produce daily counts
            "dailycounts": {
                daysToLookBack: 90,
                output: "<%= config.locations.libraryLocation %>/data/dailycounts.json",
                database: "<%= config.database%>"
            }
        },

        "sa-buildshow": {
            // Download interstitials from script
            "download-interstitials": {
                mediaDirectory: "<%= config.locations.interstitialLocation %>",
                scriptFile: "<%= config.locations.libraryLocation %>/data/playlist-script.json",
                libraryFile: "<%= config.locations.libraryLocation %>/data/assets.json",
                output: "<%= config.locations.libraryLocation %>/data/interstitials.json"
            },

            // Create playlist from script
            "build-playlist": {
                interstitialLibraryFile: "<%= config.locations.libraryLocation %>/data/interstitials.json",
                scriptFile: "<%= config.locations.libraryLocation %>/data/playlist-script.json",
                libraryFile: "<%= config.locations.libraryLocation %>/data/assets.json",
                output: { "m3u8": "<%= config.locations.libraryLocation %>/data/temp/pls.m3u8",
                          "json": "<%= config.locations.libraryLocation %>/data/temp/pls.json",
                          "html": "<%= config.locations.libraryLocation %>/data/temp/pls.html" }
            },

            // copy show assets to temporary location
            "copy-show-assets": {
                mediaDirectory: "<%= config.locations.mediaLocation %>",
                interstitialDirectory: "<%= config.locations.interstitialLocation %>",
                showDirectory: "<%= config.locations.showLocation %>",
                playlistFile: "<%= config.locations.libraryLocation %>/data/temp/pls.json"
            },

            "record-show": {
                "showHistoryFile": "<%= config.locations.libraryLocation %>/data/show-list.json",
                "showname": showname
            }
        },

        "sa-email": {
            "newassets": {
                config: "<%= config.email %>",
                from: "bengfarrell@gmail.com",
                recipients: ["ben@benfarrell.com"],
                subject: "SharkAttack Found <numAssets> New Assets",
                body: "SharkAttack job discovered new media:<br /><br /><assets>",
                assets: "<%= config.locations.libraryLocation %>/data/temp/new-files.json"
            },
            "showplaylist": {
                config: "<%= config.email %>",
                from: "bengfarrell@gmail.com",
                recipients: "<%= config.show.emailList%>",
                subject: "SharkAttack Built New Show: " + showname,
                body: "<showHTMLOutput>",
                showHTML: "<%= config.locations.libraryLocation %>/data/temp/pls.html"
            }
        }
    });

    grunt.loadNpmTasks("grunt-curl");
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-ftp-deploy');
    grunt.loadNpmTasks('grunt-zip');
    grunt.loadTasks('shark-tasks');

    grunt.registerTask('buildAssetLibrary', [
        "sa:init:BuildAssetLibrary",
        "sa:refresh-wan-ip",
        "sa-discover:discover",
        "sa-discover:discover-favorites",
        "sa-library:reconcile-library",
        "sa-library:remove-old-assets",
        "sa-library:download",
        "sa-library:transcode",
        "sa-library:metadata-inject",
        "sa-library:sync-library-data",
        "sa-library:remove-insufficient-metadata-assets",
        "sa-library:remove-duplicate-artists",
        "sa-library:remove-over-duration",
        "sa-library:apply-purchase-links",
        "sa-library:spotify-resolve",
        "sa-publish:record-new-assets",
        "sa-publish:library-output",
        "sa-publish:dailycounts",
        "sa-email:newassets",
        "sa-publish:build-source-list",
        "ftp-deploy:bnova-trunk",
        "ftp-deploy:bnova",
        "sa:end"
    ]  );

    grunt.registerTask('buildAssetLibrary-dev', [
        "sa:init:BuildAssetLibrary",
        "sa-discover:discover",
        "sa-discover:discover-favorites",
        "sa-library:reconcile-library",
        "sa-library:remove-old-assets",
        "sa-library:download",
        "sa-library:transcode",
        "sa-library:metadata-inject",
        "sa-library:sync-library-data",
        "sa-library:remove-insufficient-metadata-assets",
        "sa-library:remove-duplicate-artists",
        "sa-library:remove-over-duration",
        "sa-library:apply-purchase-links",
        "sa-library:spotify-resolve",
        "sa-publish:record-new-assets",
        "sa-publish:library-output",
        "sa-publish:dailycounts",
        /*"sa-email:newassets",*/
        "sa-publish:build-source-list",
        /*"ftp-deploy:bnova-trunk",*/
        "sa:end"
    ]  );

    grunt.registerTask('buildShow', [
        "clean:show",
        "sa:init:BuildShow",
        "sa-buildshow:download-interstitials",
        "sa-buildshow:build-playlist",
        "sa-buildshow:copy-show-assets",
        "copy:show-playlists",
        "sa-email:showplaylist",
        "sa:zip",
        "sa-buildshow:record-show",
        "sa:end"
    ]);

    grunt.registerTask('setup', [
        "sa:init:BuildAssetLibrary",
        "copy:initial-setup"

    ]);

    grunt.registerTask('custom', grunt.config.get("config").custom );
};