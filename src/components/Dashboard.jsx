import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trophy, Activity, Heart, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

export default function Dashboard() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingScore, setAddingScore] = useState(false);
  const [newScore, setNewScore] = useState('');
  const [userId, setUserId] = useState(null);
  
  // NEW: State for the Participation Summary
  const [userStats, setUserStats] = useState({
    totalWinnings: 0,
    totalRounds: 0,
    charityAmount: 0,
    isEligible: false,
    selectedCharity: 'Not Selected'
  });

  useEffect(() => {
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchScores(user.id);
        fetchUserStats(user.id); // Load stats on start
      } else {
        setLoading(false);
      }
    };
    getInitialUser();
  }, []);

  // NEW: Function to calculate personal performance summary
  const fetchUserStats = async (uid) => {
    try {
      // 1. Get total winnings
      const { data: winnings } = await supabase
        .from('draws')
        .select('prize_pool')
        .eq('winner_id', uid);
      
      const totalWon = winnings?.reduce((acc, curr) => acc + Number(curr.prize_pool), 0) || 0;

      // 2. Get total lifetime rounds count
      const { count: roundsCount } = await supabase
        .from('scores')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid);

      // 3. Get profile for subscription and charity
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, selected_charity')
        .eq('id', uid)
        .single();

      // 4. Calculate Mock Charity Impact ($1.50 per round logged)
      const impact = profile?.subscription_status === 'active' ? (roundsCount * 1.50) : 0;

      setUserStats({
        totalWinnings: totalWon,
        totalRounds: roundsCount || 0,
        charityAmount: impact,
        isEligible: profile?.subscription_status === 'active' && (roundsCount > 0),
        selectedCharity: profile?.selected_charity || 'Not Selected'
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchScores = async (uid) => {
    try {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', uid)
        .order('date_played', { ascending: false })
        .limit(5);

      if (error) throw error;
      setScores(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddScore = async (e) => {
    e.preventDefault();
    const scoreVal = parseInt(newScore);
    if (isNaN(scoreVal)) return;

    setAddingScore(true);

    try {
      await supabase.from('scores').insert([{ 
        user_id: userId, 
        score: scoreVal, 
        date_played: new Date().toISOString() 
      }]);

      await new Promise(resolve => setTimeout(resolve, 500));

      setNewScore('');
      await fetchScores(userId);
      await fetchUserStats(userId); // Refresh stats after adding score

    } catch (err) {
      alert(err.message);
    } finally {
      setAddingScore(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-white">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Your Dashboard</h1>
          <p className="text-slate-400">Manage your performance, impact, and subscriptions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-2">Performance Log</h2>
            <p className="text-slate-400 text-sm mb-6">Last 5 scores. The 6th entry will remove the oldest.</p>
            
            <form onSubmit={handleAddScore} className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
              <input 
                type="number" 
                min="1" max="45" required
                value={newScore}
                onChange={(e) => setNewScore(e.target.value)}
                placeholder="Enter score (1-45)"
                className="flex-1 bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button 
                type="submit" 
                disabled={addingScore || !newScore}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {addingScore ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} Add
              </button>
            </form>

            <div className="space-y-3">
              {scores.length === 0 ? (
                <p className="text-slate-500 text-center py-10 border border-dashed border-slate-700 rounded-xl">No scores logged yet.</p>
              ) : (
                scores.map((score, idx) => (
                  <div key={score.id} className={`flex items-center justify-between p-4 rounded-xl border ${idx === 0 ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${idx === 0 ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {score.score}
                      </div>
                      <div>
                        <p className="text-white font-medium">Stableford Score</p>
                        <p className="text-slate-500 text-xs">{new Date(score.date_played).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {idx === 0 && <span className="text-[10px] font-bold text-indigo-400 uppercase bg-indigo-500/10 px-2 py-1 rounded">Latest</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Updated Right Column: Participation Summary */}
        <div className="space-y-8">
          {/* Eligibility Badge */}
          <div className={`p-6 rounded-2xl border ${userStats.isEligible ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${userStats.isEligible ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-white font-bold uppercase tracking-wider text-sm">
                {userStats.isEligible ? 'Eligible for Draw' : 'Ineligible'}
              </span>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Impact</h2>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 rounded-xl">
                <Heart className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <span className="text-slate-500 text-xs uppercase font-bold">Total Donated</span>
                <span className="text-2xl font-black text-white block">${userStats.charityAmount.toFixed(2)}</span>
                <span className="text-rose-400 text-[10px] font-bold uppercase">{userStats.selectedCharity}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="text-slate-300">Winnings</span>
                </div>
                <span className="text-white font-bold">${userStats.totalWinnings.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  <span className="text-slate-300">Total Rounds</span>
                </div>
                <span className="text-white font-bold">{userStats.totalRounds}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}