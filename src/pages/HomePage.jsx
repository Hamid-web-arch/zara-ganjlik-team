import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSettings } from "../lib/api";
import TeamSwiper from "../components/TeamSwiper";
import { useLanguage } from "../lib/i18n/languageContext";
import LanguageSwitcher from "../components/LanguageSwitcher";

const DEFAULT_HERO_IMAGE = "https://images.unsplash.com/photo-1441986300917-64674bd600d8";
const DEFAULT_ENERGY_VIDEO = "https://vjs.zencdn.net/v/oceans.mp4";

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("site-theme") === "dark";
    } catch {
      return false;
    }
  });
  const [heroTitle, setHeroTitle] = useState("Ganjlik 6615");
  const [heroImage, setHeroImage] = useState(DEFAULT_HERO_IMAGE);
  const [energyVideo, setEnergyVideo] = useState(DEFAULT_ENERGY_VIDEO);
  const showcaseVideoRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("site-theme", dark ? "dark" : "light");
    } catch {
      // ignore (private browsing, storage disabled, etc.)
    }
  }, [dark]);

  useEffect(() => {
    getSettings("hero")
      .then((data) => {
        if (data?.title) setHeroTitle(data.title);
        if (data?.image) setHeroImage(data.image);
      })
      .catch((error) => console.error("Hero ayarları yüklənərkən xəta:", error));
  }, []);

  useEffect(() => {
    getSettings("energy")
      .then((data) => {
        if (data?.videoUrl) setEnergyVideo(data.videoUrl);
      })
      .catch((error) => console.error("Video ayarları yüklənərkən xəta:", error));
  }, []);

  useEffect(() => {
    const video = showcaseVideoRef.current;
    if (!video) return;
    video.load();
  }, [energyVideo]);

  useEffect(() => {
    const video = showcaseVideoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="scroll-smooth">
      <header
        className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 border-b border-solid px-6 md:px-12 ${
          scrolled
            ? dark
              ? "bg-zinc-950 border-zinc-800 py-4"
              : "bg-white border-gray-200 py-4"
            : "bg-transparent border-transparent py-8"
        }`}
      >
        <nav
          className={`flex justify-between items-center transition-all duration-500 ${
            scrolled ? (dark ? "text-white" : "text-black") : "text-white mix-blend-difference"
          }`}
        >
          <h1 className="text-xl font-black tracking-tighter">
            GNC. <span className="font-light italic text-sm tracking-normal">Ganjlik Mall</span>
          </h1>

          <div className="flex items-center gap-8">
            <ul className="hidden md:flex gap-10">
              <li>
                <a
                  href="#team-section"
                  className="text-[10px] uppercase tracking-[0.4em] font-light hover:opacity-50 transition"
                >
                  {t.nav.staff}
                </a>
              </li>
              <li>
                <a
                  href="#moments"
                  className="text-[10px] uppercase tracking-[0.4em] font-light hover:opacity-50 transition"
                >
                  {t.nav.moments}
                </a>
              </li>
            </ul>

            <div className="hidden md:block w-[1px] h-4 bg-white/30" />

            <LanguageSwitcher />

            <button
              type="button"
              onClick={() => setDark((v) => !v)}
              className="hidden md:block hover:opacity-50 transition cursor-pointer text-xs"
              title={dark ? t.nav.lightMode : t.nav.darkMode}
              aria-label={dark ? t.nav.lightMode : t.nav.darkMode}
            >
              <i className={`fa-solid ${dark ? "fa-sun" : "fa-moon"}`} />
            </button>

            <div className="hidden md:block w-[1px] h-4 bg-white/30" />

            <div className="flex gap-6">
              <Link to="/auth" className="text-[10px] uppercase tracking-[0.4em] font-bold hover:opacity-50 transition">
                {t.nav.login}
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden text-base px-1 -mr-1"
              aria-label={t.nav.menu}
              aria-expanded={mobileMenuOpen}
            >
              <i className={`fa-solid ${mobileMenuOpen ? "fa-xmark" : "fa-bars"}`} />
            </button>
          </div>
        </nav>

      </header>

      {/* Rendered with its own solid background (not inside <header>) so it stays
          legible regardless of the header's transparent/white scroll state. */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-0 left-0 w-full z-[99] bg-black text-white pt-24 pb-8 px-6 flex flex-col gap-6 border-b border-white/10">
          <a
            href="#team-section"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[11px] uppercase tracking-[0.4em] font-light"
          >
            {t.nav.staff}
          </a>
          <a
            href="#moments"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[11px] uppercase tracking-[0.4em] font-light"
          >
            {t.nav.moments}
          </a>
          <button
            type="button"
            onClick={() => setDark((v) => !v)}
            className="flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] font-light"
          >
            <i className={`fa-solid ${dark ? "fa-sun" : "fa-moon"}`} />
            {dark ? t.nav.lightMode : t.nav.darkMode}
          </button>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative h-dvh flex items-center justify-center overflow-hidden">
        <img src={heroImage} className="absolute w-full h-full object-cover opacity-40 animate-infinite-zoom" alt="" />

        <div className="relative z-10 text-center px-4 animate-entrance">
          <span className="text-[10px] uppercase tracking-[0.6em] mb-6 block text-white/60">{t.hero.eyebrow}</span>
          <h1 className="text-6xl md:text-[120px] font-black leading-none uppercase tracking-tighter text-white">
            <span>{heroTitle}</span> <br />
            <span className="text-outline font-fashion italic lowercase tracking-normal font-light">{t.hero.team}</span>
          </h1>
          <p className="mt-8 text-gray-400 font-light text-sm md:text-base max-w-lg mx-auto leading-relaxed uppercase tracking-widest">
            {t.hero.subtitle}
          </p>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-30 text-white">
          <span className="text-[9px] uppercase tracking-widest">{t.hero.scroll}</span>
        </div>
      </section>

      {/* VIDEO SECTION */}
      <section className="py-24 bg-black overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="relative h-[70vh] bg-gradient-to-br from-zinc-800 via-zinc-900 to-black group overflow-hidden rounded-sm border border-white/10">
            <div
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.25) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />

            <video
              ref={showcaseVideoRef}
              muted
              loop
              playsInline
              preload="none"
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-1000"
            >
              <source src={energyVideo} type="video/mp4" />
              {t.video.unsupported}
            </video>

            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 pointer-events-none" />

            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-10 z-10">
              <span className="text-[10px] uppercase tracking-[0.8em] text-white/60 mb-6 block">
                {t.video.essence}
              </span>

              <h2 className="text-6xl md:text-9xl font-fashion italic text-white tracking-tighter">
                {t.video.energy} <span className="text-outline">{t.video.energyOutline}</span>
              </h2>

              <div className="mt-12">
                <button
                  onClick={() => navigate("/moments")}
                  className="relative group/btn overflow-hidden px-16 py-4 border border-white/30 text-white text-[10px] uppercase tracking-[0.5em] transition-all duration-500 hover:border-white hover:text-black cursor-pointer"
                >
                  <span className="relative z-10">{t.video.explore}</span>
                  <div className="absolute inset-0 bg-white translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-out" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Store Philosophy */}
      <section className={`py-24 px-6 ${dark ? "bg-zinc-950 text-white" : "bg-white text-black"}`}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">
              {t.philosophy.title} <span className="font-fashion italic font-light lowercase text-5xl">{t.philosophy.titleAccent}</span>
            </h2>
            <p
              className={`font-light leading-relaxed border-l-2 pl-6 ${
                dark ? "text-zinc-400 border-white" : "text-gray-600 border-black"
              }`}
            >
              {t.philosophy.text}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-6">
              <div className={`p-6 rounded-sm border ${dark ? "bg-zinc-900 border-zinc-800" : "bg-gray-50 border-gray-100"}`}>
                <span className="block text-3xl font-bold">#1</span>
                <span className={`text-[10px] uppercase tracking-widest font-bold ${dark ? "text-zinc-500" : "text-gray-400"}`}>
                  {t.philosophy.statTeam}
                </span>
              </div>
              <div className={`p-6 rounded-sm border ${dark ? "bg-zinc-900 border-zinc-800" : "bg-gray-50 border-gray-100"}`}>
                <span className="block text-3xl font-bold">24/7</span>
                <span className={`text-[10px] uppercase tracking-widest font-bold ${dark ? "text-zinc-500" : "text-gray-400"}`}>
                  {t.philosophy.statActive}
                </span>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 border-[10px] border-black/5 -m-4 group-hover:m-0 transition-all duration-500" />
            <img
              src={DEFAULT_HERO_IMAGE}
              loading="lazy"
              decoding="async"
              className="w-full h-[400px] object-cover grayscale group-hover:grayscale-0 transition duration-700 shadow-2xl"
              alt=""
            />
          </div>
        </div>
      </section>

      {/* Professional Standards & Values */}
      <section className={`py-24 ${dark ? "bg-zinc-950 text-zinc-50" : "bg-[#fafafa] text-[#1a1a1a]"}`}>
        <div className="max-w-[1400px] mx-auto px-8">
          <div
            className={`flex flex-col md:flex-row justify-between items-center md:items-end mb-10 md:mb-20 border-b pb-6 md:pb-10 text-center md:text-left w-full px-4 md:px-0 ${
              dark ? "border-zinc-800" : "border-gray-200"
            }`}
          >
            <div className="max-w-2xl w-full">
              <span className={`text-xs uppercase tracking-[0.3em] mb-2 md:mb-4 block italic ${dark ? "text-zinc-500" : "text-gray-500"}`}>
                {t.basics.eyebrow}
              </span>
              <h2 className="text-4xl md:text-7xl font-['Playfair_Display'] font-light tracking-tighter uppercase leading-none mb-4 md:mb-0">
                {t.basics.title}
              </h2>
            </div>
            <p className={`text-xs md:text-sm max-w-xs mx-auto md:mx-0 mt-2 md:mt-0 leading-relaxed uppercase ${dark ? "text-zinc-500" : "text-gray-400"}`}>
              {t.basics.subtitle}
            </p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] border ${dark ? "bg-zinc-800 border-zinc-800" : "bg-gray-200 border-gray-200"}`}>
            {t.basics.cards.map((card) => (
              <div
                key={card.n}
                className={`group p-8 md:p-12 h-auto md:h-[350px] flex flex-col justify-between transition-all duration-700 ease-in-out cursor-default ${
                  dark ? "bg-zinc-900 hover:bg-white" : "bg-white hover:bg-black"
                }`}
              >
                <div>
                  <span
                    className={`text-[10px] font-bold tracking-widest transition-colors uppercase ${
                      dark ? "text-zinc-500 group-hover:text-zinc-500" : "text-gray-500 md:text-gray-400 group-hover:text-gray-500"
                    }`}
                  >
                    {card.n}
                  </span>
                  <h3
                    className={`text-xl md:text-2xl mt-4 md:mt-6 uppercase tracking-tight transition-colors font-medium ${
                      dark ? "text-white group-hover:text-black" : "group-hover:text-white"
                    }`}
                  >
                    {card.title}
                  </h3>
                </div>
                <div className="overflow-hidden mt-4 md:mt-0">
                  <p
                    className={`text-sm leading-relaxed transform translate-y-0 md:translate-y-20 group-hover:translate-y-0 transition-all duration-500 ${
                      dark ? "text-zinc-400 group-hover:text-zinc-700" : "text-gray-600 md:text-gray-500 group-hover:text-gray-300"
                    } ${card.italic ? "italic" : ""}`}
                  >
                    {card.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values - sticky stack */}
      <section className={`py-24 px-6 md:px-16 font-sans relative overflow-hidden ${dark ? "bg-zinc-950" : "bg-white"}`}>
        <div className={`absolute top-10 left-10 w-32 h-[1px] ${dark ? "bg-white/5" : "bg-black/5"}`} />
        <div className="absolute bottom-10 right-10 flex gap-2">
          <div className={`w-3 h-3 rounded-full ${dark ? "bg-white/10" : "bg-black/10"}`} />
          <div className={`w-3 h-3 rounded-full ${dark ? "bg-white/10" : "bg-black/10"}`} />
          <div className={`w-3 h-3 rounded-full ${dark ? "bg-white/10" : "bg-black/10"}`} />
        </div>

        <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-20 items-start relative z-10">
          <div className="lg:w-1/3 lg:sticky lg:top-20">
            <div className="relative">
              <h2 className={`text-6xl font-light tracking-tighter leading-[0.8] uppercase ${dark ? "text-white" : "text-black"}`}>
                {t.coreValues.title}
                <br />
                <span className="font-serif italic lowercase text-gray-400 tracking-normal">{t.coreValues.titleAccent}</span>
              </h2>

              <div className="mt-12 space-y-8">
                <div className="flex items-center gap-4">
                  <div className={`h-[1px] w-20 ${dark ? "bg-white" : "bg-black"}`} />
                  <div className={`w-2 h-2 border rotate-45 ${dark ? "border-white" : "border-black"}`} />
                </div>
                <p className={`text-[11px] uppercase tracking-[0.25em] leading-relaxed max-w-[220px] ${dark ? "text-white" : "text-black"}`}>
                  {t.coreValues.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div
            className="lg:w-2/3 w-full h-[500px] overflow-y-scroll pr-4 relative scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {[
              { ...t.coreValues.cards[0], bg: "bg-black", top: "top-0", z: "z-10", shadow: "shadow-2xl" },
              { ...t.coreValues.cards[1], bg: "bg-[#1a1a1a]", top: "top-6", z: "z-20", shadow: "shadow-[-10px_-20px_40px_rgba(0,0,0,0.2)] border border-white/5" },
              { ...t.coreValues.cards[2], bg: "bg-[#222222]", top: "top-12", z: "z-30", shadow: "shadow-[-10px_-20px_50px_rgba(0,0,0,0.3)] border border-white/5" },
              { ...t.coreValues.cards[3], bg: "bg-[#2a2a2a]", top: "top-18", z: "z-40", shadow: "shadow-[-10px_-20px_60px_rgba(0,0,0,0.4)] border border-white/5" },
            ].map((card) => (
              <div key={card.n} className={`sticky ${card.top} ${card.z} mb-6 h-[240px]`}>
                <div
                  className={`${card.bg} text-white w-full h-full p-10 flex flex-col justify-between rounded-[2rem] ${card.shadow} transition-transform duration-500 hover:scale-[0.98]`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-medium tracking-[0.5em] text-gray-500 uppercase font-mono">
                      {card.n}
                    </span>
                    <div className="w-8 h-[1px] bg-white/20" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-light tracking-widest uppercase mb-3">{card.title}</h3>
                    <p className="text-[12px] text-gray-400 leading-relaxed max-w-md">{card.text}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="sticky top-24 z-50 h-[240px]">
              <div className="bg-white text-black w-full h-full p-10 flex flex-col justify-between rounded-[2rem] shadow-[-10px_-30px_70px_rgba(0,0,0,0.15)] border border-black/5 transition-transform duration-500 hover:scale-[0.98]">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold tracking-[0.5em] text-black uppercase font-mono">
                    {t.coreValues.excellence.n}
                  </span>
                  <div className="w-8 h-[2px] bg-black" />
                </div>
                <div>
                  <h3 className="text-2xl font-light tracking-widest uppercase mb-3">{t.coreValues.excellence.title}</h3>
                  <p className="text-[12px] text-gray-600 leading-relaxed max-w-md font-medium">
                    {t.coreValues.excellence.text}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[120px]" />
          </div>
        </div>
      </section>

      {/* THE STAFF */}
      <section id="team-section" className="py-24 bg-black overflow-hidden select-none">
        <div className="max-w-7xl mx-auto px-6 space-y-20">
          <div className="relative group/row">
            <div className="mb-8 space-y-1">
              <span className="text-[8px] uppercase tracking-[0.6em] text-white/30 block">{t.staff.teamDirectory}</span>
              <h2 className="font-sync text-xl md:text-2xl font-bold tracking-tighter text-white uppercase">
                {t.staff.theCrew}
              </h2>
            </div>
            <TeamSwiper collectionName="crew" swiperClass="crewSwiper" prevClass="crew-prev" nextClass="crew-next" />
          </div>

          <div className="relative group/row">
            <div className="mt-10 mb-8 space-y-1">
              <h2 className="font-sync text-xl md:text-2xl font-bold tracking-tighter text-white uppercase">
                {t.staff.theStaff}
              </h2>
              <p className="text-[8px] uppercase tracking-[0.5em] text-white/20">{t.staff.members}</p>
            </div>
            <TeamSwiper
              collectionName="staff"
              swiperClass="staffSwiper"
              prevClass="staff-prev"
              nextClass="staff-next"
            />
          </div>
        </div>
      </section>

      {/* MOMENTS (static gallery) */}
      <section id="moments" className={`py-32 px-6 md:px-20 ${dark ? "bg-zinc-950 text-white" : "bg-white text-black"}`}>
        <div className="max-w-7xl mx-auto">
          <div className={`flex flex-col md:flex-row justify-between items-baseline mb-16 border-b pb-10 ${dark ? "border-white/10" : "border-black/5"}`}>
            <h2 className="text-5xl font-black uppercase tracking-tighter italic font-fashion">{t.moments.title}</h2>
            <p className={`text-[10px] uppercase tracking-[0.4em] mt-4 md:mt-0 ${dark ? "text-zinc-500" : "text-gray-400"}`}>
              {t.moments.edition}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <Link to="/briefings" className="md:col-span-7 group relative overflow-hidden moment-card block">
              <img
                src="https://images.unsplash.com/photo-1515168833906-d2a3b82b302a"
                loading="lazy"
                decoding="async"
                className="w-full h-[600px] object-cover grayscale group-hover:grayscale-0 transition duration-1000 scale-100 group-hover:scale-105"
                alt=""
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                <span className="text-white text-[10px] uppercase tracking-[0.5em] font-bold">{t.moments.viewBriefings}</span>
              </div>
              <div className="absolute bottom-8 left-8 text-white moment-info">
                <span className="text-[10px] uppercase tracking-widest bg-black px-3 py-1">{t.moments.morningBriefing}</span>
              </div>
            </Link>

            <div className="md:col-span-5 flex flex-col gap-6">
              <div className="group relative overflow-hidden moment-card h-[288px]">
                <img
                  src="https://images.unsplash.com/photo-1492724441997-5dc865305da7"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-1000"
                  alt=""
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <span className="text-white text-[10px] uppercase tracking-[0.5em] font-bold">
                    {t.moments.newCollection}
                  </span>
                </div>
              </div>
              <div className="group relative overflow-hidden moment-card h-[288px]">
                <img
                  src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-1000"
                  alt=""
                />
                <div className="absolute bottom-8 right-8 text-white moment-info">
                  <span className="text-[9px] uppercase tracking-widest opacity-60 italic leading-none">
                    40.4000° N, 49.8500° E
                  </span>
                </div>
              </div>
            </div>

            <div className={`md:col-span-12 group relative overflow-hidden h-[500px] mt-4 ${dark ? "bg-zinc-900" : "bg-gray-100"}`}>
              <img
                src="https://picsum.photos/id/445/1200/600"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-[2000ms] opacity-60 group-hover:opacity-100"
                alt="Store Interior"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-700 flex flex-col items-center justify-center text-white">
                <h3 className="text-4xl md:text-7xl font-fashion italic opacity-0 group-hover:opacity-100 transition-all duration-1000 translate-y-10 group-hover:translate-y-0">
                  {t.moments.atmosphere}
                </h3>
                <p className="text-[10px] uppercase tracking-[0.5em] mt-4 opacity-0 group-hover:opacity-60 transition-all duration-1000">
                  {t.moments.experience}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* In-Store Digitalization */}
      <section className="py-32 bg-[#050505] text-white px-6 md:px-20 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <span className="text-[10px] uppercase tracking-[0.5em] text-blue-500 font-bold">{t.digital.eyebrow}</span>
              <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                {t.digital.title} <br /> <span className="text-outline font-fashion italic lowercase font-light">{t.digital.titleAccent}</span>
              </h2>
              <p className="text-gray-400 font-light leading-relaxed max-w-md">
                {t.digital.text}
              </p>

              <div className="space-y-4 pt-6">
                <div className="flex items-center gap-4 group cursor-help">
                  <div className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-150 transition-transform" />
                  <span className="text-xs uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                    {t.digital.point1}
                  </span>
                </div>
                <div className="flex items-center gap-4 group cursor-help">
                  <div className="w-2 h-2 bg-white rounded-full group-hover:scale-150 transition-transform" />
                  <span className="text-xs uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                    {t.digital.point2}
                  </span>
                </div>
                <div className="flex items-center gap-4 group cursor-help">
                  <div className="w-2 h-2 bg-white rounded-full group-hover:scale-150 transition-transform" />
                  <span className="text-xs uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                    {t.digital.point3}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative px-10 py-20 glass-card rounded-lg overflow-hidden group">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] group-hover:bg-blue-500/20 transition-all duration-700" />

              <div className="relative z-10 space-y-6">
                <div className="h-1 w-20 bg-blue-500" />
                <p className="text-sm font-light italic text-gray-300 leading-relaxed">
                  {t.digital.quote}
                </p>
                <div className="pt-4">
                  <span className="text-[9px] uppercase tracking-[0.4em] text-gray-500">{t.digital.proposedBy}</span>
                  <p className="text-lg font-bold tracking-tight uppercase">Həmid Ağabəyov</p>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 opacity-10 font-mono text-[10px] text-blue-400 select-none">
                const store = "Zara Genclik"; <br />
                if (hamid.isCoding) {"{"} <br />
                &nbsp;&nbsp;efficiency.increase(); <br />
                {"}"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className={`pt-24 pb-12 px-6 md:px-20 border-t ${
          dark ? "bg-zinc-950 text-white border-zinc-800" : "bg-white text-black border-gray-100"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
            <div className="space-y-6">
              <h4 className={`text-[10px] uppercase tracking-[0.4em] font-bold italic ${dark ? "text-zinc-500" : "text-gray-400"}`}>
                {t.footer.identity}
              </h4>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tighter uppercase leading-none">{t.footer.teamName}</span>
                <span className="text-[10px] uppercase tracking-[0.3em] font-light mt-2">{t.footer.storeLine}</span>
              </div>
              <p className={`text-[11px] leading-relaxed max-w-xs uppercase tracking-tighter font-medium ${dark ? "text-zinc-400" : "text-gray-500"}`}>
                {t.footer.identityText}
              </p>
            </div>

            <div className={`space-y-6 border-l md:border-l-0 md:pl-0 pl-6 ${dark ? "border-zinc-800" : "border-gray-100"}`}>
              <h4 className={`text-[10px] uppercase tracking-[0.4em] font-bold italic ${dark ? "text-zinc-500" : "text-gray-400"}`}>
                {t.footer.engineering}
              </h4>
              <ul className="space-y-3">
                <li className="text-[10px] uppercase tracking-widest font-bold hover:translate-x-2 transition-transform cursor-default">
                  {t.footer.builtWith}
                </li>
                <li className="text-[10px] uppercase tracking-widest font-bold hover:translate-x-2 transition-transform cursor-default text-blue-500">
                  {t.footer.reactFirebase}
                </li>
                <li className="text-[10px] uppercase tracking-widest font-bold hover:translate-x-2 transition-transform cursor-default">
                  {t.footer.responsive}
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className={`text-[10px] uppercase tracking-[0.4em] font-bold italic ${dark ? "text-zinc-500" : "text-gray-400"}`}>
                {t.footer.navigation}
              </h4>
              <div className="flex flex-col gap-4">
                <a
                  href="#"
                  className="text-[10px] uppercase tracking-[0.3em] font-medium hover:opacity-50 transition underline underline-offset-4"
                >
                  {t.footer.topOfPage}
                </a>
                <a href="#moments" className="text-[10px] uppercase tracking-[0.3em] font-medium hover:opacity-50 transition">
                  {t.footer.archive}
                </a>
                <div className="pt-4 flex gap-6">
                  <span
                    className={`text-[9px] font-black border px-2 py-1 cursor-pointer transition ${
                      dark ? "border-white hover:bg-white hover:text-black" : "border-black hover:bg-black hover:text-white"
                    }`}
                  >
                    IG
                  </span>
                  <span
                    className={`text-[9px] font-black border px-2 py-1 cursor-pointer transition ${
                      dark ? "border-white hover:bg-white hover:text-black" : "border-black hover:bg-black hover:text-white"
                    }`}
                  >
                    LN
                  </span>
                  <span
                    className={`text-[9px] font-black border px-2 py-1 cursor-pointer transition ${
                      dark ? "border-white hover:bg-white hover:text-black" : "border-black hover:bg-black hover:text-white"
                    }`}
                  >
                    GH
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={`flex flex-col md:flex-row justify-between items-center pt-10 border-t gap-6 ${dark ? "border-zinc-800" : "border-gray-100"}`}>
            <div className={`text-[9px] uppercase tracking-[0.5em] font-light ${dark ? "text-zinc-500" : "text-gray-400"}`}>
              © 2026 <span className={`font-bold ${dark ? "text-white" : "text-black"}`}>Həmid Ağabəyov</span>. {t.footer.rights}
            </div>

            <div className="flex flex-col items-end opacity-20 hover:opacity-100 transition duration-1000">
              <div className="flex gap-[2px] h-6 items-end">
                <div className={`w-[1px] h-full ${dark ? "bg-white" : "bg-black"}`} />
                <div className={`w-[2px] h-full ${dark ? "bg-white" : "bg-black"}`} />
                <div className={`w-[1px] h-4 ${dark ? "bg-white" : "bg-black"}`} />
                <div className={`w-[3px] h-full ${dark ? "bg-white" : "bg-black"}`} />
                <div className={`w-[1px] h-5 ${dark ? "bg-white" : "bg-black"}`} />
                <div className={`w-[2px] h-full ${dark ? "bg-white" : "bg-black"}`} />
                <div className={`w-[1px] h-3 ${dark ? "bg-white" : "bg-black"}`} />
                <div className={`w-[1px] h-full ${dark ? "bg-white" : "bg-black"}`} />
              </div>
              <span className="text-[7px] tracking-[0.2em] mt-1 font-mono">032026-GNC-ZARA</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
