import React, { useRef, useEffect } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

export default function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Array of single digit strings
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    // Focus first input on mount if empty
    if (!value && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const char = e.target.value.slice(-1); // Take the newest character
    if (char && !/^\d$/.test(char)) return; // Only allow digits

    const newDigits = [...digits];
    newDigits[index] = char;
    const combined = newDigits.join('');
    onChange(combined);

    // If digit entered, shift focus forward
    if (char && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move back if current is already empty
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, length);
    if (!pastedData) return;

    onChange(pastedData);
    
    // Focus last pasted index or last input
    const targetIndex = Math.min(pastedData.length, length - 1);
    inputsRef.current[targetIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 my-4">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          id={`otp-input-${index}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          value={digits[index]}
          disabled={disabled}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl border transition-all duration-200 outline-none
            ${digits[index] 
              ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20' 
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600'
            }
            focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:focus:border-emerald-400
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label={`Digit ${index + 1} of verification code`}
        />
      ))}
    </div>
  );
}
