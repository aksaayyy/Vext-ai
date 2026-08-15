'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Shield, Trash2, Key, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface ApiKeys {
  groqApiKey: string;
  nvidiaApiKey: string;
  openrouterApiKey: string;
  instagramCookies: string;
}

interface VisibilityState {
  groqApiKey: boolean;
  nvidiaApiKey: boolean;
  openrouterApiKey: boolean;
  instagramCookies: boolean;
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKeys>({
    groqApiKey: '',
    nvidiaApiKey: '',
    openrouterApiKey: '',
    instagramCookies: '',
  });
  const [showKeys, setShowKeys] = useState<VisibilityState>({
    groqApiKey: false,
    nvidiaApiKey: false,
    openrouterApiKey: false,
    instagramCookies: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch('/api/user/keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keys),
      });

      if (!response.ok) {
        throw new Error('Failed to save API keys');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleShowKey = (provider: keyof ApiKeys) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    if (key.length < 12) return '••••••••••••';
    return key.slice(0, 6) + '••••••••' + key.slice(-4);
  };

  return (
    <>
      <header className="mb-12">
        <h1 className="text-3xl font-heading font-bold mb-1 text-white">Account Settings</h1>
        <p className="text-text-dim text-sm">Manage your profile, security, and notification preferences.</p>
      </header>

      <div className="max-w-4xl space-y-12">
        {/* Provider API Keys */}
        <section>
          <h3 className="text-xl font-heading font-bold text-white mb-6 flex items-center gap-3">
            <Key className="w-5 h-5 text-neon-cyan" />
            Provider API Keys
          </h3>
          <Card className="grid gap-6">
            <p className="text-sm text-text-dim">
              Add your own API keys to use with Vext. Your keys take priority over system keys.
              Keys are encrypted and stored securely.
            </p>

            {/* Groq */}
            <div>
              <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">
                Groq API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKeys.groqApiKey ? 'text' : 'password'}
                    value={keys.groqApiKey}
                    onChange={(e) => setKeys(prev => ({ ...prev, groqApiKey: e.target.value }))}
                    placeholder="gsk_..."
                    className="w-full bg-surface-lvl2 border border-surface-overlay rounded px-4 py-2 text-sm focus:border-neon-cyan/50 focus:outline-none text-text-secondary font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('groqApiKey')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-white"
                  >
                    {showKeys.groqApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-text-dim mt-1">Get your key at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">console.groq.com</a></p>
            </div>

            {/* NVIDIA */}
            <div>
              <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">
                NVIDIA API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKeys.nvidiaApiKey ? 'text' : 'password'}
                    value={keys.nvidiaApiKey}
                    onChange={(e) => setKeys(prev => ({ ...prev, nvidiaApiKey: e.target.value }))}
                    placeholder="nvapi-..."
                    className="w-full bg-surface-lvl2 border border-surface-overlay rounded px-4 py-2 text-sm focus:border-neon-cyan/50 focus:outline-none text-text-secondary font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('nvidiaApiKey')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-white"
                  >
                    {showKeys.nvidiaApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-text-dim mt-1">Get your key at <a href="https://ngc.nvidia.com" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">ngc.nvidia.com</a></p>
            </div>

            {/* OpenRouter */}
            <div>
              <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">
                OpenRouter API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKeys.openrouterApiKey ? 'text' : 'password'}
                    value={keys.openrouterApiKey}
                    onChange={(e) => setKeys(prev => ({ ...prev, openrouterApiKey: e.target.value }))}
                    placeholder="sk-or-..."
                    className="w-full bg-surface-lvl2 border border-surface-overlay rounded px-4 py-2 text-sm focus:border-neon-cyan/50 focus:outline-none text-text-secondary font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('openrouterApiKey')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-white"
                  >
                    {showKeys.openrouterApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-text-dim mt-1">Get your key at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">openrouter.ai</a></p>
            </div>

            {/* Instagram Cookies */}
            <div>
              <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">
                Instagram Cookies (Optional)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKeys.instagramCookies ? 'text' : 'password'}
                    value={keys.instagramCookies}
                    onChange={(e) => setKeys(prev => ({ ...prev, instagramCookies: e.target.value }))}
                    placeholder="sessionid=...; csrftoken=...; ds_user_id=..."
                    className="w-full bg-surface-lvl2 border border-surface-overlay rounded px-4 py-2 text-sm focus:border-neon-cyan/50 focus:outline-none text-text-secondary font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('instagramCookies')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-white"
                  >
                    {showKeys.instagramCookies ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-text-dim mt-1">
                Export cookies from browser (sessionid, csrftoken, ds_user_id, etc.) for private Instagram content.
                <a href="https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline ml-1">How to get cookies</a>
              </p>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {saved && (
              <div className="flex items-center gap-2 text-neon-green">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">API keys saved successfully</span>
              </div>
            )}

            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save API Keys
            </Button>
          </Card>
        </section>

        {/* Profile */}
        <section>
          <h3 className="text-xl font-heading font-bold text-white mb-6 flex items-center gap-3">
            <User className="w-5 h-5 text-neon-cyan" />
            Profile Information
          </h3>
          <Card className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">Full Name</label>
                <input type="text" defaultValue="Rohit Kumar" className="w-full bg-surface-lvl2 border border-surface-overlay rounded px-4 py-2 text-sm focus:border-neon-cyan/50 focus:outline-none text-text-secondary" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">Email Address</label>
                <input type="email" defaultValue="rohit@example.com" className="w-full bg-surface-lvl2 border border-surface-overlay rounded px-4 py-2 text-sm focus:border-neon-cyan/50 focus:outline-none text-text-secondary" />
              </div>
            </div>
            <Button size="sm" className="w-fit">Save Changes</Button>
          </Card>
        </section>

        {/* Security */}
        <section>
          <h3 className="text-xl font-heading font-bold text-white mb-6 flex items-center gap-3">
            <Shield className="w-5 h-5 text-neon-purple" />
            Security & Privacy
          </h3>
          <div className="grid gap-4">
            <Card level={2} className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Two-Factor Authentication</h4>
                <p className="text-xs text-text-dim">Add an extra layer of security to your account.</p>
              </div>
              <Button variant="secondary" size="sm">Enable</Button>
            </Card>
            <Card level={2} className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Change Password</h4>
                <p className="text-xs text-text-dim">Update your login credentials.</p>
              </div>
              <Button variant="ghost" size="sm">Update</Button>
            </Card>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="pt-12 border-t border-surface-overlay">
          <div className="flex items-center gap-3 mb-6">
            <Trash2 className="w-5 h-5 text-neon-error" />
            <h3 className="text-xl font-heading font-bold text-neon-error">Danger Zone</h3>
          </div>
          <Card className="border border-neon-error/20 bg-neon-error/[0.02]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Delete Account</h4>
                <p className="text-xs text-text-dim max-w-md">
                  Permanently delete your account, intelligence cards, and usage history. This action is irreversible.
                </p>
              </div>
              <Button variant="error" size="sm">Delete Account</Button>
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}
