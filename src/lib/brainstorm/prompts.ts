export function buildBrainstormPrompt(input: {
  title: string;
  transcript?: string;
  techStack?: string[];
  concepts?: string[];
  classification?: string;
}): string {
  const techList = input.techStack?.join(', ') || 'various technologies';
  const conceptList = input.concepts?.join(', ') || 'general concepts';
  const transcriptSnippet = input.transcript 
    ? `\n\nVideo transcript excerpt:\n"""${input.transcript.slice(0, 1500)}..."""`
    : '';

  return `You are a creative product brainstormer specializing in developer tools and AI-powered applications.

Given the following tutorial/project, generate related project ideas and extension possibilities.

## Source Project
- **Title**: ${input.title}
- **Tech Stack**: ${techList}
- **Concepts**: ${conceptList}
- **Classification**: ${input.classification || 'general'}
${transcriptSnippet}

## Task
Generate a JSON object with:
1. "related_projects": 5 diverse project ideas that build on or relate to this tutorial's topic. Each should have:
   - "title": Short catchy name
   - "description": 1-2 sentence description
   - "difficulty": "easy", "medium", or "hard"
   - "skills_gained": array of skills someone would gain

2. "extension_ideas": 3-5 ways to extend/expand the tutorial project. Each should have:
   - "title": Brief title
   - "description": What it adds
   - "implementation_hint": How to implement it

## Rules
- Projects should be realistic and buildable (not vaporware)
- Include a mix of difficulty levels
- Focus on practical, useful applications
- Extensions should logically extend the original project
- Think about what would be genuinely useful to developers

## Output Format
Return ONLY valid JSON, no markdown:
{
  "related_projects": [...],
  "extension_ideas": [...]
}`;
}

export function buildSearchVolumePrompt(topic: string): string {
  return `Analyze the following topic for search interest and viability:

Topic: "${topic}"

Based on this topic, estimate:
1. Whether there's meaningful search interest (true/false)
2. Related search queries people would use
3. Target audience demographics

Return ONLY valid JSON:
{
  "worth_building": true/false,
  "target_audience": "description of who would search for this",
  "search_intent": "informational/navigational/commercial/transactional"
}`;
}
