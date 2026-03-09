import { db } from "../firebase";
import { collection, getDocs, addDoc, query, orderBy, limit, doc, deleteDoc, updateDoc } from "firebase/firestore";

import { useState, useEffect } from "react";

import { Search, Plus, X, ChevronRight, Clock, CheckCircle2, Upload, Trash2 } from "lucide-react";
import ClientImport from "@/components/clients/ClientImport.jsx";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format, parseISO } from "date-fns";
import ClientForm from "@/components/clients/ClientForm.jsx";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(true);

const load = async () => {
    setLoading(true);
    try {
      // Fetch both collections simultaneously
      const [clientSnap, taskSnap] = await Promise.all([
        getDocs(query(collection(db, "clients"), orderBy("client_name"))),
        getDocs(query(collection(db, "tasks"), orderBy("entry_date", "desc")))
      ]);

      setClients(clientSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTasks(taskSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error loading client data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = search.length >= 1
    ? clients.filter(c =>
        c.client_name.toLowerCase().includes(search.toLowerCase()) ||
        c.client_code.toLowerCase().includes(search.toLowerCase()) ||
        c.rm_assigned?.toLowerCase().includes(search.toLowerCase())
      )
    : clients;

  const clientTasks = selected ? tasks.filter(t => t.client_code === selected.client_code) : [];

const handleDelete = async (client) => {
    if (!window.confirm(`Delete "${client.client_name}" permanently? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "clients", client.id));
      if (selected?.id === client.id) setSelected(null);
      load();
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };
  const handleSave = async (data) => {
    try {
      if (data.id) {
        // Update existing client
        const clientRef = doc(db, "clients", data.id);
        await updateDoc(clientRef, data);
      } else {
        // Create new client
        // First check for duplicate code locally
        const existing = clients.find(c => c.client_code === data.client_code);
        if (existing) { 
          alert("Client code already exists!"); 
          return; 
        }
        await addDoc(collection(db, "clients"), {
          ...data,
          created_at: new Date()
        });
      }
      setShowForm(false);
      load(); // Reload the client list from Firebase
    } catch (error) {
      console.error("Error saving client:", error);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Client Master</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} clients registered</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(v => !v)} className="border-[#00765B] text-[#00765B] hover:bg-green-50 rounded-xl gap-2">
            <Upload className="w-4 h-4" /> Import Excel
          </Button>
          <Button onClick={() => { setSelected(null); setShowForm(true); }} className="bg-[#00765B] hover:bg-[#005c46] text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Add Client
          </Button>
        </div>
      </div>

      {showImport && (
        <ClientImport onImportDone={() => { load(); setShowImport(false); }} onClose={() => setShowImport(false)} />
      )}

      {showForm && (
        <ClientForm
          client={selected}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client list */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input className="pl-9" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 max-h-[600px]">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No clients found</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-blue-50/50 transition-colors flex items-center gap-3 ${selected?.id === c.id ? "bg-blue-50" : ""}`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#1E3A5F] text-sm font-bold">{c.client_name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{c.client_name}</p>
                    <p className="text-xs text-gray-400">{c.client_code} · {c.branch}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Client detail */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex items-center justify-center text-gray-400 min-h-[400px]">
              <div className="text-center">
                <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a client to view details</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#1E3A5F] flex items-center justify-center">
                      <span className="text-white text-xl font-bold">{selected.client_name[0]}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{selected.client_name}</h2>
                      <p className="text-sm text-gray-400">{selected.client_code} · {selected.branch}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowForm(true)} className="text-xs text-[#00765B] hover:underline font-medium">Edit</button>
                    <button onClick={() => handleDelete(selected)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  {[
                    ["RM Assigned", selected.rm_assigned],
                    ["Phone", selected.phone],
                    ["Email", selected.email],
                    ["PAN", selected.pan],
                    ["Branch", selected.branch],
                  ].map(([k, v]) => v && (
                    <div key={k}>
                      <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                      <p className="font-medium text-gray-700">{v}</p>
                    </div>
                  ))}
                </div>
                {selected.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">{selected.notes}</div>
                )}
              </div>

              {/* Activity timeline */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Activity Timeline ({clientTasks.length} tasks)</h3>
                {clientTasks.length === 0 ? (
                  <p className="text-sm text-gray-400">No tasks for this client yet.</p>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {clientTasks.map(t => (
                      <div key={t.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${t.status === "Completed" ? "bg-green-400" : t.status === "Cancelled" ? "bg-gray-300" : "bg-blue-400"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-semibold text-[#1E3A5F]">{t.task_id}</span>
                            <span className="text-xs text-gray-700 font-medium">{t.action}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{t.status}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {t.entry_date && format(parseISO(t.entry_date), "dd MMM yyyy")} · {t.assigned_to}
                            {t.closure_date && ` · Closed: ${format(parseISO(t.closure_date), "dd MMM yyyy")}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}