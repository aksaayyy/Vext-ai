'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Key, Copy, RefreshCw, Shield, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { createApiKey, revokeApiKey } from '@/lib/actions/keys';

interface ApiKeyListProps {
  initialKeys: any[];
}

export function ApiKeyList({ initialKeys }: ApiKeyListProps) {
  const [newKey, setNewKey] = useState<{ rawKey: string, name: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await createApiKey('Production Key');
      setNewKey(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="grid gap-8">
      {/* New Key Result Modal-like Overlay */}
      {newKey && (
        <Card className="border-2 border-neon-green bg-neon-green/[0.05] relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <CheckCircle2 className="w-6 h-6 text-neon-green" />
            <h3 className="text-xl font-heading font-bold text-white">API Key Generated</h3>
          </div>
          <p className="text-sm text-text-dim mb-6">
            Copy this key now. For your security, we won't show it again.
          </p>
          <div className="flex gap-4">
            <code className="flex-1 bg-canvas p-4 rounded border border-neon-green/30 text-neon-green font-code text-sm">
              {newKey.rawKey}
            </code>
            <Button onClick={() => handleCopy(newKey.rawKey)}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
          <Button variant="ghost" className="mt-4 text-[10px] uppercase tracking-widest" onClick={() => setNewKey(null)}>
            I've saved it
          </Button>
        </Card>
      )}

      {/* Security Alert */}
      {!newKey && (
        <div className="p-4 bg-neon-error/10 border border-neon-error/20 rounded-md flex gap-4 items-start">
          <AlertTriangle className="w-5 h-5 text-neon-error shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-neon-error uppercase tracking-wider mb-1">Security Recommendation</p>
            <p className="text-xs text-text-dim leading-relaxed">
              Your API keys carry full administrative privileges. Never share them in client-side code or public forums. 
            </p>
          </div>
        </div>
      )}

      {/* Action Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-heading font-bold text-white">Active Access Tokens</h2>
        <Button onClick={handleCreate} loading={loading}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Key
        </Button>
      </div>

      {/* Keys List */}
      <div className="grid gap-4">
        {initialKeys.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-surface-overlay rounded-md">
            <p className="text-text-dim italic">No active keys. Create one to begin integrating.</p>
          </div>
        ) : (
          initialKeys.map((key) => (
            <Card key={key.id} className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-md bg-surface-lvl2 border border-surface-overlay flex items-center justify-center">
                  <Shield className="w-6 h-6 text-neon-cyan" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-white">{key.name}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <code className="text-xs text-neon-cyan/70 bg-surface-lvl2 px-2 py-1 rounded">{key.keyPrefix}</code>
                    <span className="text-[10px] text-text-dim uppercase tracking-widest">Created {new Date(key.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right mr-4">
                  <p className="text-[10px] text-text-dim uppercase tracking-widest mb-1">Last Used</p>
                  <p className="text-xs text-text-secondary">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}</p>
                </div>
                <Button variant="ghost" size="sm" className="p-2 min-w-0 text-text-dim hover:text-neon-error hover:border-neon-error" onClick={() => revokeApiKey(key.id)}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
