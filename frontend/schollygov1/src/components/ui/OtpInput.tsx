import React, { useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface OtpInputProps {
    value: string;
    onChange: (val: string) => void;
    isInvalid?: boolean;
    onBlur?: () => void;
}

export const OtpInput: React.FC<OtpInputProps> = ({ value, onChange, isInvalid, onBlur }) => {
    const [showPassword, setShowPassword] = useState(false);
    const passkeyRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleOtpChange = (index: number, val: string) => {
        const newChar = val.replace(/[^0-9]/g, '').slice(-1);
        
        let newPasskey = value.padEnd(4, ' ').split('');
        if (val === '') {
            newPasskey[index] = ' ';
        } else if (newChar) {
            newPasskey[index] = newChar;
        }
        
        const newStr = newPasskey.join('').trimEnd();
        onChange(newStr);

        // Move to next if character entered
        if (newChar && index < 3) {
            passkeyRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        const paddedPasskey = value.padEnd(4, ' ');
        if (e.key === 'Backspace') {
            if (paddedPasskey[index] === ' ' && index > 0) {
                // Move back and delete
                e.preventDefault();
                passkeyRefs.current[index - 1]?.focus();
                let newPasskey = value.padEnd(4, ' ').split('');
                newPasskey[index - 1] = ' ';
                onChange(newPasskey.join('').trimEnd());
            }
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
        if (pastedData) {
            onChange(pastedData);
            if (pastedData.length === 4) {
                passkeyRefs.current[3]?.focus();
            } else {
                passkeyRefs.current[pastedData.length]?.focus();
            }
        }
    };

    return (
        <div className="relative flex items-center justify-between gap-3">
            {[0, 1, 2, 3].map((index) => {
                const paddedPasskey = value.padEnd(4, ' ');
                return (
                    <input
                        key={index}
                        name={`passkey-${index}`}
                        ref={(el) => (passkeyRefs.current[index] = el)}
                        value={paddedPasskey[index] !== ' ' ? paddedPasskey[index] : ''}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        onBlur={onBlur}
                        type={showPassword ? 'text' : 'password'}
                        inputMode="numeric"
                        autoComplete="new-password"
                        maxLength={2} // Allow 2 so we can catch next char
                        required={index === 0 && !value}
                        className={`w-full aspect-square text-center rounded-input focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-app block p-0 transition-all duration-300 outline-none text-2xl font-bold cursor-text ${
                            isInvalid
                            ? 'bg-semantic-error/10 border border-semantic-error/60 focus:ring-semantic-error/50 focus:border-semantic-error shadow-[0_0_15px_rgba(239,68,68,0.2)] text-text-primary'
                            : 'bg-bg-surface-elevated/60 border border-border-subtle hover:bg-bg-surface-elevated hover:border-slate-500 focus:bg-bg-surface-elevated focus:ring-brand-primary focus:border-brand-primary text-text-primary shadow-inner'
                        }`}
                    />
                );
            })}
            <button
                type="button"
                aria-label={showPassword ? 'Hide PIN' : 'Show PIN'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 flex-shrink-0 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer active:scale-95 bg-bg-surface border border-border-subtle p-3 rounded-input aspect-square focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app"
            >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
        </div>
    );
};
