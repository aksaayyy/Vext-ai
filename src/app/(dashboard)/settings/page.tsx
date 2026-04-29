import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Shield, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  return (
    <>
      <header className="mb-12">
        <h1 className="text-3xl font-heading font-bold mb-1 text-white">Account Settings</h1>
        <p className="text-text-dim text-sm">Manage your profile, security, and notification preferences.</p>
      </header>

      <div className="max-w-4xl space-y-12">
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
