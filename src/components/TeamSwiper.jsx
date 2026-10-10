import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel, Navigation } from "swiper/modules";
import { listMembers } from "../lib/api";
import "swiper/css";

const DEFAULT_AVATAR =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

const BREAKPOINTS = {
  480: { slidesPerView: 2.2, spaceBetween: 20 },
  768: { slidesPerView: 3.2, spaceBetween: 24 },
  1024: { slidesPerView: 4, spaceBetween: 30 },
  1440: { slidesPerView: 5, spaceBetween: 35 },
};

export default function TeamSwiper({ collectionName, swiperClass, prevClass, nextClass }) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    listMembers(collectionName)
      .then(setMembers)
      .catch((error) => console.error("Komanda siyahısı yüklənərkən xəta:", error));
  }, [collectionName]);

  return (
    <div className="relative w-full">
      <Swiper
        modules={[Navigation, FreeMode, Mousewheel]}
        slidesPerView={1.5}
        spaceBetween={16}
        grabCursor
        freeMode={{ enabled: true, sticky: false, momentumBounce: false }}
        mousewheel={{ forceToAxis: true }}
        speed={800}
        breakpoints={BREAKPOINTS}
        navigation={{ prevEl: `.${prevClass}`, nextEl: `.${nextClass}` }}
        className={`${swiperClass} w-full`}
      >
        {members.map((member, index) => (
          <SwiperSlide key={index} className="group cursor-pointer !flex !flex-col !items-center !justify-center !text-center !h-auto">
            <div className="rounded-full overflow-hidden bg-white/5 mb-4 border border-white/5 relative select-none w-40 h-40 min-w-40 min-h-40 flex items-center justify-center">
              <img
                src={member.image || DEFAULT_AVATAR}
                alt={member.name || ""}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-all duration-[1000ms] ease-out grayscale-0 scale-105 md:grayscale md:scale-100 md:group-hover:grayscale-0 md:group-hover:scale-105"
              />
            </div>
            <div className="space-y-1 transition-transform duration-300 w-full -translate-y-1 md:translate-y-0 md:group-hover:-translate-y-1 flex flex-col items-center justify-center">
              <h3 className="font-semibold text-[11px] text-white tracking-[0.08em] block whitespace-normal break-words px-2 text-center w-full">
                {member.name || ""}
              </h3>
              <p className="text-[8px] text-white/30 tracking-[0.3em] uppercase block whitespace-normal break-words px-2 text-center w-full">
                {member.role || ""}
              </p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <button
        className={`${prevClass} absolute left-[-20px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-black/80 border border-white/10 rounded-full text-white/40 hover:text-white hover:border-white/30 transition-all opacity-0 group-hover/row:opacity-100 disabled:opacity-0 cursor-pointer hidden md:flex`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        className={`${nextClass} absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-black/80 border border-white/10 rounded-full text-white/40 hover:text-white hover:border-white/30 transition-all opacity-0 group-hover/row:opacity-100 disabled:opacity-0 cursor-pointer hidden md:flex`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
