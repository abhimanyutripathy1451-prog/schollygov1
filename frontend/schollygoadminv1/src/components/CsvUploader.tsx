import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface CsvUploaderProps {
  apiBase: string;
  batchId: number;
  instituteId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CsvUploader({ apiBase, batchId, instituteId, onSuccess, onCancel }: CsvUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setError("Only CSV files are allowed.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('institute_id', instituteId.toString());
    formData.append('batch_id', batchId.toString());

    try {
      const response = await fetch(`${apiBase}/api/students/import`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-graphite border border-gray-800 rounded-2xl p-6 shadow-xl mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Import Students via CSV</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-4 text-sm text-gray-400">
        <p>Your CSV file must contain the following columns:</p>
        <ul className="list-disc list-inside mt-2 text-gray-300">
          <li><strong>name</strong> (Required)</li>
          <li><strong>parent_whatsapp</strong> (Required, exactly 10 digits)</li>
          <li><strong>roll_number</strong> (Optional)</li>
        </ul>
      </div>

      {error && (
        <div className="mb-4 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-start gap-2 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="flex-1 cursor-pointer border-2 border-dashed border-gray-700 bg-deep-space hover:border-voltage-yellow rounded-xl p-4 flex flex-col items-center justify-center transition-colors">
          {file ? (
            <div className="flex items-center gap-2 text-voltage-yellow">
              <FileText className="w-6 h-6" />
              <span className="font-medium truncate max-w-[200px]">{file.name}</span>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <span className="text-sm text-gray-400 font-medium">Click to select CSV file</span>
            </div>
          )}
          <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </label>
        
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className={`px-6 py-4 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${
            file && !isUploading
              ? 'bg-voltage-yellow hover:bg-yellow-400 text-deep-space shadow-[0_0_15px_rgba(255,215,0,0.3)]'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-deep-space border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Upload className="w-5 h-5" />
          )}
          Import
        </button>
      </div>
    </div>
  );
}
