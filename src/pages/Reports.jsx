const db = globalThis.__B44_DB__ || {
  auth: { isAuthenticated: async () => false, me: async () => null },
  entities: new Proxy({}, { get: () => ({ filter: async () => [], get: async () => null, create: async () => ({}), update: async () => ({}), delete: async () => ({}) }) }),
  integrations: { Core: { UploadFile: async () => ({ file_url: '' }) } }
};

import { useState, useEffect } from "react";

import { format, parseISO, startOfMonth, subMonths, differenceInDays } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#00765B", "#51AE3A", "#1E3A5F", "#22C55E", "#EF4444", "#8B5CF6"];

export default function Reports() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.entities.Task.list("-entry_date", 1000).then(data => {
      setTasks(data);
      setLoading(false);
    });
  }, []);

  // Monthly created vs completed
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const label = format(d, "MMM yy");
    const ms = startOfMonth(d);
    const me = startOfMonth(subMonths(d, -1));
    const created = tasks.filter(t => t.entry_date && parseISO(t.entry_date) >= ms && parseISO(t.entry_date) < me).length;
    const done = tasks.filter(t => t.closure_date && parseISO(t.closure_date) >= ms && parseISO(t.closure_date) < me).length;
    return { label, created, done };
  });

  // Avg closure time
  const closedTasks = tasks.filter(t => t.status === "Completed" && t.entry_date && t.closure_date);
  const avgClosure = closedTasks.length > 0
    ? (closedTasks.reduce((sum, t) => sum + differenceInDays(parseISO(t.closure_date), parseISO(t.entry_date)), 0) / closedTasks.length).toFixed(1)
    : "—";

  // By employee
  const byEmp = {};
  tasks.forEach(t => { if (t.assigned_to) byEmp[t.assigned_to] = (byEmp[t.assigned_to] || 0) + 1; });
  const empData = Object.entries(byEmp).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  // By branch
  const byBranch = {};
  tasks.forEach(t => { if (t.branch) byBranch[t.branch] = (byBranch[t.branch] || 0) + 1; });
  const branchData = Object.entries(byBranch).map(([name, value]) => ({ name, value }));

  // By category
  const byCat = {};
  tasks.forEach(t => { if (t.category) byCat[t.category] = (byCat[t.category] || 0) + 1; });
  const catData = Object.entries(byCat).map(([name, value]) => ({ name, value }));

  // Status breakdown
  const byStatus = {};
  tasks.forEach(t => { byStatus[t.status] = (byStatus[t.status] || 0) + 1; });
  const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));

  if (loading) return <div className="p-8 text-center text-gray-400">Loading reports...</div>;

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Reports & Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Performance overview across all tasks</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Tasks", value: tasks.length, color: "text-[#1E3A5F]" },
          { label: "Completed", value: closedTasks.length, color: "text-green-600" },
          { label: "Avg Closure Time", value: `${avgClosure} days`, color: "text-blue-600" },
          { label: "Active Tasks", value: tasks.filter(t => !["Completed", "Cancelled"].includes(t.status)).length, color: "text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly trend */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Monthly Tasks — Created vs Completed</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="created" fill="#00765B" radius={[4, 4, 0, 0]} name="Created" />
            <Bar dataKey="done" fill="#51AE3A" radius={[4, 4, 0, 0]} name="Completed" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Employee & Branch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Tasks per Employee</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={empData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="count" fill="#00765B" radius={[0, 4, 4, 0]} name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Tasks per Branch</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={branchData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#51AE3A" radius={[4, 4, 0, 0]} name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Tasks by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={catData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top employees table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Employee Performance Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Employee</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Total</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Completed</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Active</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Completion %</th>
              </tr>
            </thead>
            <tbody>
              {empData.map(({ name }) => {
                const empTasks = tasks.filter(t => t.assigned_to === name);
                const done = empTasks.filter(t => t.status === "Completed").length;
                const active = empTasks.filter(t => !["Completed", "Cancelled"].includes(t.status)).length;
                const pct = empTasks.length > 0 ? Math.round((done / empTasks.length) * 100) : 0;
                return (
                  <tr key={name} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-700">{name}</td>
                    <td className="py-3 px-3 text-gray-600">{empTasks.length}</td>
                    <td className="py-3 px-3 text-green-600 font-medium">{done}</td>
                    <td className="py-3 px-3 text-blue-600">{active}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div className="bg-[#00765B] rounded-full h-1.5" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}