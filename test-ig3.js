const ytdl = require('youtube-dl-exec');
const fs = require('fs');
ytdl('https://www.instagram.com/p/DVtXFamk2hF/', {
  extractAudio: true,
  audioFormat: 'm4a',
  output: './test-ig-audio3.mp4',
  noWarnings: true,
  noCheckCertificates: true,
  preferFreeFormats: true,
})
.then(() => {
  console.log('Download complete');
  console.log('Does .mp4 exist?', fs.existsSync('./test-ig-audio3.mp4'));
  console.log('Does .m4a exist?', fs.existsSync('./test-ig-audio3.m4a'));
})
.catch(console.error);
