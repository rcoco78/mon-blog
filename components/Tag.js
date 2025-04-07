export default function Tag({ name, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded-full text-sm transition-colors ${
        isActive
          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
          : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
      }`}
    >
      {name}
    </button>
  );
} 