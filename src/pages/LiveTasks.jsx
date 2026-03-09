const db = globalThis.__B44_DB__ || {
  auth: { isAuthenticated: async () => false, me: async () => null },
  entities: new Proxy({}, { get: () => ({ filter: async () => [], get: async () => null, create: async () => ({}), update: async () => ({}), delete: async () => ({}) }) }),
  integrations: { Core: { UploadFile: async () => ({ file_url: '' }) } }
};

import { useState, useEffect } from "react";

import { format, isToday, isPast, parseISO, differenceInDays } from "date-fns";
import { AlertTriangle, Clock, CalendarCheck, Search, Filter, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TaskRow from "@/components/tasks/TaskRow.jsx";

const STATUSES = ["Pending", "Under Process", "Waiting Client"];
const ALL_STATUSES = ["Pending", "Under Process", "Waiting Client", "Completed", "Cancelled"];

export default function LiveTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAssigned, setFilterAssigned] = useState("all");

  const loadTasks = () => {
    setLoading(true);
    db.entities.Task.list("-follow_up_date", 500).then(data => {
      setTasks(data);
      setLoading(false);
    });
  };

  useEffect(() => { loadTasks(); }, []);

  const handleStatusChange = async (task, newStatus) => {
    const update = { status: newStatus };
    if (newStatus === "Completed") {
      update.closure_date = format(new Date(), "yyyy-MM-dd");
    }
    await db.entities.Task.update(task.id, update);
    loadTasks();
  };

  const handleNotesUpdate = async (task, reviewer_notes) => {
    await db.entities.Task.update(task.id, { reviewer_notes });
    loadTasks();
  };

  const handleDelete = async (task) => {
    await db.entities.Task.delete(task.id);
    loadTasks();
  };

  const getAgeing = (task) => {
    if (task.status === "Completed" && task.closure_date && task.entry_date) {
      return differenceInDays(parseISO(task.closure_date), parseISO(task.entry_date));
    }
    if (task.entry_date) {
      return differenceInDays(new Date(), parseISO(task.entry_date));
    }
    return 0;
  };

  const getUrgency = (task) => {
    if (!task.follow_up_date) return 2;
    const d = parseISO(task.follow_up_date);
    if (isPast(d) && !isToday(d)) return 0; // overdue
    if (isToday(d)) return 1; // today
    return 2; // future
  };

  let filtered = tasks.filter(t => {
    if (filterStatus === "active") return STATUSES.includes(t.status);
    if (filterStatus !== "all") return t.status === filterStatus;
    return true;
  });

  if (filterPriority !== "all") filtered = filtered.filter(t => t.priority === filterPriority);
  if (filterAssigned !== "all") filtered = filtered.filter(t => t.assigned_to === filterAssigned);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(t =>
      t.task_id?.toLowerCase().includes(q) ||
      t.client_name?.toLowerCase().includes(q) ||
      t.action?.toLowerCase().includes(q) ||
      t.assigned_to?.toLowerCase().includes(q)
    );
  }

  // Sort: overdue → today → future
  filtered.sort((a, b) => getUrgency(a) - getUrgency(b));

  const overdue = filtered.filter(t => getUrgency(t) === 0);
  const today = filtered.filter(t => getUrgency(t) === 1);
  const future = filtered.filter(t => getUrgency(t) === 2);

  const assignees = [...new Set(tasks.map(t => t.assigned_to).filter(Boolean))];

  const groups = [
    { label: "Overdue", tasks: overdue, color: "text-red-600", bg: "bg-red-50 border-red-100", dot: "bg-red-500", icon: AlertTriangle },
    { label: "Today", tasks: today, color: "text-amber-600", bg: "bg-amber-50 border-amber-100", dot: "bg-amber-500", icon: Clock },
    { label: "Upcoming", tasks: future, color: "text-green-600", bg: "bg-green-50 border-green-100", dot: "bg-green-500", icon: CalendarCheck },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Live Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">Daily task tracker — {filtered.length} tasks</p>
        </div>
        <button onClick={loadTasks} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="all">All Statuses</SelectItem>
            {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {["High", "Medium", "Low"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterAssigned} onValueChange={setFilterAssigned}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Assigned To" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            {assignees.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading tasks...</div>
      ) : (
        <div className="space-y-8">
          {groups.map(({ label, tasks: grpTasks, color, bg, dot, icon: Icon }) => (
            grpTasks.length > 0 && (
              <div key={label}>
                <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl ${bg} border`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className={`text-sm font-semibold ${color}`}>{label}</span>
                  <span className={`ml-auto text-xs font-bold ${color}`}>{grpTasks.length}</span>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Task ID</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Client</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Work</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Assigned To</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Follow-up</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ageing</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {grpTasks.map(task => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            ageing={getAgeing(task)}
                            onStatusChange={handleStatusChange}
                            onNotesUpdate={handleNotesUpdate}
                            onDelete={handleDelete}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No tasks found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}