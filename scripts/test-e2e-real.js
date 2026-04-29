const fetch = require('node-fetch');

async function testE2E() {
  console.log('🚀 Starting End-to-End Workflow Test...');
  const BASE_URL = 'http://127.0.0.1:3000';



  const VIDEO_URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'; // Me at the zoo (19s)

  try {
    // 1. Check health
    console.log('Step 1: Checking health...');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const health = await healthRes.json();
    console.log('Health:', JSON.stringify(health, null, 2));

    // 2. Start processing
    console.log('Step 2: Starting processing for video:', VIDEO_URL);
    const processRes = await fetch(`${BASE_URL}/api/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl: VIDEO_URL }),
    });
    const processData = await processRes.json();
    if (!processRes.ok) throw new Error(`Process failed: ${JSON.stringify(processData)}`);
    const jobId = processData.jobId;
    console.log('Job ID:', jobId);

    // 3. Poll for completion
    console.log('Step 3: Polling for completion...');
    let jobStatus = 'queued';
    let attempts = 0;
    while (jobStatus !== 'completed' && attempts < 20) {
      const pollRes = await fetch(`${BASE_URL}/api/process?id=${jobId}`);
      const pollData = await pollRes.json();
      jobStatus = pollData.status;
      console.log(`Attempt ${attempts + 1}: Status is ${jobStatus}`);
      if (jobStatus === 'failed') throw new Error(`Job failed: ${pollData.error}`);
      if (jobStatus !== 'completed') {
        await new Promise(r => setTimeout(r, 5000));
        attempts++;
      }
    }

    if (jobStatus !== 'completed') throw new Error('Polling timed out');
    console.log('✅ Video processing completed.');

    // 4. Run intelligence extraction
    console.log('Step 4: Running intelligence extraction...');
    const extractRes = await fetch(`${BASE_URL}/api/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
    const extractData = await extractRes.json();
    if (!extractRes.ok) throw new Error(`Extraction failed: ${JSON.stringify(extractData)}`);
    console.log('✅ Extraction successful. Card ID:', extractData.shareId);
    console.log('Card URL:', `${BASE_URL}/card/${extractData.shareId}`);

    // 5. Test ZIP export
    console.log('Step 5: Testing ZIP export...');
    const exportRes = await fetch(`${BASE_URL}/api/card/${extractData.shareId}/export`);
    if (!exportRes.ok) throw new Error(`Export failed: ${exportRes.status}`);
    console.log('✅ Export successful. Content-Type:', exportRes.headers.get('content-type'));

    console.log('\n✨ ALL TESTS PASSED SUCCESSFULLY! ✨');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ E2E TEST FAILED:', err.message);
    process.exit(1);
  }
}

testE2E();
