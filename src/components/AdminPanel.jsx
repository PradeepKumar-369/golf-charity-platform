import React, { useState, useEffect } from 'react';
import { Users, Trophy, Play, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../supabase';

export default function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [runningDraw, setRunningDraw] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, activeSubs: 0, eligibleForDraw: 0, eligibleList: [] });
  const [latestWinner, setLatestWinner] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // 1. Fetch all profiles
      const { data: profiles, error: profError } = await supabase.from('profiles').select('*');
      if (profError) throw profError;

      // 2. Fetch all scores
      const { data: scores, error: scoreError } = await supabase.from('scores').select('user_id');
      if (scoreError) throw scoreError;

      // 3. Fetch latest draw
      const { data: draws } = await supabase.from('draws').select('*').order('draw_date', { ascending: false }).limit(1);

      const activeUsers = profiles.filter(p => p.subscription_status === 'active');
      const usersWithScores = new Set(scores.map(s => s.user_id));
      const eligibleUsers = activeUsers.filter(p => usersWithScores.has(p.id));

      setStats({
        totalUsers: profiles.length,
        activeSubs: activeUsers.length,
        eligibleForDraw: eligibleUsers.length,
        eligibleList: eligibleUsers
      });

      if (draws && draws.length > 0) setLatestWinner(draws[0]);
    } catch (error) {
      console.error('Admin Fetch Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const executeDraw = async () => {
    if (stats.eligibleForDraw === 0) return alert("No eligible users!");
    if (!window.confirm("Execute the Monthly Draw?")) return;
    
    setRunningDraw(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const winner = stats.eligibleList[Math.floor(Math.random() * stats.eligibleList.length)];

      const { error } = await supabase.from('draws').insert([{
        winner_id: winner.id,
        prize_pool: 1500.00
      }]);

      if (error) throw error;
      alert("Winner Selected!");
      await fetchAdminData();
    } catch (error) {
      alert("Draw failed: " + error.message);
    } finally {
      setRunningDraw(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Center</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-slate-400 text-sm">Total Players</p>
          <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-slate-400 text-sm">Active Subs</p>
          <p className="text-3xl font-bold text-emerald-400">{stats.activeSubs}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl border-l-4 border-l-indigo-500">
          <p className="text-slate-400 text-sm">Eligible Now</p>
          <p className="text-3xl font-bold text-indigo-400">{stats.eligibleForDraw}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Draw Execution Card */}
        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 h-full">
          <h2 className="text-xl font-bold text-white mb-4">Run Prize Draw</h2>
          <p className="text-slate-400 text-sm mb-6">This will select one random winner from the pool of eligible players.</p>
          <button 
            onClick={executeDraw}
            disabled={runningDraw || stats.eligibleForDraw === 0}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all"
          >
            {runningDraw ? <Loader2 className="animate-spin" /> : <Play className="fill-white" />}
            {runningDraw ? 'Selecting Winner...' : 'Execute Draw'}
          </button>
        </div>

        {/* Latest Result Card - THIS FIXES THE UNUSED VAR ERROR */}
        <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 h-full">
          <h2 className="text-xl font-bold text-white mb-4">Latest Draw Result</h2>
          {latestWinner ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-xl border border-emerald-500/20">
                <Trophy className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Winner ID</p>
                  <p className="text-white font-mono">{latestWinner.winner_id.substring(0, 12)}...</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Prize Pool</p>
                  <p className="text-white font-bold">${latestWinner.prize_pool}</p>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Draw Date</p>
                  <p className="text-white font-bold">{new Date(latestWinner.draw_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-600 border border-dashed border-slate-800 rounded-xl">
              <p>No draw history found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}