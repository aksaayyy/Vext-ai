import { Navbar } from '@/components/ui/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Check, ShieldCheck, Zap, Infinity } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Starter',
      price: '$0',
      description: 'Perfect for exploring the engine.',
      icon: Zap,
      features: ['5 Extractions / mo', 'Standard Fidelity', 'Web Dashboard', 'Community Discord'],
      button: 'Start Free',
      variant: 'ghost'
    },
    {
      name: 'Pro',
      price: '$49',
      description: 'The standard for developers.',
      icon: ShieldCheck,
      features: ['100 Extractions / mo', 'High Fidelity Extraction', 'API & SDK Access', 'Priority Support', 'Custom Webhooks'],
      button: 'Get Pro',
      variant: 'primary',
      highlight: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For massive intelligence pipelines.',
      icon: Infinity,
      features: ['Unlimited Extractions', 'On-prem Deployment', 'White-labeling', 'SLA Guarantee', 'Dedicated Architect'],
      button: 'Contact Sales',
      variant: 'secondary'
    }
  ];

  return (
    <div className="min-h-screen bg-canvas pt-16">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-white mb-6">Simple, Atomic Pricing.</h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Pay for intelligence, not for features. Choose the plan that fits your execution scale.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`flex flex-col p-8 relative ${plan.highlight ? 'border border-neon-cyan/50 shadow-[0_0_40px_-10px_rgba(0,212,255,0.2)]' : 'border border-surface-overlay'}`}
              level={plan.highlight ? 2 : 1}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neon-cyan text-canvas px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <plan.icon className={`w-8 h-8 mb-4 ${plan.highlight ? 'text-neon-cyan' : 'text-text-dim'}`} />
                <h3 className="text-2xl font-heading font-bold text-white">{plan.name}</h3>
                <p className="text-sm text-text-dim mt-2">{plan.description}</p>
              </div>

              <div className="mb-8">
                <span className="text-5xl font-heading font-bold text-white">{plan.price}</span>
                {plan.price !== 'Custom' && <span className="text-text-dim ml-2">/ month</span>}
              </div>

              <div className="flex-1 mb-10">
                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-text-secondary">
                      <Check className="w-4 h-4 text-neon-green shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Button variant={plan.variant as any} className="w-full py-6">
                {plan.button}
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-24 text-center">
          <Card level={2} className="max-w-3xl mx-auto">
            <h3 className="text-xl font-heading font-bold text-white mb-4">Need a custom extraction volume?</h3>
            <p className="text-text-secondary mb-6 text-sm">
              We offer flexible pay-as-you-go credits for one-off massive projects. No subscription required.
            </p>
            <Button variant="ghost">Talk to our Team</Button>
          </Card>
        </div>
      </main>
    </div>
  );
}
