import { db } from "../firebase";
import { collection, getDocs, addDoc, query, orderBy, limit, doc, deleteDoc, updateDoc } from "firebase/firestore";

import { useState, useEffect } from "react";

import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  CheckCircle2, Clock, AlertTriangle, CalendarClock,
  TrendingUp, Users, Building2, ArrowRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { format, isToday, isPast, parseISO, differenceInDays, startOfMonth, subMonths } from "date-fns";

const COLORS = ["#00765B", "#51AE3A", "#1E3A5F", "#22C55E", "#EF4444"];

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetches all tasks from Firebase, ordered by entry date
        const q = query(collection(db, "tasks"), orderBy("entry_date", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setTasks(data);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const active = tasks.filter(t => !["Completed", "Cancelled"].includes(t.status));
  const completed = tasks.filter(t => t.status === "Completed");
  const overdue = active.filter(t => t.follow_up_date && isPast(parseISO(t.follow_up_date)) && !isToday(parseISO(t.follow_up_date)));
  const todayFollowups = active.filter(t => t.follow_up_date && isToday(parseISO(t.follow_up_date)));

  // Tasks by employee
  const byEmployee = {};
  tasks.forEach(t => {
    if (t.assigned_to) byEmployee[t.assigned_to] = (byEmployee[t.assigned_to] || 0) + 1;
  });
  const employeeData = Object.entries(byEmployee).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);

  // Tasks by branch
  const byBranch = {};
  tasks.forEach(t => { if (t.branch) byBranch[t.branch] = (byBranch[t.branch] || 0) + 1; });
  const branchData = Object.entries(byBranch).map(([name, value]) => ({ name, value }));

  // Tasks by category
  const byCat = {};
  tasks.forEach(t => { if (t.category) byCat[t.category] = (byCat[t.category] || 0) + 1; });
  const catData = Object.entries(byCat).map(([name, value]) => ({ name, value }));

  // Monthly trend (last 6 months)
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const label = format(d, "MMM");
    const monthStart = startOfMonth(d);
    const monthEnd = startOfMonth(subMonths(d, -1));
    const created = tasks.filter(t => {
      const ed = t.entry_date ? parseISO(t.entry_date) : null;
      return ed && ed >= monthStart && ed < monthEnd;
    }).length;
    const done = tasks.filter(t => {
      const cd = t.closure_date ? parseISO(t.closure_date) : null;
      return cd && cd >= monthStart && cd < monthEnd;
    }).length;
    return { label, created, done };
  });

  const stats = [
    { label: "Total Tasks", value: tasks.length, icon: TrendingUp, color: "bg-[#00765B]", text: "text-[#00765B]" },
    { label: "Completed", value: completed.length, icon: CheckCircle2, color: "bg-[#51AE3A]", text: "text-[#51AE3A]" },
    { label: "Pending / Active", value: active.length, icon: Clock, color: "bg-blue-500", text: "text-blue-600" },
    { label: "Overdue", value: overdue.length, icon: AlertTriangle, color: "bg-red-500", text: "text-red-600" },
    { label: "Today's Follow-ups", value: todayFollowups.length, icon: CalendarClock, color: "bg-amber-500", text: "text-amber-600" },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of all client service tasks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-xl ${s.color} bg-opacity-10 flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.text}`} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Monthly Task Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="created" stroke="#00765B" strokeWidth={2} name="Created" dot={false} />
              <Line type="monotone" dataKey="done" stroke="#22C55E" strokeWidth={2} name="Completed" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Team Productivity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={employeeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#00765B" radius={[0, 4, 4, 0]} name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Tasks by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 col-span-1 lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4">Branch Workload</h3>
          <ResponsiveContainer width="100%" height={200}>
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

      {/* Today's follow-ups */}
      {todayFollowups.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Today's Follow-ups</h3>
            <Link to={createPageUrl("LiveTasks")} className="text-xs text-[#2E86AB] hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {todayFollowups.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 flex-1">{t.task_id} — {t.client_name}</span>
                <span className="text-xs text-gray-500">{t.action}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{t.assigned_to}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}