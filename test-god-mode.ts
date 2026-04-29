import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { intelligenceService } from './src/lib/intelligence/service';

async function testGodMode() {
  console.log("🚀 Starting Vext God Mode Test...");
  
  const mockTranscript = `
    Today we're looking at a huge opportunity in the AI space. Many small businesses struggle with responding to customer reviews across platforms like Yelp, Google Maps, and Trustpilot. It's too time-consuming. What if we build an AI tool that connects to these APIs, uses a simple prompt to generate context-aware replies, and auto-posts them? You'd need a backend with Next.js, PostgreSQL for users, and the OpenAI API. The market size for local SMBs is massive, easily a $5B TAM. We could charge $49/mo. We can build this MVP in a month, launch it to 50 beta users, and focus on SEO for acquisition. The real moat here is the accumulated data of high-performing review responses that we can fine-tune our models on.
  `;

  try {
    console.log(`\n[1/1] Activating God Mode Intelligence on Mock Transcript...`);
    const card = await intelligenceService.processTranscript(mockTranscript);
    
    console.log(`\n✅ GOD MODE EXTRACTION COMPLETE!`);
    console.log(`Classification: ${card.classification}`);
    console.log(`\n========== BLUEPRINT OUTPUT ==========`);
    console.log(JSON.stringify(card.output, null, 2));
    console.log(`======================================\n`);

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testGodMode();
