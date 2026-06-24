'use client';

import * as React from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface ComboboxProps<T> {
  items: T[];
  placeholder: string;
  searchPlaceholder: string;
  getLabel: (item: T) => string;
  getValue: (item: T) => string;
  onSelect: (item: T) => void;
  className?: string;
}

export function Combobox<T>({
  items,
  placeholder,
  searchPlaceholder,
  getLabel,
  getValue,
  onSelect,
  className = ''
}: ComboboxProps<T>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedItem, setSelectedItem] = React.useState<T | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = items.filter(item =>
    getLabel(item).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={containerRef} className={`relative inline-block w-full text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
      >
        <span className={selectedItem ? "text-gray-900 font-medium" : "text-gray-400"}>
          {selectedItem ? getLabel(selectedItem) : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-1.5 w-full rounded-lg border border-gray-100 bg-white shadow-xl focus:outline-none max-h-60 overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-gray-100 bg-white p-2">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-gray-200 py-1.5 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
          <ul className="py-1">
            {filteredItems.length === 0 ? (
              <li className="px-4 py-2 text-sm text-gray-400">Nenhum resultado encontrado</li>
            ) : (
              filteredItems.map((item, idx) => (
                <li key={getValue(item) || idx}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem(item);
                      onSelect(item);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-900"
                  >
                    {getLabel(item)}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
