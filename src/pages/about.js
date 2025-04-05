import Image from 'next/image'

export default function About() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="text-center">
        <Image
          src="/images/profile.jpg"
          alt="Corentin Robert"
          width={64}
          height={64}
          className="w-16 h-16 rounded-full object-cover mb-4 border-2 border-neutral-200 dark:border-neutral-100"
        />
        <h1 className="text-4xl font-bold mb-4">À propos</h1>
      </div>
    </div>
  )
} 