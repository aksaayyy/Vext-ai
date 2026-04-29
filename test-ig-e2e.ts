import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { processVideoUrl } from './src/lib/audio/transcription';

async function test() {
  try {
    console.log("Testing IG pipeline end-to-end");
    const result = await processVideoUrl('https://www.instagram.com/p/DVtXFamk2hF/');
    console.log("Success!", result.text.substring(0, 50));
  } catch (err) {
    console.error("Pipeline failed:", err);
  }
}
test();
