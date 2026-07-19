export function Footer() {
  return (
    <footer className="relative overflow-hidden rounded-t-4xl border-t border-white/10 bg-black px-6 pt-12 md:px-16 md:pt-16">
      {/* Giant background wordmark */}
      <div className="pointer-events-none relative mb-6 select-none text-center md:mb-10">
        <span className="font-covered text-[15vw] italic leading-none tracking-tight text-white/20 md:text-[9vw]">
          persist
        </span>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 flex flex-col items-center gap-3 border-t border-white/10 py-6 text-center text-sm text-white/50 md:flex-row md:justify-between md:gap-0 md:text-left">
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