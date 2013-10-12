Sharkattack
===========

> Music Aggregator and Personal Radio Station

*"It's the shark attack, yeah!"*

*Authored by Ben Farrell*

*@bfarrellforever*

*http://www.benfarrell.com*


v1.9
-----------
  - Maintain local library of new music from around the internet
  - Periodically scour your favorite blogs for new music and media
  - Administer source feeds and dynamic playlist scripts
  - Convert YouTube and other video to MP3
  - Stream a customized, personal radio station privately to your own network (beta)
  - Daily log files, activity reports, and email status updates as your library grows

Future (v2.x)
-------------
   - Stream a customized, personal radio station privately to your own network (final)
   - Live personal/social interstitials betweenmusic "ads" (Twitter/Facebook statuses read to you)
   - Easier setup for users who aren't named Ben

Companion Sites
---------------
  - Semi-hourly updates to power http://play.blastanova.com  - Users can purchase, favorite, and listen to tunes

  - Weekly Automated Show builds for playback on http://codebassradio.net on Wednesdays from 1pm to 5pm EST 


Use
---

It should be noted that use is very specific to my needs right now, much tweaking of Grunt tasks and configuration may be required for you

Installation
------------

  - Install the software via Git, Node, and Apt-get (note ffmpeg and mp3 support optional but needed for video conversion support)

```sh
git clone https://github.com/bengfarrell/sharkattack.git
npm install
sudo apt-get install ffmpeg libavcodec-extra-53
cd sharkattack
```

  - Copy the config.json from /backups to project root and fill in missing info and passwords
  - Start the server
```sh
node Main.js
```

Tech
-----
  - Based on Node.js
  - Express.js for radio streaming and administration
  - MongoDB for maintaining data
  - Twitter Bootstrap and AngularJS for administration and radio pages
  - D3.js for daily download charts
  - GruntJS for media library and playlist building tasks (run as cron jobs)
  - FFMPEG and Youtube-DL for video conversion

Configuration (config.json)
-----
  - scheduled-tasks : Grunt tasks to run at scheduled cron time
  - show : Show (a dynamic playlisted script) package details
  - amazon : Amazon account details for affiliated purchase link sharing
  - database : A database (MongoDB) is highly recommended for keeping track of your library
  - email : Email service to use when sending notification emails
  - ftpauth : FTP credentials for sending data output to external sites
  - googleAnalytics: Users can record favorites on external site - Google Analytics integration will download and playlist these favorites for show building or private radio
  - locations : Media and Data location paths for internal SharkAttack use
  - soundcloud : SoundCloud credentials for downloading media
  - tasks : custom task definitions

License
----

MIT