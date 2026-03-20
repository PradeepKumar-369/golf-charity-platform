import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trophy, Activity, Heart, Loader2 } from 'lucide-react';
import { supabase } from './supabase'; // Connects to your REAL Supabase database!
import DrawsView from './components/DrawsView';
// Import the Subscription component we just built
import Subscription from './components/Subscription';
import AdminPanel from './components/AdminPanel';
import CharitySettings from './components/CharitySettings';


// ----------------------------------------
// 1. AUTHENTICATION COMPONENT
// ----------------------------------------
function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Account created! Please verify your email if required, or log in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 animate-in fade-in duration-500">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </h2>
        <p className="text-slate-400 text-center mb-8">
          {isSignUp ? 'Sign up to start tracking your scores.' : 'Sign in to access your dashboard.'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex justify-center items-center transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
          >
            {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------
// 2. DASHBOARD COMPONENT
// ----------------------------------------
function Dashboard({ session }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingScore, setAddingScore] = useState(false);
  const [newScore, setNewScore] = useState('');

  // Since App.jsx already verified the session, we just use it directly!
  useEffect(() => {
    if (session?.user) {
      fetchScores(session.user.id);
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchScores = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', userId)
        .order('date_played', { ascending: false })
        .limit(5);

      if (error) throw error;
      setScores(data || []);
    } catch (error) {
      console.error('Error fetching scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddScore = async (e) => {
  e.preventDefault();
  const scoreVal = parseInt(newScore);
  if (isNaN(scoreVal) || scoreVal < 1 || scoreVal > 45) {
    return alert("Score must be a number between 1 and 45.");
  }
  
  setAddingScore(true);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not found");

    // 1. Insert the new score
    const { error: insertError } = await supabase
      .from('scores')
      .insert([{ 
        user_id: user.id, 
        score: scoreVal, 
        date_played: new Date().toISOString() 
      }]);

    if (insertError) throw insertError;

    // 2. Wait a split second for the DB to index the new row
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Get ALL scores for this user to find out which ones are "extra"
    const { data: allScores } = await supabase
      .from('scores')
      .select('id')
      .eq('user_id', user.id)
      .order('date_played', { ascending: false });

    // 4. If we have more than 5, delete the oldest ones
    if (allScores && allScores.length > 5) {
      const idsToDelete = allScores.slice(5).map(s => s.id);
      
      // Delete all old ones in one go
      const { error: delError } = await supabase
        .from('scores')
        .delete()
        .in('id', idsToDelete);
        
      if (delError) console.error("Cleanup error:", delError);
    }

    // 5. CLEAR input and REFRESH the UI
    setNewScore('');
    await fetchScores(user.id);
    
  } catch (error) {
    alert(`Failed: ${error.message}`);
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
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Performance Log</h2>
                <p className="text-slate-400 text-sm">Your last 5 Stableford scores. The oldest drops off automatically.</p>
              </div>
            </div>
            
            <form onSubmit={handleAddScore} className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
              <input 
                type="number" 
                min="1" 
                max="45" 
                required
                value={newScore}
                onChange={(e) => setNewScore(e.target.value)}
                placeholder="Enter score (1-45)"
                className="flex-1 bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <button 
                type="submit" 
                disabled={addingScore || !newScore}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingScore ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} Add
              </button>
            </form>

            <div className="space-y-3">
              {scores.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-slate-700 rounded-xl bg-slate-800/50 text-slate-400">
                  <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>No scores logged yet.</p>
                  <p className="text-sm">Enter your first Stableford score above!</p>
                </div>
              ) : (
                scores.map((score, idx) => (
                  <div key={score.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${idx === 0 ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${idx === 0 ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-slate-800 text-slate-300'}`}>
                        {score.score}
                      </div>
                      <div>
                        <p className="text-white font-medium">Stableford Entry</p>
                        <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" /> {new Date(score.date_played).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {idx === 0 && <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md">Latest</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-2">Charitable Impact</h2>
            <p className="text-slate-400 text-sm mb-6">Your selected cause and contribution.</p>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <Heart className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <span className="text-white font-medium block">Setup Required</span>
                <span className="text-slate-500 text-xs">Select a charity in settings</span>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Participation Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-slate-900 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">Total Winnings</span>
                </div>
                <span className="text-white font-bold">$0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------
// 3. MAIN APP COMPONENT (WITH NAVIGATION)
// ----------------------------------------
export default function App() {
  const [session, setSession] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // Tracks which page to show

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      
      {/* Top Navigation Bar */}
      <nav className="bg-slate-900 border-b border-slate-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-4">
            {['dashboard', 'subscription', 'draws', 'admin', 'settings'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setCurrentView(tab)}
                className={`capitalize px-4 py-2 rounded-lg font-medium transition-all ${
                  currentView === tab 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Rendered Based on Menu Click */}
      <main className="transition-all duration-300">
        {currentView === 'settings' && <CharitySettings session={session} />}
        {currentView === 'dashboard' && <Dashboard session={session} />}
        {currentView === 'subscription' && <Subscription session={session} />}
        {currentView === 'draws' && <DrawsView />}
        
        {/* THIS IS THE MISSING PIECE: */}
        {currentView === 'admin' && <AdminPanel />}
      </main>

    </div>
  );
}