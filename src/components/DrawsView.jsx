import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, DollarSign, Timer, Loader2, Award } from 'lucide-react';
import { supabase } from '../supabase';

export default function DrawsView() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDraws = async () => {
        try {
            const { data, error } = await supabase
            .from('draws')
            .select('*') // Selecting all fields is safer if column names are shifting
            .order('draw_date', { ascending: false });

            if (error) throw error;
            
            // Fallback: If for some reason draw_date is missing, use created_at
            const sanitizedData = data.map(draw => ({
            ...draw,
            draw_date: draw.draw_date || draw.created_at || new Date().toISOString()
            }));

            setDraws(sanitizedData);
        } catch (err) {
            console.error("Error fetching draws:", err.message);
        } finally {
            setLoading(false);
        }
        };
    fetchDraws();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-in fade-in duration-700">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-white mb-4">Prize Draws</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Every month, one eligible player is selected by our algorithm to win the community prize pool. 
          Are you in the next draw?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Next Draw Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-indigo-100 font-bold uppercase tracking-widest text-sm mb-4">
              <Timer className="w-4 h-4" /> Next Draw In
            </div>
            <div className="text-5xl font-black text-white mb-6">12d : 04h : 19m</div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-indigo-100 text-sm">Estimated Prize Pool</p>
              <p className="text-3xl font-bold text-white">$1,450.00</p>
            </div>
          </div>
          <Trophy className="absolute -bottom-4 -right-4 w-48 h-48 text-white/10 rotate-12" />
        </div>

        {/* Eligibility Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col justify-center">
          <h3 className="text-xl font-bold text-white mb-4">Am I Eligible?</h3>
          <ul className="space-y-4">
            {[
              { label: "Active Subscription", status: true },
              { label: "Minimum 1 score logged this month", status: true },
              { label: "Account in good standing", status: true }
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.status ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                  {item.status && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                </div>
                <span className={item.status ? "text-slate-200" : "text-slate-500"}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Winners History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <Award className="w-6 h-6 text-indigo-400" />
          <h2 className="text-xl font-bold text-white">Winner History</h2>
        </div>
        
        {draws.length === 0 ? (
          <div className="p-20 text-center text-slate-500">No draws have been executed yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50">
                  <th className="p-6 text-slate-400 font-medium">Draw Date</th>
                  <th className="p-6 text-slate-400 font-medium">Winner ID</th>
                  <th className="p-6 text-slate-400 font-medium">Prize Amount</th>
                  <th className="p-6 text-slate-400 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {draws.map((draw) => (
                  <tr key={draw.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-6 text-white font-medium">
                      {new Date(draw.draw_date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </td>
                    <td className="p-6 text-slate-400 font-mono text-sm">
                      {draw.winner_id.substring(0, 8)}...
                    </td>
                    <td className="p-6 text-emerald-400 font-bold">
                      ${draw.prize_pool.toLocaleString()}
                    </td>
                    <td className="p-6 text-right">
                      <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20">
                        Paid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}