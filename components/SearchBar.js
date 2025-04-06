import { useState } from 'react';

export default function SearchBar({ onSearch, tags = [], selectedTag, onTagSelect }) {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="mb-4">
      <div className="mb-12 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder="Rechercher un article..."
              className="w-full px-4 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors bg-transparent"
            />
            <svg
              className="absolute right-3 top-2.5 w-5 h-5 text-neutral-400 dark:text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button 
            onClick={() => onTagSelect(null)}
            className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
              selectedTag === null
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }`}
          >
            Tous
          </button>
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => onTagSelect(tag)}
              className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                selectedTag === tag
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 