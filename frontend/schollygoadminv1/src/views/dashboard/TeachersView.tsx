import React, { useState, useEffect } from 'react';
import { UserPlus, User, ShieldCheck } from 'lucide-react';

interface TeachersViewProps {
  apiBase: string;
  onNavigate: (route: string) => void;
}

export default function TeachersView({ apiBase, onNavigate }: TeachersViewProps) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', contact_number: '', passkey: '' });
  
  const [assignTeacherId, setAssignTeacherId] = useState<number | null>(null);
  const [assignment, setAssignment] = useState({ batch_id: '', subject: '' });
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const instituteId = 1; // From Auth context in a real app

  const fetchData = async () => {
    try {
      const [tRes, bRes] = await Promise.all([
        fetch(`${apiBase}/api/teachers/${instituteId}`),
        fetch(`${apiBase}/api/batches/${instituteId}`)
      ]);
      if (tRes.ok) setTeachers(await tRes.json());
      if (bRes.ok) setBatches(await bRes.json());
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiBase, instituteId]);

  const handleCreateTeacher = async () => {
    if (!newTeacher.name || !newTeacher.contact_number || !newTeacher.passkey) return;
    try {
      const res = await fetch(`${apiBase}/api/teachers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institute_id: instituteId,
          name: newTeacher.name,
          contact_number: newTeacher.contact_number,
          passkey: newTeacher.passkey
        })
      });
      if (res.ok) {
        setIsCreating(false);
        setNewTeacher({ name: '', contact_number: '', passkey: '' });
        fetchData();
        setToastMessage("Teacher account created!");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignTeacher = async () => {
    if (!assignTeacherId || !assignment.batch_id || !assignment.subject) return;
    try {
      const res = await fetch(`${apiBase}/api/teachers/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: assignTeacherId,
          batch_id: parseInt(assignment.batch_id),
          subject: assignment.subject
        })
      });
      if (res.ok) {
        setAssignTeacherId(null);
        setAssignment({ batch_id: '', subject: '' });
        setToastMessage("Teacher assigned to batch successfully!");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <User className="w-8 h-8 text-voltage-yellow" />
          Manage Teachers
        </h1>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-voltage-yellow hover:bg-yellow-400 text-deep-space font-bold py-2 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(255,215,0,0.3)] flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Add Teacher
        </button>
      </div>

      {toastMessage && (
        <div className="mb-6 bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg flex items-center">
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {isCreating && (
        <div className="bg-graphite border border-gray-800 rounded-2xl p-6 shadow-xl mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Create Teacher Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
              <input 
                type="text" 
                value={newTeacher.name}
                onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                className="w-full bg-deep-space border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-voltage-yellow"
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Contact Number</label>
              <input 
                type="text" 
                value={newTeacher.contact_number}
                onChange={(e) => setNewTeacher({...newTeacher, contact_number: e.target.value})}
                className="w-full bg-deep-space border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-voltage-yellow"
                placeholder="Mobile number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Passkey (PIN)</label>
              <input 
                type="password" 
                value={newTeacher.passkey}
                onChange={(e) => setNewTeacher({...newTeacher, passkey: e.target.value})}
                className="w-full bg-deep-space border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-voltage-yellow"
                placeholder="4-digit PIN"
                maxLength={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button onClick={handleCreateTeacher} className="bg-voltage-yellow text-deep-space font-bold px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors">Save</button>
          </div>
        </div>
      )}

      {assignTeacherId && (
        <div className="bg-graphite border border-gray-800 rounded-2xl p-6 shadow-xl mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Assign Teacher to Batch</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Select Batch</label>
              <select 
                value={assignment.batch_id}
                onChange={(e) => setAssignment({...assignment, batch_id: e.target.value})}
                className="w-full bg-deep-space border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-voltage-yellow"
              >
                <option value="">-- Choose Batch --</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
              <input 
                type="text" 
                value={assignment.subject}
                onChange={(e) => setAssignment({...assignment, subject: e.target.value})}
                className="w-full bg-deep-space border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-voltage-yellow"
                placeholder="e.g. Physics"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setAssignTeacherId(null)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button onClick={handleAssignTeacher} className="bg-voltage-yellow text-deep-space font-bold px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors">Assign</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map(teacher => (
          <div key={teacher.id} className="bg-graphite border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-deep-space rounded-full flex items-center justify-center text-voltage-yellow border border-gray-700">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{teacher.name}</h3>
                <p className="text-sm text-gray-400">{teacher.contact_number}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-800">
              <button 
                onClick={() => setAssignTeacherId(teacher.id)}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-voltage-yellow transition-colors border border-gray-700 hover:border-voltage-yellow py-2 rounded-lg"
              >
                <ShieldCheck className="w-4 h-4" />
                Assign Batch
              </button>
            </div>
          </div>
        ))}
        
        {teachers.length === 0 && !isCreating && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No teachers found. Add one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
