MASA IA theme playlist
======================
I will not download NBA YoungBoy (or any other copyrighted track).

Play it through YouTube, or drop files YOU own:

1. YouTube (default, rotates when you add more):
   Edit playlist.json:

   {
     "rotate": true,
     "tracks": [
       { "title": "NBA YoungBoy", "youtubeQuery": "NBA YoungBoy official" },
       { "title": "next song", "youtubeId": "YOUTUBE_VIDEO_ID" }
     ]
   }

2. Your own files:
   Put mp3/ogg in this folder and add:
   { "title": "My cut", "src": "/theme/my-cut.mp3" }

The player rotates to the next track when a local file ends.
YouTube search/embed is one station until you add more IDs.
