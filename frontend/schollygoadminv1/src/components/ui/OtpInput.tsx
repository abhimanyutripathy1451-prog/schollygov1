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
                        ref={(el) => (passkeyRefs.current[index] = el)}
                        value={paddedPasskey[index] !== ' ' ? paddedPasskey[index] : ''}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        onBlur={onBlur}
                        type={showPassword ? 'text' : 'password'}
                        inputMode="numeric"
                        maxLength={2} // Allow 2 so we can catch next char
                        required={index === 0 && !value}
                        className={`w-full aspect-square text-center bg-deep-space border text-white rounded-xl focus:ring-2 block p-0 transition-colors outline-none text-2xl font-bold ${
                            isInvalid
                            ? 'border-error-red/60 focus:ring-error-red/30 focus:border-error-red shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                            : 'border-gray-700 focus:ring-voltage-yellow/50 focus:border-voltage-yellow'
                        }`}
                    />
                );
            })}
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 flex-shrink-0 flex items-center justify-center text-gray-500 hover:text-white transition-colors cursor-pointer active:scale-95 bg-graphite border border-gray-700 p-3 rounded-xl aspect-square"
            >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
        </div>
    );
};
