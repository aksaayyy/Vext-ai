const { processYouTubeVideo } = require('./src/lib/audio/transcription');

// Test with a short YouTube video
const testUrl = 'https://youtu.be/dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up (short version)

console.log('Testing YouTube processing pipeline...');
console.log(`URL: ${testUrl}`);

processYouTubeVideo(testUrl)
  .then(result => {
    console.log('✅ Success!');
    console.log(`Transcription: ${result.text.substring(0, 100)}...`);
    console.log(`Duration: ${result.duration} seconds`);
    console.log(`Language: ${result.language}`);
    console.log(`Provider: ${result.provider}`);
    console.log(`Confidence: ${result.confidence}`);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  });