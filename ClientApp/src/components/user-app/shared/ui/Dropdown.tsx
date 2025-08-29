import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useThemeClasses } from '../../../../contexts/ThemeContext';

export interface DropdownOption {
    value: string;
    label: string;
}

export interface DropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function Dropdown({
    options,
    value,
    onChange,
    placeholder = "Select an option",
    className = ''
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const themeClasses = useThemeClasses();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const selectedOption = options.find(option => option.value === value);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                className={`w-full ${themeClasses.input.base} rounded-lg px-3 py-2 text-left ${themeClasses.shadow.sm} focus:outline-none focus:ring-2 ${themeClasses.ring.focus} flex items-center justify-between`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedOption ? themeClasses.text.primary : themeClasses.text.tertiary}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={`${themeClasses.text.tertiary} transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className={`absolute z-10 w-full mt-1 ${themeClasses.bg.card} ${themeClasses.border.primary} border rounded-lg ${themeClasses.shadow.lg} max-h-60 overflow-auto`}>
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`w-full px-3 py-2 text-left focus:outline-none ${value === option.value
                                    ? `${themeClasses.button.primary} text-white`
                                    : `${themeClasses.bg.hover} ${themeClasses.text.primary}`
                                }`}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
