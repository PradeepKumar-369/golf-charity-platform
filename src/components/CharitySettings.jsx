import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Check, Loader2, Globe, Shield, Zap } from 'lucide-react';
import { supabase } from '../supabase';

const CHARITIES = [
  { id: 'clean-oceans', name: 'Clean Oceans Initiative', icon: Globe, color: 'text-blue-400', desc: 'Removing plastic waste from our coastlines.' },
  { id: 'mental-health', name: 'Mind Matters', icon: Shield, color: 'text-purple-400', desc: 'Providing free counseling for those in need.' },
  { id: 'reforest', name: 'Green Canopy', icon: Zap, color: 'text-emerald-400', desc: 'Planting native trees to combat deforestation.' },
  { id: 'global-relief', name: 'Global Relief Fund', icon: Heart, color: 'text-rose-400', desc: 'Emergency medical aid in crisis zones.' }
];

export default function CharitySettings({ session }) {
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Wrapped in useCallback to fix the dependency warning
  const fetchCurrentCharity = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('selected_charity')
        .eq('id', session.user.id)
        .single();
        
      if (data?.selected_charity) setSelected(data.selected_charity);
    } catch (err) {
      console.error("Error loading charity:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // 2. useEffect now safely includes the function in the dependency array
  useEffect(() => {
    fetchCurrentCharity();
  }, [fetchCurrentCharity]);


  const handleSave = async (charityName) => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ selected_charity: charityName })
      .eq('id', session.user.id);

    if (!error) {
      setSelected(charityName);
      alert("Charity preference updated!");
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-white mb-3">Charitable Impact</h1>
        <p className="text-slate-400">Choose where your 10% subscription contribution is donated each month.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CHARITIES.map((charity) => {
          const Icon = charity.icon;
          const isSelected = selected === charity.name;
          
          return (
            <button
              key={charity.id}
              onClick={() => handleSave(charity.name)}
              disabled={saving}
              className={`p-6 rounded-2xl border text-left transition-all relative group ${
                isSelected 
                ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/10' 
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-slate-800 ${charity.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                {isSelected && <div className="bg-indigo-500 p-1 rounded-full"><Check className="w-4 h-4 text-white" /></div>}
              </div>
              <h3 className="text-white font-bold text-lg mb-1">{charity.name}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{charity.desc}</p>
              
              {saving && isSelected && (
                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center rounded-2xl">
                  <Loader2 className="animate-spin text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-12 p-8 bg-slate-800/50 rounded-3xl border border-slate-700 border-dashed text-center">
        <Heart className="w-10 h-10 text-rose-500 mx-auto mb-4" />
        <h3 className="text-white font-bold">100% Transparency</h3>
        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
          We aggregate all player choices and distribute funds on the 1st of every month. 
          You will receive a donation receipt via email once the transfer is complete.
        </p>
      </div>
    </div>
  );
}