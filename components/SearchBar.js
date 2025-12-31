export default function SearchBar({ tags = [], selectedTag, onTagSelect }) {
  return (
    <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1.5 scrollbar-hide">
          <button 
            onClick={() => onTagSelect(null)}
        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 border ${
              selectedTag === null
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent dark:border-transparent'
                : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }`}
          >
            Tous
          </button>
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => onTagSelect(tag)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 border ${
                selectedTag === tag
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent dark:border-transparent'
                  : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
            >
              {tag}
            </button>
          ))}
    </div>
  );
} 