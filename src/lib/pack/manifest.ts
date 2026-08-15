export interface CardData {
  shareId: string;
  title: string | null;
  classification: string;
  output: unknown;
  createdAt: Date;
  transcription?: string;
  techStack?: string[];
}

export interface Manifest {
  name: string;
  description: string;
  classification: string;
  tech_stack: string[];
  source: {
    type: 'video';
    videoId?: string;
    shareId: string;
    shareUrl: string;
  };
  created_at: string;
  version: string;
}

export function generateManifest(card: CardData, transcription?: string, techStack?: string[]): Manifest {
  const title = card.title || 'Untitled Project';
  
  let description = '';
  if (transcription && transcription.length > 200) {
    description = transcription.slice(0, 200).trim() + '...';
  }

  const detectedStack = techStack || detectTechStack(card.output, transcription);

  return {
    name: slugify(title),
    description,
    classification: card.classification,
    tech_stack: detectedStack,
    source: {
      type: 'video',
      shareId: card.shareId,
      shareUrl: `https://vext.so/card/${card.shareId}`,
    },
    created_at: card.createdAt.toISOString(),
    version: '1.0.0',
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50);
}

function detectTechStack(output: unknown, transcript?: string): string[] {
  const stack: Set<string> = new Set();
  
  const text = transcript || JSON.stringify(output);
  
  const techMap: Record<string, string[]> = {
    'Python': ['python', 'pip', 'venv', 'pyenv'],
    'JavaScript': ['javascript', 'js', 'node', 'npm', 'yarn'],
    'TypeScript': ['typescript', 'ts', 'tsx', 'jsx'],
    'React': ['react', 'reactjs', 'components'],
    'Next.js': ['nextjs', 'next.js', 'app router'],
    'Node.js': ['nodejs', 'node'],
    'FastAPI': ['fastapi', 'uvicorn'],
    'Django': ['django'],
    'Flask': ['flask'],
    'PostgreSQL': ['postgresql', 'postgres', 'psql'],
    'MongoDB': ['mongodb', 'mongoose'],
    'Redis': ['redis'],
    'Docker': ['docker', 'container', 'dockerfile'],
    'Kubernetes': ['kubernetes', 'k8s'],
    'AWS': ['aws', 'amazon web services', 's3', 'ec2', 'lambda'],
    'Cloudflare': ['cloudflare', 'cf-'],
    'Vercel': ['vercel'],
    'Stripe': ['stripe', 'payments'],
    'OpenAI': ['openai', 'gpt', 'chatgpt'],
    'Anthropic': ['anthropic', 'claude'],
    'Tailwind': ['tailwind', 'tailwindcss'],
    'Prisma': ['prisma'],
    'GraphQL': ['graphql'],
    'REST': ['rest', 'rest api', 'restful'],
  };

  const textLower = text.toLowerCase();
  for (const [tech, keywords] of Object.entries(techMap)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        stack.add(tech);
        break;
      }
    }
  }

  return Array.from(stack).slice(0, 10);
}
