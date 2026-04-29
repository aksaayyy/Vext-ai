import { ApiKeyList } from '@/components/ui/ApiKeyList';
import { getApiKeys } from '@/lib/actions/keys';
import { Card } from '@/components/ui/Card';

export default async function ApiKeysPage() {
  const initialKeys = await getApiKeys();

  return (
    <>
      <header className="mb-12">
        <h1 className="text-3xl font-heading font-bold mb-1 text-white">API Management</h1>
        <p className="text-text-dim text-sm">Manage your integration secrets and authentication layers.</p>
      </header>

      <ApiKeyList initialKeys={initialKeys} />

      {/* SDK Links */}
      <div className="grid md:grid-cols-2 gap-6 mt-12 pt-12 border-t border-surface-overlay">
        <Card level={2} className="border-l-4 border-l-neon-cyan">
          <h4 className="font-heading font-bold mb-2 text-white">Node.js SDK</h4>
          <p className="text-sm text-text-dim mb-4">Official library for server-side integration.</p>
          <code className="block p-3 bg-canvas rounded text-xs text-neon-cyan font-code">
            npm install @vext/sdk
          </code>
        </Card>
        <Card level={2} className="border-l-4 border-l-neon-purple">
          <h4 className="font-heading font-bold mb-2 text-white">Python Client</h4>
          <p className="text-sm text-text-dim mb-4">FastAPI and Django compatible wrapper.</p>
          <code className="block p-3 bg-canvas rounded text-xs text-neon-purple font-code">
            pip install vext-ai
          </code>
        </Card>
      </div>
    </>
  );
}
