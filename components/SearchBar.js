export default function SearchBar({ tags = [], selectedTag, onTagSelect }) {
  return (
    <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1.5 scrollbar-hide">
          <button 
            onClick={() => onTagSelect(null)}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 border ${
              selectedTag === null
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
            }`}
          >
            Tous
          </button>
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => onTagSelect(tag)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 border ${
                selectedTag === tag
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                  : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              {tag}
            </button>
          ))}
    </div>
  );
} 