const { intelligenceService } = require('./src/lib/intelligence/service');

// Test transcript for setup/tutorial
const testTranscript = `
Today we're going to learn how to set up a React project from scratch. 
First, make sure you have Node.js installed. Then, create a new directory for your project.
Navigate to that directory and run npx create-react-app my-app.
This will set up all the necessary dependencies and configuration.
Once it's done, you can start the development server with npm start.
You'll see the default React welcome page in your browser.
From here, you can begin building your application by modifying the src/App.js file.
`;

console.log('Testing intelligence service with setup/tutorial transcript...');
console.log('Transcript:', testTranscript.substring(0, 100) + '...');

intelligenceService.processTranscript(testTranscript)
  .then(result => {
    console.log('✅ Success!');
    console.log('Classification:', result.classification);
    console.log('Output:', JSON.stringify(result.output, null, 2));
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  });