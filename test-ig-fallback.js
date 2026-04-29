const ytdl = require('youtube-dl-exec');
ytdl('https://www.instagram.com/p/DVtXFamk2hF/', {
  format: 'bestaudio',
  output: './test-ig-fallback.mp4',
  noWarnings: true,
})
.then(() => console.log('Fallback download complete'))
.catch(console.error);
