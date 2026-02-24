import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    id?: string;
}

export default function SearchBar({
    value,
    onChange,
    placeholder,
    className = '',
    id = 'search-input'
}: SearchBarProps) {
    const { t } = useTranslation();

    return (
        <div className={`flex rounded-xl overflow-hidden border border-gray-200 bg-white transition-all shadow-sm ${className}`}>
            <div className="bg-gray-800 w-12 flex items-center justify-center shrink-0">
                <Search className="w-5 h-5 text-white" />
            </div>
            <input
                id={id}
                type="text"
                placeholder={placeholder || t('common.search')}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 px-4 py-3 bg-transparent outline-none border-0 ring-0 focus:outline-none focus:ring-0 focus:border-0 text-gray-900 placeholder:text-gray-400"
            />
        </div>
    );
}
