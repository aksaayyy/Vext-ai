const ytdl = require('youtube-dl-exec');
ytdl('https://www.instagram.com/p/DVtXFamk2hF/', {
  extractAudio: true,
  audioFormat: 'm4a',
  output: './test-ig-audio.m4a',
  noWarnings: true,
  noCheckCertificates: true,
  preferFreeFormats: true,
})
.then(() => console.log('Download complete'))
.catch(console.error);
