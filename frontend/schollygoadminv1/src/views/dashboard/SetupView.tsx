import React, { useState } from 'react';
import { Save, Upload } from 'lucide-react';

interface SetupViewProps {
  apiBase: string;
  onNavigate: (route: string) => void;
}

export default function SetupView({ apiBase, onNavigate }: SetupViewProps) {
  const [instituteName, setInstituteName] = useState('Alpha Academy');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // In a real app, this would be an API call
    setToastMessage('Institute Profile updated successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-white">Institute Setup</h1>

      {toastMessage && (
        <div className="mb-6 bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg flex items-center">
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="bg-graphite border border-gray-800 rounded-2xl p-6 shadow-xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Institute Name</label>
            <input 
              type="text" 
              value={instituteName}
              onChange={(e) => setInstituteName(e.target.value)}
              className="w-full bg-deep-space border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-voltage-yellow transition-colors"
              placeholder="Enter institute name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Institute Logo</label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-xl bg-deep-space border-2 border-dashed border-gray-700 flex flex-col items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-gray-500 text-xs">No Logo</span>
                )}
              </div>
              <div>
                <label className="cursor-pointer bg-deep-space hover:bg-gray-800 border border-gray-700 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload Image
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
                <p className="text-xs text-gray-500 mt-2">Recommended size: 512x512px (PNG, JPG)</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-800">
            <button 
              onClick={handleSave}
              className="bg-voltage-yellow hover:bg-yellow-400 text-deep-space font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_15px_rgba(255,215,0,0.3)] flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
