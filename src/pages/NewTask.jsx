import { db } from "../firebase";
import { collection, getDocs, addDoc, query, orderBy, limit, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { useState, useEffect, useRef } from "react"; // Ensure useEffect is here


import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Search, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = ["Transaction", "Service", "Compliance", "Investment"];
const CHANNELS = ["Call", "WhatsApp", "Email", "Meeting"];
const PRIORITIES = ["High", "Medium", "Low"];
const ACTIONS = [
  "SIP Registration", "SIP Modification", "SIP Cancellation",
  "Redemption", "Portfolio Review", "Insurance Renewal",
  "NFO Application", "Lump Sum Purchase", "Switch",
  "KYC Update", "Nomination Update", "Bank Mandate",
  "Account Statement", "Capital Gains Statement", "Other"
];

function getFinancialYear() {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function getFYShort() {
  const fy = getFinancialYear();
  return fy.split("-")[1].slice(2);
}

export default function NewTask() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [clientQuery, setClientQuery] = useState("");
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const suggestRef = useRef(null);

  const [form, setForm] = useState({
    entry_date: format(new Date(), "yyyy-MM-dd"),
    client_name: "",
    client_code: "",
    rm_assigned: "",
    branch: "",
    category: "Service",
    action: "",
    product_name: "",
    notes: "",
    amount: "",
    priority: "Medium",
    assigned_to: "",
    follow_up_date: "",
    channel: "Call",
    status: "Pending",
    financial_year: getFinancialYear(),
  });

useEffect(() => {
    const fetchInitialData = async () => {
        try {
            // Fetch Clients and Team Members from Firebase
            const [clientSnap, teamSnap] = await Promise.all([
                getDocs(collection(db, "clients")),
                getDocs(collection(db, "users"))
            ]);
            setClients(clientSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setTeamMembers(teamSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error loading data:", error);
        }
    };
    fetchInitialData();
}, []);
  useEffect(() => {
    if (clientQuery.length >= 3) {
      const q = clientQuery.toLowerCase();
      setClientSuggestions(
        clients.filter(c =>
          c.client_name.toLowerCase().includes(q) ||
          c.client_code.toLowerCase().includes(q)
        ).slice(0, 8)
      );
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [clientQuery, clients]);

  const selectClient = (c) => {
    setClientQuery(c.client_name);
    setForm(f => ({
      ...f,
      client_name: c.client_name,
      client_code: c.client_code,
      rm_assigned: c.rm_assigned || "",
      branch: c.branch || "",
    }));
    setShowSuggestions(false);
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Get the current count to create a serial number
      const q = query(collection(db, "tasks"), orderBy("serial_number", "desc"), limit(1));
      const querySnapshot = await getDocs(q);
      const lastTask = querySnapshot.docs[0]?.data();
      
      const serial = (lastTask?.serial_number || 0) + 1;
      const fy = getFYShort();
      const task_id = `FW-${fy}-${String(serial).padStart(4, "0")}`;

      // 2. Save to Firebase
      await addDoc(collection(db, "tasks"), {
        ...form,
        amount: form.amount ? parseFloat(form.amount) : 0,
        serial_number: serial,
        task_id,
        created_at: new Date()
      });

      setSaved(true);
      setTimeout(() => navigate(createPageUrl("LiveTasks")), 1200);
    } catch (error) {
      console.error("Error creating task:", error);
      setSaving(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <p className="text-lg font-semibold text-gray-700">Task Created Successfully!</p>
        <p className="text-sm text-gray-400">Redirecting to Live Tasks...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">New Task</h1>
        <p className="text-gray-500 text-sm mt-1">Create a new client service task</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">

        {/* Section: Client Info */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Client Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Client search */}
            <div className="relative sm:col-span-2" ref={suggestRef}>
              <Label className="text-xs text-gray-500 mb-1 block">Client Name *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="Type 3+ letters to search clients..."
                  value={clientQuery}
                  onChange={e => setClientQuery(e.target.value)}
                  required={!form.client_name}
                />
              </div>
              {showSuggestions && clientSuggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  {clientSuggestions.map(c => (
                    <button key={c.id} type="button" onClick={() => selectClient(c)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 border-b last:border-0">
                      <div className="w-7 h-7 rounded-full bg-[#1E3A5F]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#1E3A5F] text-xs font-bold">{c.client_name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{c.client_name}</p>
                        <p className="text-xs text-gray-400">{c.client_code} · {c.branch}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Client Code</Label>
              <Input value={form.client_code} readOnly className="bg-gray-50 text-gray-500" placeholder="Auto-filled" />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">RM Assigned</Label>
              <Input value={form.rm_assigned} readOnly className="bg-gray-50 text-gray-500" placeholder="Auto-filled" />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Branch</Label>
              <Input value={form.branch} readOnly className="bg-gray-50 text-gray-500" placeholder="Auto-filled" />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Entry Date</Label>
              <Input type="date" value={form.entry_date} readOnly className="bg-gray-50 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Section: Task Details */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Task Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Category *</Label>
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Action *</Label>
              <Select value={form.action} onValueChange={v => set("action", v)} required>
                <SelectTrigger><SelectValue placeholder="Select action..." /></SelectTrigger>
                <SelectContent>{ACTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Product Name</Label>
              <Input placeholder="e.g. HDFC Top 100" value={form.product_name} onChange={e => set("product_name", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Amount (₹)</Label>
              <Input type="number" placeholder="Optional" value={form.amount} onChange={e => set("amount", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs text-gray-500 mb-1 block">Notes / Details</Label>
              <Textarea rows={3} placeholder="Additional notes..." value={form.notes} onChange={e => set("notes", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section: Assignment */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Assignment & Follow-up</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Priority *</Label>
              <Select value={form.priority} onValueChange={v => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Assigned To *</Label>
              <Select value={form.assigned_to} onValueChange={v => set("assigned_to", v)} required>
                <SelectTrigger><SelectValue placeholder="Select team member..." /></SelectTrigger>
<SelectContent>
  {teamMembers.length === 0 ? (
    <SelectItem value="loading" disabled>Loading team...</SelectItem>
  ) : (
    teamMembers.map(m => (
      <SelectItem key={m.id} value={m.full_name || "Unknown"}>
        {m.full_name || m.email}
      </SelectItem>
    ))
  )}
</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Follow-up Date *</Label>
              <Input type="date" value={form.follow_up_date} onChange={e => set("follow_up_date", e.target.value)} required />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Channel *</Label>
              <Select value={form.channel} onValueChange={v => set("channel", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CHANNELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={saving} className="bg-[#00765B] hover:bg-[#005c46] text-white px-8 h-11 rounded-xl">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : "Create Task"}
          </Button>
        </div>
      </form>
    </div>
  );
}