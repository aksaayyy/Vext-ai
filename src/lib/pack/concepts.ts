export interface KeyConcept {
  term: string;
  definition: string;
  context: string;
}

export function extractKeyConcepts(transcript: string): KeyConcept[] {
  const concepts: KeyConcept[] = [];
  
  const techPatterns = [
    /\b(Python|JavaScript|TypeScript|React|Next\.js|Node\.js|FastAPI|Django|Flask)\b/gi,
    /\b(PostgreSQL|MongoDB|Redis|MySQL|SQLite|DynamoDB)\b/gi,
    /\b(Docker|Kubernetes|Terraform|Ansible|Jenkins|CircleCI|GitHub Actions)\b/gi,
    /\b(AWS|Azure|GCP|Cloudflare|Vercel|Netlify|Heroku)\b/gi,
    /\b(API|REST|GraphQL|gRPC|WebSocket|WebRTC)\b/gi,
    /\b(JWT|OAuth|SSO|SAML|Passwordless)\b/gi,
    /\b(Stripe|PayPal|Braintree|Paddle)\b/gi,
    /\b(OpenAI|Claude|GPT-4|Whisper|Llava|Mistral|LLaMA)\b/gi,
  ];
  
  const techTerms: Record<string, string> = {
    'Python': 'High-level programming language known for readability and versatility',
    'JavaScript': 'Dynamic language for web development (frontend and backend)',
    'TypeScript': 'Typed superset of JavaScript that compiles to plain JS',
    'React': 'UI library for building component-based interfaces',
    'Next.js': 'React framework with SSR, SSG, and API routes',
    'Node.js': 'JavaScript runtime for server-side development',
    'FastAPI': 'Modern Python web framework for building APIs',
    'Django': 'Batteries-included Python web framework',
    'Flask': 'Lightweight Python web framework',
    'PostgreSQL': 'Advanced open-source relational database',
    'MongoDB': 'NoSQL document database',
    'Redis': 'In-memory data store for caching and queues',
    'MySQL': 'Popular open-source relational database',
    'SQLite': 'Lightweight embedded relational database',
    'DynamoDB': 'Fully managed NoSQL database by AWS',
    'Docker': 'Containerization platform for packaging apps',
    'Kubernetes': 'Container orchestration system',
    'Terraform': 'Infrastructure as Code tool by HashiCorp',
    'Ansible': 'Automation tool for configuration management',
    'Jenkins': 'Open-source CI/CD automation server',
    'CircleCI': 'Cloud-based CI/CD platform',
    'GitHub Actions': 'CI/CD integrated into GitHub',
    'AWS': 'Amazon Web Services cloud platform',
    'Azure': 'Microsoft cloud platform',
    'GCP': 'Google Cloud Platform',
    'Cloudflare': 'CDN, DNS, and security platform',
    'Vercel': 'Cloud platform for frontend frameworks',
    'Netlify': 'Platform for web automation and deployment',
    'Heroku': 'Cloud platform as a service (PaaS)',
    'API': 'Application Programming Interface',
    'REST': 'Representational State Transfer - web API architecture',
    'GraphQL': 'Query language for APIs',
    'gRPC': 'High-performance RPC framework',
    'WebSocket': 'Bidirectional communication protocol',
    'WebRTC': 'Real-time communication for browsers',
    'JWT': 'JSON Web Token for authentication',
    'OAuth': 'Open standard for authorization',
    'SSO': 'Single Sign-On authentication',
    'SAML': 'Security Assertion Markup Language for SSO',
    'Stripe': 'Payment processing platform',
    'PayPal': 'Online payment processing service',
    'Braintree': 'Payment gateway by PayPal',
    'Paddle': 'Merchant of record for SaaS payments',
    'OpenAI': 'AI research company (ChatGPT, DALL-E)',
    'Claude': 'AI assistant by Anthropic',
    'GPT-4': 'Large language model by OpenAI',
    'Whisper': 'Speech recognition model by OpenAI',
    'Llava': 'Large multimodal model',
    'Mistral': 'Open-source AI model family',
    'LLaMA': 'Large Language Model Meta AI',
  };

  for (const [term, definition] of Object.entries(techTerms)) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = transcript.match(regex);
    if (matches && matches.length > 0) {
      const contextMatch = transcript.match(new RegExp(`.{0,50}${term}.{0,50}`, 'gi'));
      concepts.push({
        term,
        definition,
        context: contextMatch?.[0] || '',
      });
    }
  }

  return concepts.slice(0, 20);
}
