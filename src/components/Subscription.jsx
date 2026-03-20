import React, { useState, useEffect } from 'react';
import { Check, CreditCard, Loader2, Zap } from 'lucide-react';
import { supabase } from '../supabase';

// Change the function definition to accept 'session' as a prop
export default function Subscription({ session }) { 
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    // Only fetch if we have a valid user from the session prop
    if (session?.user?.id) {
      fetchProfile(session.user.id);
    }
  }, [session]);

  const fetchProfile = async (userId) => {
  // SAFETY CHECK: If userId is missing or is the string "undefined", stop immediately.
  if (!userId || userId === 'undefined') {
    console.log("Waiting for valid User ID...");
    return;
  }

try {
    const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

    if (error) throw error;
    setProfile(data);
} catch (error) {
    console.error('Error fetching profile:', error.message);
} finally {
    setLoading(false);
}
};
    const handleSubscribe = async () => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Simulating Stripe Checkout Delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update the user's profile to active
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'active' })
        .eq('id', user.id);

      if (error) throw error;
      
      // Refresh the UI
      await fetchProfile();
      alert(`Success! You are now subscribed to the ${billingCycle} plan.`);
    } catch (error) {
      console.error('Subscription failed:', error.message);
      alert('Error updating subscription. Check console.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription?")) return;
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'inactive' })
        .eq('id', user.id);

      if (error) throw error;
      await fetchProfile();
    } catch (error) {
      console.error('Cancellation failed:', error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Active Subscription View
  if (profile?.subscription_status === 'active') {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Subscription Active</h2>
            <p className="text-slate-400">You have full access to the platform and prize draws.</p>
          </div>
        </div>
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 mb-6 flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-400 mb-1">Current Plan</p>
            <p className="text-lg font-semibold text-white">ImpactDrive Premium</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400 mb-1">Status</p>
            <p className="text-emerald-400 font-medium tracking-wide">Good Standing</p>
          </div>
        </div>
        <button 
          onClick={handleCancel}
          disabled={processing}
          className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors"
        >
          {processing ? 'Processing...' : 'Cancel Subscription'}
        </button>
      </div>
    );
  }

  // Inactive / Pricing View
  return (
    <div className="max-w-4xl mx-auto mt-10">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-4">Choose Your Impact</h2>
        <p className="text-slate-400">Unlock the rolling 5-score system, enter monthly draws, and support your charity.</p>
        
        <div className="flex items-center justify-center gap-4 mt-8">
          <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white font-bold' : 'text-slate-400'}`}>Monthly</span>
          <button 
            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
            className="w-14 h-7 bg-indigo-600 rounded-full flex items-center px-1 transition-all"
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-all ${billingCycle === 'yearly' ? 'translate-x-7' : ''}`} />
          </button>
          <span className={`text-sm flex items-center gap-2 ${billingCycle === 'yearly' ? 'text-white font-bold' : 'text-slate-400'}`}>
            Yearly <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Save 20%</span>
          </span>
        </div>
      </div>

      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-indigo-500/10 max-w-md mx-auto">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
        
        <Zap className="w-8 h-8 text-indigo-400 mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Premium Member</h3>
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-4xl font-extrabold text-white">
            ${billingCycle === 'monthly' ? '29' : '279'}
          </span>
          <span className="text-slate-400">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
        </div>

        <ul className="space-y-4 mb-8">
          {['Access to the rolling 5-score algorithm', 'Automatic entry into monthly prize pools', 'Minimum 10% goes to your chosen charity', 'Premium support & verified winner badge'].map((feature, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-300">
              <Check className="w-5 h-5 text-indigo-400 shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <button 
          onClick={handleSubscribe}
          disabled={processing}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition-all"
        >
          {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
          {processing ? 'Processing...' : `Subscribe ${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}`}
        </button>
      </div>
    </div>
  );
}