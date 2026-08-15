'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Sparkles, Loader2, ExternalLink, TrendingUp, Lightbulb, Zap, ChevronRight } from 'lucide-react';

interface BrainstormIdea {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  skills_gained: string[];
}

interface BrainstormExtension {
  title: string;
  description: string;
  implementation_hint: string;
}

interface BrainstormResult {
  related_projects: BrainstormIdea[];
  extension_ideas: BrainstormExtension[];
}

interface ExtractionInfo {
  id: string;
  title: string;
  classification: string;
  output: any;
}

export default function BrainstormPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.cardId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BrainstormResult | null>(null);
  const [extraction, setExtraction] = useState<ExtractionInfo | null>(null);

  useEffect(() => {
    async function loadBrainstorm() {
      if (!cardId) return;

      try {
        setLoading(true);
        
        const cardRes = await fetch(`/api/dashboard/extractions/${cardId}`);
        if (!cardRes.ok) throw new Error('Failed to load extraction');
        const cardData = await cardRes.json();
        setExtraction(cardData);

        const brainstormRes = await fetch('/api/brainstorm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: cardData.title || 'Untitled Project',
            transcript: cardData.transcription,
            techStack: cardData.techStack || [],
            concepts: cardData.concepts || [],
            classification: cardData.classification,
          }),
        });

        if (!brainstormRes.ok) throw new Error('Failed to generate brainstorm');
        const brainstormData = await brainstormRes.json();
        setResult(brainstormData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadBrainstorm();
  }, [cardId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-neon-cyan mx-auto mb-4" />
          <p className="text-text-dim">Generating brainstorm ideas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">Error: {error}</p>
        <Button variant="secondary" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  if (!result) return null;

  const difficultyColors = {
    easy: 'text-neon-green bg-neon-green/10 border-neon-green/30',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    hard: 'text-red-400 bg-red-400/10 border-red-400/30',
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-neon-purple" />
          <h1 className="text-2xl font-heading font-bold text-white">Brainstorm Results</h1>
        </div>
        <p className="text-text-dim">
          Ideas inspired by: <span className="text-white">{extraction?.title || 'Your Project'}</span>
        </p>
      </header>

      {/* Related Projects */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Lightbulb className="w-5 h-5 text-neon-cyan" />
          <h2 className="text-xl font-heading font-bold text-white">Related Project Ideas</h2>
        </div>
        
        <div className="grid gap-4">
          {result.related_projects.map((project, i) => (
            <Card key={i} level={1} className="p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="text-lg font-medium text-white">{project.title}</h3>
                <span className={`px-2 py-0.5 rounded border text-xs font-bold uppercase ${difficultyColors[project.difficulty]}`}>
                  {project.difficulty}
                </span>
              </div>
              <p className="text-text-secondary text-sm mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.skills_gained.map((skill, j) => (
                  <span key={j} className="px-2 py-1 bg-surface-lvl2 rounded text-xs text-text-dim">
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Extension Ideas */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-neon-purple" />
          <h2 className="text-xl font-heading font-bold text-white">Extension Ideas</h2>
        </div>
        
        <div className="grid gap-4">
          {result.extension_ideas.map((ext, i) => (
            <Card key={i} level={1} className="p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="text-lg font-medium text-white">{ext.title}</h3>
                <ChevronRight className="w-5 h-5 text-text-dim" />
              </div>
              <p className="text-text-secondary text-sm mb-3">{ext.description}</p>
              <div className="bg-surface-lvl2/50 rounded p-3 border border-surface-overlay">
                <p className="text-xs text-text-dim uppercase font-bold mb-1">Implementation Hint</p>
                <p className="text-sm text-text-secondary">{ext.implementation_hint}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
