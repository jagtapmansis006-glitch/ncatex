const SPONSORS = [
  "IEEE Standards",
  "Scopus Indexed",
  "Springer LNNS",
  "Elsevier SSRN",
  "UGC-CARE Listed",
  "Google Scholar",
  "Web of Science",
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0b0d14] py-14 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Official Logo & Branding Header */}
        <div className="flex flex-col items-center justify-center text-center mb-10">
          <a href="#top" className="group flex flex-col items-center gap-3 transition-opacity hover:opacity-90">
            <img
              src="/assets/ncatex-logo.png"
              alt="NCATEX Official Logo"
              className="h-12 w-auto md:h-14 object-contain drop-shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-transform duration-300 group-hover:scale-105"
            />
            <span className="font-display font-bold tracking-tight text-slate-900 dark:text-white text-lg sm:text-xl">
              NCATEX
            </span>
          </a>
          <p className="mt-1 max-w-md text-xs text-slate-600 dark:text-slate-400 font-medium">
            National Conference on Advanced Trends in Electronics and Telecommunication Engineering
          </p>
        </div>

        {/* Indexed Proceedings & Academic Partners Marquee (High-Contrast Ticker) */}
        <p className="mb-6 text-center text-xs uppercase tracking-[0.25em] text-slate-800 dark:text-slate-200 font-bold">
          Indexed Proceedings &amp; Academic Partners
        </p>
        <div
          className="marquee-container overflow-hidden py-3 cursor-pointer group"
          tabIndex={0}
          aria-label="Academic partner and indexed proceedings marquee"
        >
          <div className="marquee-projects flex w-max gap-8 items-center group-hover:[animation-play-state:paused]">
            {[...SPONSORS, ...SPONSORS, ...SPONSORS, ...SPONSORS].map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm transition-all duration-200 hover:border-teal-500 hover:shadow-md cursor-pointer shrink-0"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-teal-500 shrink-0" />
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-950 dark:text-white">
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright notice without hardcoded years */}
        <p className="mt-12 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
          © National Conference on Advanced Trends in Engineering (NCATEX) • All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
