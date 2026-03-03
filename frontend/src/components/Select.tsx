import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
    value: string | number;
    label: string | React.ReactNode;
}

interface CustomSelectProps {
    value: string | number;
    onChange: (value: any) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Select an option',
    className = '',
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Find the currently selected option
    const selectedOption = options.find(opt => opt.value === value);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-2.5 bg-white border ${isOpen ? 'border-zinc-900 ring-2 ring-zinc-900/20' : 'border-zinc-300'} rounded-lg text-sm text-left flex items-center justify-between shadow-sm transition-all hover:border-zinc-400 focus:outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <span className={`block truncate ${!selectedOption && placeholder ? 'text-zinc-500' : 'text-zinc-900'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={16} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-auto max-h-60 animate-in fade-in slide-in-from-top-2">
                    <ul className="py-1">
                        {options.map((option, idx) => (
                            <li
                                key={idx}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`px-4 py-2 text-sm cursor-pointer transition-colors ${option.value === value
                                    ? 'bg-blue-600 text-white'
                                    : 'text-zinc-700 hover:bg-zinc-100'
                                    }`}
                            >
                                {option.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
