import { FiGithub } from "react-icons/fi";

export function Footer() {
  return (
    <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 py-5 text-sm text-white/45">
      <p>Persist — built to outlast yourself.</p>

      <div className="pointer-events-auto flex items-center gap-3">
        <a
          href="https://github.com/chandan-1427/Persist"
          target="_blank"
          rel="noopener noreferrer"
          title="Persist repo"
          className="flex items-center gap-1 text-white/45 transition-colors hover:text-white/80"
        >
          <FiGithub className="h-4 w-4" />
        </a>
      </div>
    </footer>
  )
}