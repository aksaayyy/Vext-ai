import { intelligenceService } from './src/lib/intelligence/service';

const brokenJson = `
{
  "business_model": {
    "revenue_streams": ["subscription"],
    "pricing_models": ["freemium", \\"$9.99/mo\\"]
  }
}
`;

async function main() {
  console.log("Original JSON:");
  console.log(brokenJson);
  
  // Try default JSON.parse
  try {
    JSON.parse(brokenJson);
    console.log("Default JSON.parse succeeded (unexpected)");
  } catch (e) {
    console.log("Default JSON.parse failed (expected):", e.message);
  }

  // Use the cleanJson method indirectly or test jsonrepair directly
  const { jsonrepair } = await import('jsonrepair');
  console.log("Fixed JSON:");
  const fixed = jsonrepair(brokenJson);
  console.log(fixed);
  console.log("JSON.parse on fixed JSON succeeds?", !!JSON.parse(fixed));
}

main().catch(console.error);
