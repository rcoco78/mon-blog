export default function SearchBar({ tags = [], selectedTag, onTagSelect }) {
  return (
    <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
      <button 
        onClick={() => onTagSelect(null)}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
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
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
            selectedTag === tag
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
} 