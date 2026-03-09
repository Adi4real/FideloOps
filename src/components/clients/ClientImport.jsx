import { useState } from "react";
// 1. Import your real Firebase config
import { db } from "../../firebase"; 
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where 
} from "firebase/firestore";

import { Upload, Download, X, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const TEMPLATE_HEADERS = ["Client Code", "Client Name", "RM Assigned", "Branch", "Notes"];
const TEMPLATE_EXAMPLE = ["FW-C001", "Rajesh Mehta", "Priya Sharma", "Mumbai", "HNI client"];

function downloadTemplate() {
  const rows = [TEMPLATE_HEADERS.join(","), TEMPLATE_EXAMPLE.join(",")];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "FideloWealth_Client_Import_Template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const HEADER_MAP = {
  "client code": "client_code",
  "client_code": "client_code",
  "client name": "client_name",
  "client_name": "client_name",
  "rm assigned": "rm_assigned",
  "rm_assigned": "rm_assigned",
  "branch": "branch",
  "notes": "notes",
};

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const rawHeaders = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
  const fields = rawHeaders.map(h => HEADER_MAP[h.toLowerCase()] || h.toLowerCase().replace(/\s+/g, "_"));

  return lines.slice(1)
    .map(line => {
      const values = line.split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
      const obj = {};
      fields.forEach((f, i) => { obj[f] = values[i] || ""; });
      return obj;
    })
    .filter(row => row.client_code || row.client_name);
}

export default function ClientImport({ onImportDone, onClose }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) return;
    setStatus("loading");
    setError("");

    let rows = [];
    const isCSV = file.name.toLowerCase().endsWith(".csv");

    if (isCSV) {
      const text = await file.text();
      rows = parseCSV(text);
    } else {
      // NOTE: For .xlsx support locally, you would need to install 'xlsx' via npm
      setStatus("error");
      setError("Currently only .csv files are supported for local import. Please save your Excel as a CSV.");
      return;
    }

    if (!rows.length) {
      setStatus("error");
      setError("No valid client records found. Use the template headers.");
      return;
    }

    try {
      let created = 0, updated = 0, failed = 0;

      // 2. Fetch existing clients from Firebase to check for duplicates
      const clientRef = collection(db, "clients");
      const existingSnap = await getDocs(clientRef);
      const existingMap = {};
      existingSnap.forEach(doc => {
        existingMap[doc.data().client_code] = { id: doc.id, ...doc.data() };
      });

      for (const row of rows) {
        if (!row.client_code || !row.client_name) { failed++; continue; }
        
        const clean = {
          client_code: String(row.client_code).trim(),
          client_name: String(row.client_name).trim(),
          rm_assigned: row.rm_assigned || "",
          branch: row.branch || "",
          notes: row.notes || "",
          imported_at: new Date()
        };

        if (existingMap[clean.client_code]) {
          // 3. Update existing document
          await updateDoc(doc(db, "clients", existingMap[clean.client_code].id), clean);
          updated++;
        } else {
          // 4. Create new document
          await addDoc(collection(db, "clients"), clean);
          created++;
        }
      }

      setResult({ created, updated, failed, total: rows.length });
      setStatus("done");
      onImportDone();
    } catch (err) {
      console.error("Import Error:", err);
      setStatus("error");
      setError("Database connection failed. Check your Firebase rules.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Import Clients (CSV)</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
        <Download className="w-4 h-4 text-[#00765B] mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">Step 1: Download CSV Template</p>
          <p className="text-xs text-gray-500 mt-1">Required: {TEMPLATE_HEADERS.slice(0,2).join(", ")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="border-[#00765B] text-[#00765B] hover:bg-green-50">
          Get Template
        </Button>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Step 2: Upload CSV File</p>
        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#00765B] transition-colors">
          <Upload className="w-6 h-6 text-gray-300 mb-1" />
          <span className="text-sm text-gray-400">{file ? file.name : "Select CSV file"}</span>
          <input type="file" className="hidden" accept=".csv" onChange={e => setFile(e.target.files[0])} />
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-600 border border-red-100">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {status === "done" && result && (
        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
          <CheckCircle2 className="w-5 h-5 text-[#00765B] mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-semibold">Import successful!</p>
            <p className="text-xs text-gray-500">{result.created} new · {result.updated} updated</p>
          </div>
        </div>
      )}

      {status !== "done" && (
        <div className="flex justify-end">
          <Button onClick={handleUpload} disabled={!file || status === "loading"} className="bg-[#00765B] hover:bg-[#005c46] text-white rounded-xl">
            {status === "loading" ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : "Start Import"}
          </Button>
        </div>
      )}
    </div>
  );
}