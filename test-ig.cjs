const ytdl = require('youtube-dl-exec');
ytdl('https://www.instagram.com/p/DVtXFamk2hF/', { dumpSingleJson: true, noWarnings: true })
  .then(console.log)
  .catch(console.error);
