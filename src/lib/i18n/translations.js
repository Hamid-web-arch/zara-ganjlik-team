import { commonStrings } from "./strings/common";
import { staffScheduleStrings } from "./strings/staffSchedule";
import { briefingsStrings } from "./strings/briefings";
import { commentsStrings } from "./strings/comments";

export const LANGUAGES = [
  { code: "az", label: "AZ" },
  { code: "en", label: "EN" },
  { code: "ru", label: "RUS" },
];

export const DEFAULT_LANGUAGE = "az";

export const translations = {
  az: {
    nav: {
      staff: "The Staff",
      moments: "Moments",
      login: "Login",
    },
    hero: {
      eyebrow: "Retail Excellence",
      team: "team",
      subtitle: "Komandadan daha çox — biz enerji və stil yaradırıq.",
      scroll: "Scroll",
    },
    video: {
      essence: "The Essence of Style",
      energy: "Our",
      energyOutline: "Energy",
      explore: "Explore Moments",
      unsupported: "Sizin brauzer video dəstəkləmir.",
    },
    philosophy: {
      title: "Bizim",
      titleAccent: "Məqsədimiz",
      text: "Genclik Mall Zara komandası olaraq hədəfimiz hər zaman ən yüksək xidmət keyfiyyətini təmin etməkdir. Bu sayt bizim daxili enerjimizi və peşəkarlığımızı rəqəmsal platformada əks etdirir.",
      statTeam: "Team Spirit",
      statActive: "Active Flow",
    },
    basics: {
      eyebrow: "Corporate Excellence",
      title: "6 basics",
      subtitle: "Yolumuzu müəyyən edir: Peşəkar standartlar əsas dəyərlərimizlə görüşür.",
      cards: [
        { n: "01 / Xidmət", title: "Friendly Look", text: "Xoş atmosfer yaratmaq üçün hər qonağı isti təbəssüm və pozitiv enerji ilə qarşılamaq." },
        { n: "02 / Əsas Dəyər", title: "Always Accessible", text: "Komandamıza və tərəfdaşlarımıza ehtiyac olduqda dəstək olmaq üçün daim əlçatan olmaq və açıq ünsiyyət qurmaq." },
        { n: "03 / Xidmət", title: "Offer Alternatives", text: "Müştərilərin seçimlərinə uyğun stilli alternativlər təklif edərək məmnuniyyəti təmin etmək." },
        { n: "04 / Satış Strategiyası", title: "Fitting Room Sales", text: "Zümrə otağı təcrübəsini fərdiləşdirilmiş stil sessiyasına çevirərək məşğulluğu artırmaq." },
        { n: "05 / Kassa", title: "Checkout Service", text: "Səyahəti birbaşa göz təması və səmimi minnətdarlıqla bitirərək müştəri sədaqətini qurmaq." },
        { n: "06 / Liderlik", title: "Managerial Impact", text: '"Menecer müştərilərlə ən çox təmasda olan şəxsdir" — mağaza səviyyəli liderliklə uğur qazanmaq.', italic: true },
      ],
    },
    coreValues: {
      title: "Our Core",
      titleAccent: "Values",
      subtitle: "Strateji prinsiplərimiz vasitəsilə mükəmməlliyi müəyyən etmək.",
      cards: [
        { n: "01 / Evolution", title: "Internal Promotion", text: "Komandamızın hər səviyyədə karyera irəliləyişini dəstəkləyərək peşəkar inkişafa üstünlük veririk." },
        { n: "02 / Transparency", title: "Open Communication", text: "Təşkilatın bütün səviyyələrində şəffaflığı və aktiv dinləməni təşviq edirik." },
        { n: "03 / Momentum", title: "Fast Decision Making", text: "Çətinlikləri həll etmək və fürsətləri qiymətləndirmək üçün çeviklik və inamla hərəkət edirik." },
        { n: "04 / Integrity", title: "Fair & Respectful", text: "Qarşılıqlı hörmət və bərabər imkanlar üzərində qurulmuş peşəkar mühit saxlayırıq." },
      ],
      excellence: {
        n: "05 / Excellence",
        title: "High Demanding",
        text: "Bütün fəaliyyətlərimizdə davamlı mükəmməlliyi təmin etmək üçün özümüzə yüksək standartlar qoyuruq.",
      },
    },
    staff: {
      teamDirectory: "Team Directory",
      theCrew: "The Crew",
      theStaff: "The Staff",
      members: "6615-GENCLIK TEAM MEMBERS",
    },
    moments: {
      title: "Moments",
      edition: "Genclik Mall / Spring Edition 2026",
      viewBriefings: "View Briefings",
      morningBriefing: "Morning Briefing",
      newCollection: "New Collection Setup",
      atmosphere: "Our Atmosphere",
      experience: "Genclik Mall Experience",
    },
    digital: {
      eyebrow: "Innovation",
      title: "Digital",
      titleAccent: "Integration",
      text: "Gələcəyin retail təcrübəsi texnologiya ilə birləşir. Frontend developer olaraq, mağaza daxili prosesləri sürətləndirən interaktiv interfeyslər hazırlamağa hazıram.",
      point1: "Smart Inventory Check",
      point2: "Interactive Lookbook",
      point3: "Real-time Team Analytics",
      quote: '"Məqsədim Genclik Mall Zara mağazasının iş axınını rəqəmsal həllərlə daha effektiv hala gətirməkdir."',
      proposedBy: "Proposed by",
    },
    footer: {
      identity: "Identity",
      teamName: "GNC Team",
      storeLine: "Genclik Mall / Store 6615",
      identityText: "Bu platforma komandamızın gündəlik enerjisini və peşəkarlığını vizuallaşdırmaq üçün yaradılmış özəl rəqəmsal məkandır.",
      engineering: "Engineering",
      builtWith: "Built with Tailwind CSS",
      reactFirebase: "React + Firebase Engine",
      responsive: "Responsive Architecture",
      navigation: "Navigation",
      topOfPage: "Top of Page",
      archive: "The Archive",
      rights: "All Rights Reserved.",
    },
  },
  en: {
    nav: {
      staff: "The Staff",
      moments: "Moments",
      login: "Login",
    },
    hero: {
      eyebrow: "Retail Excellence",
      team: "team",
      subtitle: "More than a team — we create energy and style.",
      scroll: "Scroll",
    },
    video: {
      essence: "The Essence of Style",
      energy: "Our",
      energyOutline: "Energy",
      explore: "Explore Moments",
      unsupported: "Your browser does not support the video tag.",
    },
    philosophy: {
      title: "Our",
      titleAccent: "Mission",
      text: "As the Genclik Mall Zara team, our goal is to always ensure the highest quality of service. This site reflects our internal energy and professionalism on a digital platform.",
      statTeam: "Team Spirit",
      statActive: "Active Flow",
    },
    basics: {
      eyebrow: "Corporate Excellence",
      title: "6 basics",
      subtitle: "Defining our path: Professional standards meet our core values.",
      cards: [
        { n: "01 / Service", title: "Friendly Look", text: "Welcoming every guest with a warm smile and positive energy to create a pleasant atmosphere." },
        { n: "02 / Core Value", title: "Always Accessible", text: "Ensuring continuous availability and open communication, remaining fully prepared to support our team and partners whenever needed." },
        { n: "03 / Service", title: "Offer Alternatives", text: "Ensuring customer satisfaction by suggesting stylish substitutes that perfectly match their preferences." },
        { n: "04 / Sales Strategy", title: "Fitting Room Sales", text: "Transforming the fitting room experience into a personalized styling session to maximize engagement." },
        { n: "05 / Checkout", title: "Checkout Service", text: "Ending the journey with direct eye contact and sincere gratitude to build lasting customer loyalty." },
        { n: "06 / Leadership", title: "Managerial Impact", text: '"The Manager makes contact with customers the most" — driving success through floor-level leadership.', italic: true },
      ],
    },
    coreValues: {
      title: "Our Core",
      titleAccent: "Values",
      subtitle: "Defining excellence through our strategic principles.",
      cards: [
        { n: "01 / Evolution", title: "Internal Promotion", text: "We prioritize professional growth within our team, supporting career advancement at every level." },
        { n: "02 / Transparency", title: "Open Communication", text: "We foster transparency and active listening across all levels of the organization." },
        { n: "03 / Momentum", title: "Fast Decision Making", text: "We act with agility and confidence to resolve challenges and seize opportunities." },
        { n: "04 / Integrity", title: "Fair & Respectful", text: "We maintain a professional environment built on mutual respect and equal opportunity." },
      ],
      excellence: {
        n: "05 / Excellence",
        title: "High Demanding",
        text: "We set high standards for ourselves to ensure continuous excellence in all our actions.",
      },
    },
    staff: {
      teamDirectory: "Team Directory",
      theCrew: "The Crew",
      theStaff: "The Staff",
      members: "6615-GENCLIK TEAM MEMBERS",
    },
    moments: {
      title: "Moments",
      edition: "Genclik Mall / Spring Edition 2026",
      viewBriefings: "View Briefings",
      morningBriefing: "Morning Briefing",
      newCollection: "New Collection Setup",
      atmosphere: "Our Atmosphere",
      experience: "Genclik Mall Experience",
    },
    digital: {
      eyebrow: "Innovation",
      title: "Digital",
      titleAccent: "Integration",
      text: "The future of retail experience merges with technology. As a frontend developer, I'm ready to build interactive interfaces that speed up in-store processes.",
      point1: "Smart Inventory Check",
      point2: "Interactive Lookbook",
      point3: "Real-time Team Analytics",
      quote: '"My goal is to make the Genclik Mall Zara store workflow more efficient through digital solutions."',
      proposedBy: "Proposed by",
    },
    footer: {
      identity: "Identity",
      teamName: "GNC Team",
      storeLine: "Genclik Mall / Store 6615",
      identityText: "This platform is a private digital space created to visualize our team's daily energy and professionalism.",
      engineering: "Engineering",
      builtWith: "Built with Tailwind CSS",
      reactFirebase: "React + Firebase Engine",
      responsive: "Responsive Architecture",
      navigation: "Navigation",
      topOfPage: "Top of Page",
      archive: "The Archive",
      rights: "All Rights Reserved.",
    },
  },
  ru: {
    nav: {
      staff: "The Staff",
      moments: "Moments",
      login: "Login",
    },
    hero: {
      eyebrow: "Retail Excellence",
      team: "team",
      subtitle: "Больше, чем команда — мы создаём энергию и стиль.",
      scroll: "Scroll",
    },
    video: {
      essence: "The Essence of Style",
      energy: "Our",
      energyOutline: "Energy",
      explore: "Explore Moments",
      unsupported: "Ваш браузер не поддерживает воспроизведение видео.",
    },
    philosophy: {
      title: "Наша",
      titleAccent: "Миссия",
      text: "Как команда Genclik Mall Zara, наша цель — всегда обеспечивать высочайшее качество обслуживания. Этот сайт отражает нашу внутреннюю энергию и профессионализм на цифровой платформе.",
      statTeam: "Team Spirit",
      statActive: "Active Flow",
    },
    basics: {
      eyebrow: "Corporate Excellence",
      title: "6 basics",
      subtitle: "Определяем наш путь: профессиональные стандарты встречаются с нашими ценностями.",
      cards: [
        { n: "01 / Сервис", title: "Friendly Look", text: "Встречаем каждого гостя с тёплой улыбкой и позитивной энергией, создавая приятную атмосферу." },
        { n: "02 / Ценность", title: "Always Accessible", text: "Обеспечиваем постоянную доступность и открытое общение, всегда готовы поддержать команду и партнёров." },
        { n: "03 / Сервис", title: "Offer Alternatives", text: "Обеспечиваем удовлетворённость клиентов, предлагая стильные альтернативы, соответствующие их предпочтениям." },
        { n: "04 / Стратегия продаж", title: "Fitting Room Sales", text: "Превращаем примерку в персонализированную стилистическую сессию для максимальной вовлечённости." },
        { n: "05 / Касса", title: "Checkout Service", text: "Завершаем путь клиента прямым зрительным контактом и искренней благодарностью, укрепляя лояльность." },
        { n: "06 / Лидерство", title: "Managerial Impact", text: '«Менеджер чаще всех контактирует с клиентами» — успех через лидерство на местах.', italic: true },
      ],
    },
    coreValues: {
      title: "Our Core",
      titleAccent: "Values",
      subtitle: "Определяем совершенство через наши стратегические принципы.",
      cards: [
        { n: "01 / Эволюция", title: "Internal Promotion", text: "Мы отдаём приоритет профессиональному росту внутри команды, поддерживая карьерное развитие на всех уровнях." },
        { n: "02 / Прозрачность", title: "Open Communication", text: "Мы поощряем прозрачность и активное слушание на всех уровнях организации." },
        { n: "03 / Momentum", title: "Fast Decision Making", text: "Мы действуем гибко и уверенно, решая проблемы и используя возможности." },
        { n: "04 / Честность", title: "Fair & Respectful", text: "Мы поддерживаем профессиональную среду, основанную на взаимном уважении и равных возможностях." },
      ],
      excellence: {
        n: "05 / Excellence",
        title: "High Demanding",
        text: "Мы устанавливаем для себя высокие стандарты, чтобы обеспечить постоянное совершенство во всех действиях.",
      },
    },
    staff: {
      teamDirectory: "Team Directory",
      theCrew: "The Crew",
      theStaff: "The Staff",
      members: "6615-GENCLIK TEAM MEMBERS",
    },
    moments: {
      title: "Moments",
      edition: "Genclik Mall / Spring Edition 2026",
      viewBriefings: "View Briefings",
      morningBriefing: "Morning Briefing",
      newCollection: "New Collection Setup",
      atmosphere: "Our Atmosphere",
      experience: "Genclik Mall Experience",
    },
    digital: {
      eyebrow: "Innovation",
      title: "Digital",
      titleAccent: "Integration",
      text: "Будущее розничной торговли объединяется с технологиями. Как frontend-разработчик, я готов создавать интерактивные интерфейсы, ускоряющие внутренние процессы магазина.",
      point1: "Smart Inventory Check",
      point2: "Interactive Lookbook",
      point3: "Real-time Team Analytics",
      quote: '«Моя цель — сделать рабочий процесс магазина Genclik Mall Zara более эффективным с помощью цифровых решений.»',
      proposedBy: "Proposed by",
    },
    footer: {
      identity: "Identity",
      teamName: "GNC Team",
      storeLine: "Genclik Mall / Store 6615",
      identityText: "Эта платформа — частное цифровое пространство, созданное для визуализации ежедневной энергии и профессионализма нашей команды.",
      engineering: "Engineering",
      builtWith: "Built with Tailwind CSS",
      reactFirebase: "React + Firebase Engine",
      responsive: "Responsive Architecture",
      navigation: "Navigation",
      topOfPage: "Top of Page",
      archive: "The Archive",
      rights: "All Rights Reserved.",
    },
  },
};

// Feature namespaces live in ./strings/*.js so each page copy stays with its code.
// Every module exports { az, en, ru } and is merged in under its own key.
const namespaces = {
  common: commonStrings,
  staffSchedule: staffScheduleStrings,
  briefings: briefingsStrings,
  comments: commentsStrings,
};
for (const lang of Object.keys(translations)) {
  for (const [ns, dict] of Object.entries(namespaces)) {
    translations[lang][ns] = dict[lang];
  }
}
