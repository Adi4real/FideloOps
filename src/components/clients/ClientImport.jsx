const db = globalThis.__B44_DB__ || {
  auth: { isAuthenticated: async () => false, me: async () => null },
  entities: new Proxy({}, { get: () => ({ filter: async () => [], get: async () => null, create: async () => ({}), update: async () => ({}), delete: async () => ({}) }) }),
  integrations: { Core: { UploadFile: async () => ({ file_url: '' }) } }
};

import { useState } from "react";

import { Upload, Download, X, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const TEMPLATE_HEADERS = ["client_code", "client_name", "rm_assigned", "branch", "phone", "email", "pan", "notes"];
const TEMPLATE_EXAMPLE = ["FW-C001", "Rajesh Mehta", "Priya Sharma", "Mumbai", "9820001234", "rajesh@email.com", "ABCPM1234D", "HNI client"];

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

export default function ClientImport({ onImportDone, onClose }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) return;
    setStatus("loading");
    setError("");

    const { file_url } = await db.integrations.Core.UploadFile({ file });

    const extracted = await db.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          clients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                client_code: { type: "string" },
                client_name: { type: "string" },
                rm_assigned: { type: "string" },
                branch: { type: "string" },
                phone: { type: "string" },
                email: { type: "string" },
                pan: { type: "string" },
                notes: { type: "string" },
              }
            }
          }
        }
      }
    });

    if (extracted.status !== "success") {
      setStatus("error");
      setError(extracted.details || "Failed to extract data from file.");
      return;
    }

    const rows = Array.isArray(extracted.output) ? extracted.output : (extracted.output?.clients || []);

    if (!rows.length) {
      setStatus("error");
      setError("No valid client records found in the file.");
      return;
    }

    let created = 0, updated = 0, failed = 0;
    const existing = await db.entities.Client.list("client_code", 2000);
    const existingMap = {};
    existing.forEach(c => { existingMap[c.client_code] = c; });

    for (const row of rows) {
      if (!row.client_code || !row.client_name) { failed++; continue; }
      if (existingMap[row.client_code]) {
        await db.entities.Client.update(existingMap[row.client_code].id, row);
        updated++;
      } else {
        await db.entities.Client.create(row);
        created++;
      }
    }

    setResult({ created, updated, failed, total: rows.length });
    setStatus("done");
    onImportDone();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Import Clients from Excel / CSV</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>

      {/* Template download */}
      <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
        <Download className="w-4 h-4 text-[#00765B] mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">Step 1: Download the template</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Required columns: <span className="font-mono text-xs text-[#00765B]">{TEMPLATE_HEADERS.join(", ")}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">client_code and client_name are required. Existing records with matching client_code will be updated.</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="border-[#00765B] text-[#00765B] hover:bg-green-50 flex-shrink-0">
          Download Template
        </Button>
      </div>

      {/* File upload */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Step 2: Upload your file</p>
        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#00765B] hover:bg-green-50/30 transition-colors">
          <Upload className="w-6 h-6 text-gray-300 mb-1" />
          <span className="text-sm text-gray-400">{file ? file.name : "Click to select .xlsx or .csv file"}</span>
          <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={e => setFile(e.target.files[0])} />
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
          <CheckCircle2 className="w-5 h-5 text-[#00765B] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-semibold">Import complete!</p>
            <p className="mt-1 text-xs text-gray-500">
              {result.created} created · {result.updated} updated · {result.failed} skipped (missing required fields)
            </p>
          </div>
        </div>
      )}

      {status !== "done" && (
        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={!file || status === "loading"}
            className="bg-[#00765B] hover:bg-[#005c46] text-white rounded-xl"
          >
            {status === "loading" ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</> : "Import Clients"}
          </Button>
        </div>
      )}
    </div>
  );
}