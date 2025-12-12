import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import axios from 'axios';

interface AutocompleteInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    icon?: React.ReactNode;
}

interface Suggestion {
    place_id: number;
    display_name: string;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ value, onChange, placeholder, className, icon }) => {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync internal state with external value
    useEffect(() => {
        setQuery(value);
    }, [value]);

    // Handle outside click to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced Search
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (query.trim().length > 2 && isOpen) {
                setIsLoading(true);
                try {
                    // Nominatim API for OpenStreetMap
                    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                        params: {
                            q: query,
                            format: 'json',
                            addressdetails: 1,
                            limit: 5
                        }
                    });
                    setSuggestions(response.data);
                } catch (error) {
                    console.error('Error fetching suggestions:', error);
                    setSuggestions([]);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setSuggestions([]);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [query, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        onChange(e.target.value);
        setIsOpen(true);
    };

    const handleSelect = (suggestion: Suggestion) => {
        const mainText = suggestion.display_name;
        setQuery(mainText);
        onChange(mainText);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-3 text-slate-400 pointer-events-none">
                        {icon}
                    </div>
                )}
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className={`w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${className}`}
                />
                {isLoading && (
                    <div className="absolute right-3 top-3 animate-spin text-slate-400">
                        <Loader2 size={18} />
                    </div>
                )}
            </div>

            {isOpen && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white mt-1 border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((item) => (
                        <li
                            key={item.place_id}
                            onClick={() => handleSelect(item)}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 border-b border-slate-100 last:border-0"
                        >
                            <div className="flex items-start">
                                <MapPin size={14} className="mt-1 mr-2 text-slate-400 flex-shrink-0" />
                                <span>{item.display_name}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AutocompleteInput;
