import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { CountUp } from "@/components/common/CountUp";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About NCATEX - National Conference on Advanced Trends in Electronics and Telecommunication Engineering" },
      {
        name: "description",
        content:
          "About NCATEX: National Conference on Advanced Trends in Electronics and Telecommunication Engineering. Scope, keynote speakers, and academic review process.",
      },
      { property: "og:title", content: "About NCATEX - National Conference on Advanced Trends in Electronics and Telecommunication Engineering" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AboutPage,
});

const STATS = [
  { value: "5", label: "Research Tracks", detail: "Spanning AI, VLSI, 5G, IoT & Signal Processing" },
  { value: "40+", label: "Keynote Speakers", detail: "Distinguished Global Academicians & Engineers" },
  { value: "2", label: "Conference Days", detail: "Technical Sessions, Keynotes & Demos" },
  { value: "500+", label: "Submissions Expected", detail: "From Leading Universities & Research Centers" },
  { value: "100%", label: "Double-Blind Review", detail: "Rigorous Scholarly Evaluation Standard" },
  { value: "21", label: "Day Review Timeline", detail: "Rapid & Constructive Editorial Feedback" },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">
      <Navbar />

      <main className="pt-32 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block rounded-full bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300">
            About the Conference
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            NCATEX
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-300 font-medium">
            National Conference on Advanced Trends in Electronics and Telecommunication Engineering
          </p>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            NCATEX convenes distinguished researchers, doctoral scholars, and industry innovators to
            disseminate groundbreaking technical contributions shaping the future of electronics,
            telecommunication, intelligent systems, and VLSI architectures.
          </p>
        </div>

        {/* Statistics Cards with Smooth Count-Up Animation via IntersectionObserver */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Conference Key Statistics
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Measurable impact and academic excellence across all technical disciplines
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="card-antigravity rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0f1117] p-6 shadow-sm hover:border-teal-500/40 text-center flex flex-col justify-between"
              >
                <div>
                  <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display mb-2">
                    <CountUp value={stat.value} duration={1.6} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    {stat.label}
                  </h3>
                </div>
                <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {stat.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Academic Scope & Review Standards */}
        <section className="grid md:grid-cols-2 gap-8 border-t border-slate-200 dark:border-slate-800/80 pt-16">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0c10] p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Peer-Review &amp; Publishing Integrity
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Each submission is evaluated through a strict double-blind review process by a panel of
              subject-matter experts. Submissions are checked for mathematical accuracy, originality,
              and methodology validity.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0c10] p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Indexing &amp; Proceedings
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Accepted and registered manuscripts meeting IEEE / Scopus formatting criteria will be
              submitted for inclusion into prominent digital libraries and indexed conference proceedings.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AboutPage;
