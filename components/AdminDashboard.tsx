import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, AlertTriangle, TrendingUp, DollarSign, Activity } from 'lucide-react';

const mockChurnData = [
  { name: 'Jan', value: 2 },
  { name: 'Feb', value: 3 },
  { name: 'Mar', value: 1 },
  { name: 'Apr', value: 4 },
  { name: 'May', value: 2 },
  { name: 'Jun', value: 1 },
];

const mockRevenueData = [
  { name: 'Jan', value: 25000 },
  { name: 'Feb', value: 32000 },
  { name: 'Mar', value: 45000 },
  { name: 'Apr', value: 42000 },
  { name: 'May', value: 55000 },
  { name: 'Jun', value: 68000 },
];

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">Admin Overview</h1>
           <p className="text-slate-500 mt-1">Platform performance and subscription metrics.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-100">
           <Activity className="w-4 h-4" /> System Operational
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total MRR', value: '₱68,000', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+15% vs last mo' },
          { label: 'Active SMEs', value: '142', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+8 new this week' },
          { label: 'Churn Rate', value: '1.2%', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'Stable' },
          { label: 'Generations', value: '12.5k', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+24% usage' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
               <div className={`p-3 rounded-xl ${stat.bg}`}>
                 <stat.icon className={`w-6 h-6 ${stat.color}`} />
               </div>
               <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">KPI</span>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800">{stat.value}</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">{stat.label}</p>
              <p className="text-xs text-emerald-600 mt-2 font-medium">{stat.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-2 h-6 bg-emerald-500 rounded-full"></div> Revenue Growth (PHP)
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockRevenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-2 h-6 bg-rose-500 rounded-full"></div> Monthly Churn
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChurnData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Recent Subscription Activity</h3>
          <button className="text-sm text-emerald-600 font-medium hover:bg-emerald-50 px-3 py-1 rounded-lg transition">Export CSV</button>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {[
              { client: "Kapeng Barako Co.", plan: "Pro", status: "Active", date: "Just now" },
              { client: "Manila Chic", plan: "Starter", status: "Active", date: "2 hours ago" },
              { client: "Tito's Gadgets", plan: "Pro", status: "Churned", date: "Yesterday" },
              { client: "Lola's Kitchen", plan: "Starter", status: "Active", date: "Yesterday" },
              { client: "Juan's Carwash", plan: "Pro", status: "Active", date: "2 days ago" },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/80 transition">
                <td className="px-6 py-4 font-bold text-slate-800">{row.client}</td>
                <td className="px-6 py-4 text-slate-600">{row.plan}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    row.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400">{row.date}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-emerald-600 font-medium">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
