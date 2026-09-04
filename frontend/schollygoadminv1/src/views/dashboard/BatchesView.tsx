import React, { useState, useEffect } from 'react';
import { Plus, Users, LayoutDashboard, ChevronRight } from 'lucide-react';
import CsvUploader from '../../components/CsvUploader';

interface BatchesViewProps {
  apiBase: string;
  onNavigate: (route: string, data?: any) => void;
}

export default function BatchesView({ apiBase, onNavigate }: BatchesViewProps) {
  const [batches, setBatches] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newBatch, setNewBatch] = useState({ name: '', class_grade: '10', stream: 'General' });
  const [importBatchId, setImportBatchId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // In a real app, this comes from auth context
  const instituteId = 1; 

  const fetchBatches = async () => {
    try {
      const res = await fetch(`${apiBase}/api/batches/${instituteId}`);
      if (res.ok) {
        const data = await res.json();
        setBatches(data);
      }
    } catch (e) {
      console.error("Failed to fetch batches", e);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [instituteId, apiBase]);

  const handleCreateBatch = async () => {
    if (!newBatch.name.trim()) return;
    try {
      const res = await fetch(`${apiBase}/api/batches/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institute_id: instituteId,
          name: newBatch.name,
          class_grade: newBatch.class_grade,
          stream: newBatch.stream
        })
      });
      if (res.ok) {
        setIsCreating(false);
        setNewBatch({ name: '', class_grade: '10', stream: 'General' });
        fetchBatches();
        setToastMessage("Batch created successfully!");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (e) {
      console.error("Failed to create batch", e);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-voltage-yellow" />
          Manage Batches
        </h1>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-voltage-yellow hover:bg-yellow-400 text-deep-space font-bold py-2 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(255,215,0,0.3)] flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Batch
        </button>
      </div>

      {toastMessage && (
        <div className="mb-6 bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg flex items-center">
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {isCreating && (
        <div className="bg-graphite border border-gray-800 rounded-2xl p-6 shadow-xl mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Create New Batch</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Batch Name</label>
              <input 
                type="text" 
                value={newBatch.name}
                onChange={(e) => setNewBatch({...newBatch, name: e.target.value})}
                className="w-full bg-deep-space border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-voltage-yellow"
                placeholder="e.g. Target 2027"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Class</label>
              <select 
                value={newBatch.class_grade}
                onChange={(e) => setNewBatch({...newBatch, class_grade: e.target.value})}
                className="w-full bg-deep-space border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-voltage-yellow"
              >
                <option value="10">Class 10</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Stream</label>
              <select 
                value={newBatch.stream}
                onChange={(e) => setNewBatch({...newBatch, stream: e.target.value})}
                className="w-full bg-deep-space border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-voltage-yellow"
              >
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreateBatch}
              className="bg-voltage-yellow text-deep-space font-bold px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {importBatchId && (
        <CsvUploader 
          apiBase={apiBase} 
          batchId={importBatchId} 
          instituteId={instituteId}
          onCancel={() => setImportBatchId(null)}
          onSuccess={() => {
            setImportBatchId(null);
            setToastMessage("Students imported successfully!");
            setTimeout(() => setToastMessage(null), 3000);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {batches.length === 0 && !isCreating ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <LayoutDashboard className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No batches found. Create one to get started.</p>
          </div>
        ) : (
          batches.map(batch => (
            <div key={batch.id} className="bg-graphite border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-voltage-yellow/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{batch.name}</h3>
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    Class {batch.class_grade} &bull; {batch.stream}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-800">
                <button 
                  onClick={() => setImportBatchId(batch.id)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-voltage-yellow transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Import Students
                </button>
                <button 
                  onClick={() => onNavigate('batch_detail', batch)}
                  className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-voltage-yellow group-hover:text-deep-space transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
