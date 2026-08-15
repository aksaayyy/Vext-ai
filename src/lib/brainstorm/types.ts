export interface BrainstormIdea {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  skills_gained: string[];
}

export interface BrainstormExtension {
  title: string;
  description: string;
  implementation_hint: string;
}

export interface BrainstormResult {
  related_projects: BrainstormIdea[];
  extension_ideas: BrainstormExtension[];
}

export interface BrainstormInput {
  title: string;
  transcript?: string;
  techStack?: string[];
  concepts?: string[];
  classification?: string;
}
