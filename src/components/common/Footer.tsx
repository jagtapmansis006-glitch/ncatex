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
              alt="NCATEX 2026 Official Logo"
              className="h-12 w-auto md:h-14 object-contain drop-shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-transform duration-300 group-hover:scale-105"
            />
            <span className="font-display font-bold tracking-tight text-slate-900 dark:text-white text-lg sm:text-xl">
              NCATEX 2026
            </span>
          </a>
          <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
            National Conference on Advanced Trends in Electronics and Telecommunication Engineering
          </p>
        </div>

        {/* Indexed Proceedings & Academic Partners Marquee */}
        <p className="mb-6 text-center text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-semibold">
          Indexed Proceedings &amp; Academic Partners
        </p>
        <div className="overflow-hidden">
          <div className="marquee-projects flex w-max gap-20">
            {[...SPONSORS, ...SPONSORS, ...SPONSORS, ...SPONSORS].map((s, i) => (
              <span
                key={i}
                className="text-2xl sm:text-3xl font-medium tracking-tight text-slate-400 dark:text-slate-600 transition-colors hover:text-slate-900 dark:hover:text-white cursor-default"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Copyright notice */}
        <p className="mt-12 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
          © 2026 2nd National Conference on Advanced Trends in Engineering (NCATEX) • All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
