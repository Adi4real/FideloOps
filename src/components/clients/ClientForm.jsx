import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ClientForm({ client, onSave, onClose }) {
  const [form, setForm] = useState(client || {
    client_code: "",
    client_name: "",
    rm_assigned: "",
    branch: "",
    phone: "",
    email: "",
    pan: "",
    notes: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">{client ? "Edit Client" : "Add New Client"}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { key: "client_code", label: "Client Code *", req: true, readOnly: !!client },
          { key: "client_name", label: "Client Name *", req: true },
          { key: "rm_assigned", label: "RM Assigned" },
          { key: "branch", label: "Branch" },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "pan", label: "PAN" },
        ].map(({ key, label, req, readOnly }) => (
          <div key={key}>
            <Label className="text-xs text-gray-500 mb-1 block">{label}</Label>
            <Input
              value={form[key] || ""}
              onChange={e => set(key, e.target.value)}
              required={req}
              readOnly={readOnly}
              className={readOnly ? "bg-gray-50 text-gray-500" : ""}
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <Label className="text-xs text-gray-500 mb-1 block">Notes</Label>
          <Textarea rows={2} value={form.notes || ""} onChange={e => set("notes", e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)} className="bg-[#1E3A5F] hover:bg-[#16304f] text-white rounded-xl">
          {client ? "Save Changes" : "Add Client"}
        </Button>
      </div>
    </div>
  );
}