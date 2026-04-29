/**
 * Validation script for required environment variables.
 * Used during deployment / build.
 */

const REQUIRED_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'GROQ_API_KEY',
  'NVIDIA_API_KEY',
  'OPENROUTER_API_KEY',
  'RESEND_API_KEY',
  'NEXT_PUBLIC_BASE_URL'
];

function validate() {
  console.log('🔍 Validating environment variables...');
  const missing = REQUIRED_VARS.filter(v => !process.env[v]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    process.exit(1);
  }

  console.log('✅ Environment validation passed.');
}

validate();
