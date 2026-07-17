export function Footer() {
  return (
    <footer className="relative overflow-hidden rounded-t-4xl border-t border-white/10 bg-black px-6 pt-16 md:px-16">
      {/* Giant background wordmark */}
      <div className="pointer-events-none relative mb-10 select-none text-center">
        <span className="font-covered text-[14vw] italic leading-none tracking-tight text-white/15">
          persist
        </span>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 flex items-center justify-between border-t border-white/10 py-6 text-sm text-white/50">
        <p>Persist © Copyright 2026.</p>

        <p>Built by Chandan Jyo</p>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/chandan-1427/Persist"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white"
          >
            GitHub project
          </a>
        </div>
      </div>
    </footer>
  )
}