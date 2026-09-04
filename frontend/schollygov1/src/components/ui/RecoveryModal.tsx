import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, Key, MessageSquare, Unlock, Check, Loader2, AlertCircle } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { OtpInput } from './OtpInput';

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mobile?: string;
  vaultQuestion?: string;
  apiBase?: string;
}

type RecoveryState = 'select_method' | 'vault_challenge' | 'admin_fallback' | 'new_pin_setup' | 'success';

export const RecoveryModal: React.FC<RecoveryModalProps> = ({ 
  isOpen, 
  onClose, 
  mobile = '0000000000',
  vaultQuestion = 'What is your dream superpower?',
  apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
}) => {
  const [currentState, setCurrentState] = useState<RecoveryState>('select_method');
  const [vaultAnswer, setVaultAnswer] = useState('');
  
  const [newPasskey, setNewPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleClose = () => {
    setTimeout(() => {
      setCurrentState('select_method');
      setVaultAnswer('');
      setNewPasskey('');
      setConfirmPasskey('');
      setErrorMsg('');
    }, 300);
    onClose();
  };

  const verifyVaultAnswer = async () => {
    if (!vaultAnswer.trim()) {
      setErrorMsg("Please enter your answer.");
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const res = await fetch(`${apiBase}/auth/verify-vault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, vaultAnswer })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentState('new_pin_setup');
      } else {
        setErrorMsg(data.detail || "Incorrect answer. Please try again.");
      }
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPasskey = async () => {
    if (newPasskey.length !== 4) {
      setErrorMsg("Passkey must be 4 digits.");
      return;
    }
    if (newPasskey !== confirmPasskey) {
      setErrorMsg("Passkeys do not match.");
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const res = await fetch(`${apiBase}/auth/reset-passkey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, vaultAnswer, newPasskey })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentState('success');
      } else {
        setErrorMsg(data.detail || "Failed to reset passkey.");
      }
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="w-full max-w-md relative"
        >
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 bg-semantic-error/5 border-l-4 border-semantic-error/50 p-4 rounded-r-xl flex items-center gap-3 w-full">
              <AlertCircle className="w-5 h-5 text-semantic-error flex-shrink-0" />
              <p className="text-sm font-medium text-semantic-error">{errorMsg}</p>
            </motion.div>
          )}

          {currentState === 'select_method' && (
            <Card variant="default" className="text-center p-8 relative">
              <button aria-label="Close" onClick={handleClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary cursor-pointer active:scale-95">
                <X className="w-6 h-6" />
              </button>
              
              <div className="w-16 h-16 bg-bg-surface-elevated border border-border-subtle rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Unlock className="w-8 h-8 text-text-primary" />
              </div>
              
              <h2 className="text-xl font-black text-text-primary mb-2">Forgot Your PIN?</h2>
              <p className="text-text-secondary text-sm font-semibold mb-8">
                How do you want to unlock your account?
              </p>
              
              <div className="flex flex-col gap-3">
                <Button variant="secondary" onClick={() => { setErrorMsg(''); setCurrentState('vault_challenge'); }} fullWidth className="justify-start px-6">
                  <Key className="w-5 h-5 mr-3 text-brand-primary" /> Open Secret Vault
                </Button>
                <Button variant="secondary" onClick={() => { setErrorMsg(''); setCurrentState('admin_fallback'); }} fullWidth className="justify-start px-6">
                  <ShieldAlert className="w-5 h-5 mr-3 text-semantic-error" /> Contact Admin
                </Button>
              </div>
            </Card>
          )}

          {currentState === 'vault_challenge' && (
            <Card variant="gamified" className="text-center p-8 relative">
              <button aria-label="Close" onClick={handleClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary cursor-pointer active:scale-95 relative z-20">
                <X className="w-6 h-6" />
              </button>

              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent opacity-50 z-0"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-brand-primary" />
                </div>
                
                <h2 className="text-xl font-black text-text-primary mb-6">The Secret Vault</h2>
                
                <div className="w-full space-y-4 text-left">
                  <Input 
                    id="vault-question"
                    label="Secret Question"
                    value={vaultQuestion}
                    disabled
                    readOnly
                  />
                  
                  <Input 
                    id="vault-answer"
                    label="Your Answer"
                    value={vaultAnswer}
                    onChange={(e) => setVaultAnswer(e.target.value)}
                    placeholder="Enter your secret answer..."
                  />
                  
                  <Button 
                    variant="primary" 
                    fullWidth 
                    className="mt-2"
                    onClick={verifyVaultAnswer}
                    isLoading={isLoading}
                  >
                    VERIFY
                  </Button>

                  <button 
                    onClick={() => { setErrorMsg(''); setCurrentState('select_method'); }}
                    className="w-full text-center text-xs font-bold text-text-secondary hover:text-text-primary transition-colors mt-4 cursor-pointer"
                  >
                    Try another way
                  </button>
                </div>
              </div>
            </Card>
          )}

          {currentState === 'new_pin_setup' && (
            <Card variant="gamified" className="text-center p-8 relative">
              <button aria-label="Close" onClick={handleClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary cursor-pointer active:scale-95 relative z-20">
                <X className="w-6 h-6" />
              </button>

              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent opacity-50 z-0"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Unlock className="w-8 h-8 text-brand-primary" />
                </div>
                
                <h2 className="text-xl font-black text-text-primary mb-2">Vault Unlocked!</h2>
                <p className="text-text-secondary text-sm font-semibold mb-6">
                  Choose a new 4-digit PIN for your account.
                </p>
                
                <div className="w-full space-y-4 text-left">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">New Passkey</label>
                    <OtpInput value={newPasskey} onChange={setNewPasskey} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">Confirm Passkey</label>
                    <OtpInput value={confirmPasskey} onChange={setConfirmPasskey} />
                  </div>
                  
                  <Button 
                    variant="primary" 
                    fullWidth 
                    className="mt-4"
                    onClick={resetPasskey}
                    isLoading={isLoading}
                    disabled={newPasskey.length !== 4 || confirmPasskey.length !== 4}
                  >
                    RESET PIN
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {currentState === 'success' && (
            <Card variant="gamified" className="text-center p-8 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3]/10 to-transparent opacity-50 z-0"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-[#00FFA3]/10 border border-[#00FFA3]/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,255,163,0.2)]">
                  <Check className="w-10 h-10 text-[#00FFA3]" />
                </div>
                
                <h2 className="text-3xl font-black text-text-primary mb-2 tracking-tight">Success!</h2>
                <p className="text-text-secondary text-sm mb-8 font-semibold">
                  Your new PIN has been set successfully.
                </p>
                
                <Button variant="primary" fullWidth onClick={handleClose}>
                  RETURN TO LOGIN
                </Button>
              </div>
            </Card>
          )}

          {currentState === 'admin_fallback' && (
            <Card variant="default" className="text-center p-8 relative">
              <button aria-label="Close" onClick={handleClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary cursor-pointer active:scale-95">
                <X className="w-6 h-6" />
              </button>

              <div className="w-16 h-16 bg-semantic-error/10 border border-semantic-error/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8 text-semantic-error" />
              </div>
              
              <h2 className="text-xl font-black text-text-primary mb-4">Contact Admin</h2>
              
              <p className="text-text-secondary text-sm font-semibold leading-relaxed mb-8">
                No problem! Just send a WhatsApp message to <strong className="text-brand-primary">7338401222</strong> for a PIN reset. Once we reset it, you can choose a new one.
              </p>
              
              <div className="space-y-3">
                <Button variant="primary" fullWidth onClick={handleClose}>
                  Return to Login
                </Button>
                <button 
                  onClick={() => { setErrorMsg(''); setCurrentState('select_method'); }}
                  className="w-full text-center text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  Try another way
                </button>
              </div>
            </Card>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
