/* ─────────────────────────────────────────────────────────────
   Geografiya o'yinlari uchun davlatlar ma'lumotlar bazasi.

   Har bir davlat:
     code      — ISO 3166-1 alpha-2 (kichik harf). Bayroq va siluet
                 rasmlari shu kod orqali yuklanadi.
     name      — o'zbekcha nomi
     capital   — poytaxti
     continent — qit'asi
     clues     — 3 ta ipucha (umumiydan aniqqa)

   Rasmlar tashqi CDN'lardan olinadi (backend talab qilmaydi):
     bayroq  →  https://flagcdn.com/w640/{code}.png
     siluet  →  https://cdn.jsdelivr.net/gh/djaiss/mapsicon@master/all/{code}/1024.png
   ───────────────────────────────────────────────────────────── */

export const CONTINENTS = [
  'Osiyo', 'Yevropa', 'Afrika',
  'Shimoliy Amerika', 'Janubiy Amerika', 'Okeaniya',
]

export const COUNTRIES = [
  // ── Osiyo ───────────────────────────────────────────────────
  { code: 'uz', name: "O'zbekiston", capital: 'Toshkent', continent: 'Osiyo',
    clues: ['Markaziy Osiyoda joylashgan', "Dunyodagi ikkita ikki marta o'rab olingan davlatdan biri", "Samarqand, Buxoro va Xiva — Buyuk Ipak yo'li shaharlari"] },
  { code: 'jp', name: 'Yaponiya', capital: 'Tokio', continent: 'Osiyo',
    clues: ['Tinch okeandagi orollar davlati', "Quyosh chiqar yurti deb ataladi", 'Fudziyama togʻi va saqura guli ramzi'] },
  { code: 'cn', name: 'Xitoy', capital: 'Pekin', continent: 'Osiyo',
    clues: ['Sharqiy Osiyoda, juda katta hudud', 'Buyuk devori kosmosdan koʻrinadi deyiladi', 'Iyeroglif yozuvi va choy vatani'] },
  { code: 'in', name: 'Hindiston', capital: 'Dehli', continent: 'Osiyo',
    clues: ['Janubiy Osiyoda joylashgan', 'Tojmahal shu yerda', 'Yoga va karri taomlari vatani'] },
  { code: 'kr', name: 'Janubiy Koreya', capital: 'Seul', continent: 'Osiyo',
    clues: ['Sharqiy Osiyodagi yarim orol davlati', 'Samsung va Hyundai vatani', 'K-pop va kimchi bilan mashhur'] },
  { code: 'th', name: 'Tailand', capital: 'Bangkok', continent: 'Osiyo',
    clues: ['Janubi-sharqiy Osiyoda', 'Hech qachon mustamlaka boʻlmagan', 'Oq fillar va budda ibodatxonalari yurti'] },
  { code: 'tr', name: 'Turkiya', capital: 'Anqara', continent: 'Osiyo',
    clues: ['Ikki qitʻada joylashgan', 'Istanbul Yevropa va Osiyoni bogʻlaydi', 'Bosfor boʻgʻozi shu yerda'] },
  { code: 'sa', name: 'Saudiya Arabistoni', capital: 'Ar-Riyod', continent: 'Osiyo',
    clues: ['Arabiston yarim orolida', 'Makka va Madina shu yerda', 'Dunyodagi eng yirik neft eksportchilaridan'] },
  { code: 'ae', name: 'BAA', capital: 'Abu-Dabi', continent: 'Osiyo',
    clues: ['Fors koʻrfazida joylashgan', 'Dubay — Burj Xalifa osmonoʻpari', 'Yetti amirlikdan iborat'] },
  { code: 'ir', name: 'Eron', capital: 'Tehron', continent: 'Osiyo',
    clues: ['Qadimgi Fors davlati', 'Fors tilida gaplashiladi', 'Kaspiy va Fors koʻrfazi orasida'] },
  { code: 'pk', name: 'Pokiston', capital: 'Islomobod', continent: 'Osiyo',
    clues: ['Janubiy Osiyoda joylashgan', 'Hindiston bilan chegaradosh', 'K2 choʻqqisi shu yerda'] },
  { code: 'id', name: 'Indoneziya', capital: 'Jakarta', continent: 'Osiyo',
    clues: ['Mingdan ortiq orollardan iborat', 'Dunyodagi eng katta orol davlati', 'Bali oroli bilan mashhur'] },
  { code: 'kz', name: "Qozog'iston", capital: 'Ostona', continent: 'Osiyo',
    clues: ['Quruqlik bilan oʻralgan eng katta davlat', 'Markaziy Osiyoda', 'Baykonur kosmodromi shu yerda'] },

  // ── Yevropa ─────────────────────────────────────────────────
  { code: 'fr', name: 'Fransiya', capital: 'Parij', continent: 'Yevropa',
    clues: ['Gʻarbiy Yevropada', 'Eyfel minorasi shu yerda', 'Pishloq va shampan vatani'] },
  { code: 'de', name: 'Germaniya', capital: 'Berlin', continent: 'Yevropa',
    clues: ['Markaziy Yevropada', 'Avtoban va BMW vatani', 'Bir vaqtlar devor bilan ikkiga boʻlingan'] },
  { code: 'it', name: 'Italiya', capital: 'Rim', continent: 'Yevropa',
    clues: ['Etik shaklidagi yarim orol', 'Pitsa va makaron vatani', 'Kolizey va Venetsiya shu yerda'] },
  { code: 'es', name: 'Ispaniya', capital: 'Madrid', continent: 'Yevropa',
    clues: ['Iberiya yarim orolida', 'Flamenko va korrida vatani', 'Barselona va Real futbol klublari'] },
  { code: 'gb', name: 'Buyuk Britaniya', capital: 'London', continent: 'Yevropa',
    clues: ['Orol davlati, Yevropa shimoli-gʻarbida', 'Big Ben va qizil avtobuslar', 'Qirol/qirolicha boshqaradi'] },
  { code: 'ru', name: 'Rossiya', capital: 'Moskva', continent: 'Yevropa',
    clues: ['Dunyodagi eng katta hududli davlat', 'Ikki qitʻada — Yevropa va Osiyoda', 'Qizil maydon va Kreml'] },
  { code: 'ua', name: 'Ukraina', capital: 'Kiyev', continent: 'Yevropa',
    clues: ['Sharqiy Yevropada', 'Qora dengiz boʻyida', 'Bugʻdoy "non savati" deb ataladi'] },
  { code: 'pl', name: 'Polsha', capital: 'Varshava', continent: 'Yevropa',
    clues: ['Markaziy Yevropada', 'Boltiq dengizi boʻyida', 'Bastakor Shopen vatani'] },
  { code: 'nl', name: 'Niderlandiya', capital: 'Amsterdam', continent: 'Yevropa',
    clues: ['Shamol tegirmonlari va lolalar yurti', 'Koʻp hududi dengiz sathidan past', 'Velosiped va kanallar mamlakati'] },
  { code: 'gr', name: 'Yunoniston', capital: 'Afina', continent: 'Yevropa',
    clues: ['Demokratiya beshigi', 'Qadimgi Olimpiya oʻyinlari vatani', 'Egey dengizidagi minglab orollar'] },
  { code: 'se', name: 'Shvetsiya', capital: 'Stokgolm', continent: 'Yevropa',
    clues: ['Skandinaviyada', 'IKEA va Volvo vatani', 'Nobel mukofoti shu yerda topshiriladi'] },
  { code: 'ch', name: 'Shveytsariya', capital: 'Bern', continent: 'Yevropa',
    clues: ['Alp togʻlari mamlakati', 'Soat va shokolad vatani', 'Betaraf davlat sifatida mashhur'] },
  { code: 'pt', name: 'Portugaliya', capital: 'Lissabon', continent: 'Yevropa',
    clues: ['Iberiya yarim orolining gʻarbida', 'Atlantika okeani boʻyida', 'Buyuk dengiz sayyohlari vatani'] },

  // ── Afrika ──────────────────────────────────────────────────
  { code: 'eg', name: 'Misr', capital: 'Qohira', continent: 'Afrika',
    clues: ['Nil daryosi boʻyida', 'Piramidalar va Sfinks', 'Afrika shimoli-sharqida'] },
  { code: 'za', name: 'JAR', capital: 'Pretoriya', continent: 'Afrika',
    clues: ['Afrika materigining eng janubida', 'Uchta poytaxti bor', 'Olmos va oltin koniga boy'] },
  { code: 'ma', name: 'Marokash', capital: 'Rabot', continent: 'Afrika',
    clues: ['Shimoliy Afrikada', 'Sahroi Kabir va Atlas togʻlari', 'Marrakesh bozorlari bilan mashhur'] },
  { code: 'ng', name: 'Nigeriya', capital: 'Abuja', continent: 'Afrika',
    clues: ['Afrikada eng koʻp aholili davlat', 'Nolivud kino sanoati', 'Gvineya koʻrfazi boʻyida'] },
  { code: 'ke', name: 'Keniya', capital: 'Nayrobi', continent: 'Afrika',
    clues: ['Sharqiy Afrikada', 'Safari va savannalar yurti', 'Ekvator chizigʻi kesib oʻtadi'] },
  { code: 'et', name: 'Efiopiya', capital: 'Addis-Abeba', continent: 'Afrika',
    clues: ['Sharqiy Afrikada, dengizga chiqishi yoʻq', 'Qahva vatani hisoblanadi', 'Hech qachon toʻliq mustamlaka boʻlmagan'] },

  // ── Shimoliy Amerika ────────────────────────────────────────
  { code: 'us', name: 'AQSH', capital: 'Vashington', continent: 'Shimoliy Amerika',
    clues: ['50 shtatdan iborat', 'Ozodlik haykali shu yerda', 'Gollivud va Silikon vodiysi'] },
  { code: 'ca', name: 'Kanada', capital: 'Ottava', continent: 'Shimoliy Amerika',
    clues: ['Hududi boʻyicha dunyoda ikkinchi', 'Bayrogʻida chinor bargi', 'Shimoliy Amerikaning shimolida'] },
  { code: 'mx', name: 'Meksika', capital: 'Mexiko', continent: 'Shimoliy Amerika',
    clues: ['AQSH ning janubida', 'Tako va mayya piramidalari', 'Ispan tili rasmiy til'] },
  { code: 'cu', name: 'Kuba', capital: 'Gavana', continent: 'Shimoliy Amerika',
    clues: ['Karib dengizidagi orol', 'Sigara va eski klassik mashinalar', 'AQSH yaqinida joylashgan'] },

  // ── Janubiy Amerika ─────────────────────────────────────────
  { code: 'br', name: 'Braziliya', capital: 'Brazilia', continent: 'Janubiy Amerika',
    clues: ['Janubiy Amerikadagi eng katta davlat', 'Amazonka oʻrmoni va Rio karnavali', 'Portugal tili gaplashiladi'] },
  { code: 'ar', name: 'Argentina', capital: 'Buenos-Ayres', continent: 'Janubiy Amerika',
    clues: ['Janubiy Amerika janubida', 'Tango va mate ichimligi vatani', 'Messi va futbol mamlakati'] },
  { code: 'pe', name: 'Peru', capital: 'Lima', continent: 'Janubiy Amerika',
    clues: ['And togʻlarida joylashgan', 'Machu-Pikchu shu yerda', 'Inklar imperiyasi merosi'] },
  { code: 'cl', name: 'Chili', capital: 'Santyago', continent: 'Janubiy Amerika',
    clues: ['Juda uzun va ingichka davlat', 'Tinch okeani boʻyida', 'Atakama choʻli shu yerda'] },
  { code: 'co', name: 'Kolumbiya', capital: 'Bogota', continent: 'Janubiy Amerika',
    clues: ['Janubiy Amerika shimolida', 'Qahva va izumrud vatani', 'Ikki okeanga ham chiqishi bor'] },

  // ── Okeaniya ────────────────────────────────────────────────
  { code: 'au', name: 'Avstraliya', capital: 'Kanberra', continent: 'Okeaniya',
    clues: ['Ham davlat, ham alohida materik', 'Kenguru va koala vatani', 'Katta Toʻsiq rifi shu yerda'] },
  { code: 'nz', name: 'Yangi Zelandiya', capital: 'Vellington', continent: 'Okeaniya',
    clues: ['Tinch okeandagi ikkita asosiy orol', 'Hobbit filmlari shu yerda olingan', 'Kivi qushi milliy ramzi'] },
  { code: 'fj', name: 'Fiji', capital: 'Suva', continent: 'Okeaniya',
    clues: ['Tinch okeandagi orollar davlati', 'Marjon riflari va plyajlar makoni', 'Yuzlab vulqonik orollardan iborat'] },

  // ── Osiyo (qo'shimcha) ───────────────────────────────────────
  { code: 'vn', name: 'Vyetnam', capital: 'Hanoy', continent: 'Osiyo',
    clues: ['Janubi-sharqiy Osiyoda', 'Sholi maydonlari va konus shlyapalar', 'Halong koʻrfazi bilan mashhur'] },
  { code: 'ph', name: 'Filippin', capital: 'Manila', continent: 'Osiyo',
    clues: ['Yetti mingdan ortiq oroldan iborat', 'Tinch okeandagi orol davlati', 'Janubi-sharqiy Osiyoda joylashgan'] },
  { code: 'my', name: 'Malayziya', capital: 'Kuala-Lumpur', continent: 'Osiyo',
    clues: ['Petronas egiz minoralari shu yerda', 'Janubi-sharqiy Osiyoda', 'Tropik oʻrmonlar va orangutanlar yurti'] },
  { code: 'bd', name: 'Bangladesh', capital: 'Dakka', continent: 'Osiyo',
    clues: ['Janubiy Osiyoda, juda zich aholili', 'Gang daryosi deltasida', 'Hindiston bilan oʻralgan'] },
  { code: 'np', name: 'Nepal', capital: 'Katmandu', continent: 'Osiyo',
    clues: ['Gimolay togʻlarida', 'Everest choʻqqisi shu yerda', 'Bayrogʻi toʻrtburchak emas'] },
  { code: 'lk', name: 'Shri-Lanka', capital: 'Kolombo', continent: 'Osiyo',
    clues: ['Hindiston yaqinidagi orol', 'Seylon choyi vatani', 'Hind okeanida joylashgan'] },
  { code: 'mn', name: "Moʻgʻuliston", capital: 'Ulan-Bator', continent: 'Osiyo',
    clues: ['Xitoy va Rossiya orasida', 'Chingizxon vatani', 'Keng dashtlar va koʻchmanchilar yurti'] },
  { code: 'iq', name: 'Iroq', capital: 'Bagʻdod', continent: 'Osiyo',
    clues: ['Dajla va Furot daryolari oraligʻida', 'Qadimgi Mesopotamiya', 'Neftga boy arab davlati'] },
  { code: 'kg', name: 'Qirgʻiziston', capital: 'Bishkek', continent: 'Osiyo',
    clues: ['Markaziy Osiyoda', 'Issiqkoʻl koʻli shu yerda', 'Togʻli mamlakat'] },
  { code: 'tj', name: 'Tojikiston', capital: 'Dushanbe', continent: 'Osiyo',
    clues: ['Markaziy Osiyoda', 'Pomir togʻlari shu yerda', 'Eng baland choʻqqi — Ismoil Somoniy'] },
  { code: 'tm', name: 'Turkmaniston', capital: 'Ashxabod', continent: 'Osiyo',
    clues: ['Markaziy Osiyoda', 'Qoraqum choʻli shu yerda', 'Tabiiy gazga boy'] },
  { code: 'az', name: 'Ozarbayjon', capital: 'Boku', continent: 'Osiyo',
    clues: ['Kaspiy dengizi boʻyida', "Olov yurti deb ataladi", 'Kavkaz mintaqasida'] },
  { code: 'qa', name: 'Qatar', capital: 'Doha', continent: 'Osiyo',
    clues: ['Fors koʻrfazidagi kichik yarim orol', '2022 jahon chempionati shu yerda', 'Gaz va neftga juda boy'] },

  // ── Yevropa (qo'shimcha) ─────────────────────────────────────
  { code: 'no', name: 'Norvegiya', capital: 'Oslo', continent: 'Yevropa',
    clues: ['Skandinaviyada', 'Fyordlari bilan mashhur', 'Shimoliy yogʻdu koʻrinadi'] },
  { code: 'fi', name: 'Finlyandiya', capital: 'Xelsinki', continent: 'Yevropa',
    clues: ['Minglab koʻllar oʻlkasi', 'Sauna vatani', 'Shimoliy Yevropada'] },
  { code: 'dk', name: 'Daniya', capital: 'Kopengagen', continent: 'Yevropa',
    clues: ['Skandinaviyadagi eng kichik davlat', 'Lego oʻyinchoqlari vatani', 'Kichik dengiz parisi haykali'] },
  { code: 'ie', name: 'Irlandiya', capital: 'Dublin', continent: 'Yevropa',
    clues: ['Yashil orol deb ataladi', 'Avliyo Patrik bayrami vatani', 'Atlantika okeani boʻyida'] },
  { code: 'at', name: 'Avstriya', capital: 'Vena', continent: 'Yevropa',
    clues: ['Alp togʻlari mamlakati', 'Motsart vatani', 'Markaziy Yevropada, dengizga chiqishi yoʻq'] },
  { code: 'be', name: 'Belgiya', capital: 'Bryussel', continent: 'Yevropa',
    clues: ['Shokolad va vafli vatani', 'Yevropa Ittifoqi poytaxti shu yerda', "Gʻarbiy Yevropada"] },
  { code: 'cz', name: 'Chexiya', capital: 'Praga', continent: 'Yevropa',
    clues: ['Markaziy Yevropada', 'Pivosi bilan mashhur', 'Praga qalʼasi shu yerda'] },
  { code: 'hu', name: 'Vengriya', capital: 'Budapesht', continent: 'Yevropa',
    clues: ['Dunay daryosi boʻyida', 'Termal hammomlar yurti', 'Markaziy Yevropada'] },
  { code: 'ro', name: 'Ruminiya', capital: 'Buxarest', continent: 'Yevropa',
    clues: ['Sharqiy Yevropada', 'Transilvaniya va Drakula afsonasi', 'Qora dengiz boʻyida'] },
  { code: 'rs', name: 'Serbiya', capital: 'Belgrad', continent: 'Yevropa',
    clues: ['Bolqon yarim orolida', 'Dunay daryosi boʻyida', 'Sharqiy-Markaziy Yevropada'] },

  // ── Afrika (qo'shimcha) ──────────────────────────────────────
  { code: 'gh', name: 'Gana', capital: 'Akkra', continent: 'Afrika',
    clues: ['Gʻarbiy Afrikada', 'Oltin va kakao eksport qiladi', 'Gvineya koʻrfazi boʻyida'] },
  { code: 'tz', name: 'Tanzaniya', capital: 'Dodoma', continent: 'Afrika',
    clues: ['Sharqiy Afrikada', 'Kilimanjaro togʻi shu yerda', 'Serengeti milliy bogʻi va safari'] },
  { code: 'dz', name: 'Jazoir', capital: 'Jazoir', continent: 'Afrika',
    clues: ['Afrikadagi eng katta davlat', 'Koʻp qismi Sahroi Kabir', 'Oʻrta yer dengizi boʻyida'] },
  { code: 'sn', name: 'Senegal', capital: 'Dakar', continent: 'Afrika',
    clues: ['Afrikaning eng gʻarbiy nuqtasi', 'Atlantika okeani boʻyida', 'Dakar ralli poygasi nomi shundan'] },

  // ── Shimoliy Amerika (qo'shimcha) ────────────────────────────
  { code: 'gt', name: 'Gvatemala', capital: 'Gvatemala', continent: 'Shimoliy Amerika',
    clues: ['Markaziy Amerikada', 'Mayya xarobalari shu yerda', 'Vulqonlar va tropik oʻrmonlar'] },
  { code: 'pa', name: 'Panama', capital: 'Panama', continent: 'Shimoliy Amerika',
    clues: ['Ikki okeanni bogʻlovchi kanal shu yerda', 'Markaziy Amerikada', 'Shimoliy va Janubiy Amerikani tutashtiradi'] },
  { code: 'jm', name: 'Yamayka', capital: 'Kingston', continent: 'Shimoliy Amerika',
    clues: ['Karib dengizidagi orol', 'Regii musiqasi va Bob Marli vatani', 'Tezyurar yuguruvchilar yurti'] },
  { code: 'cr', name: 'Kosta-Rika', capital: 'San-Xose', continent: 'Shimoliy Amerika',
    clues: ['Markaziy Amerikada', 'Boy tabiat va yomgʻir oʻrmonlari', 'Armiyasi yoʻq mamlakat'] },

  // ── Janubiy Amerika (qo'shimcha) ─────────────────────────────
  { code: 've', name: 'Venesuela', capital: 'Karakas', continent: 'Janubiy Amerika',
    clues: ['Janubiy Amerika shimolida', 'Anxel — eng baland sharshara shu yerda', 'Neft zaxiralariga juda boy'] },
  { code: 'uy', name: 'Urugvay', capital: 'Montevideo', continent: 'Janubiy Amerika',
    clues: ['Janubiy Amerikadagi kichik davlat', 'Birinchi jahon chempionatini oʻtkazgan', 'Atlantika okeani boʻyida'] },
  { code: 'ec', name: 'Ekvador', capital: 'Kito', continent: 'Janubiy Amerika',
    clues: ['Nomi ekvator soʻzidan', 'Galapagos orollari shu davlatga tegishli', 'And togʻlarida joylashgan'] },
  { code: 'bo', name: 'Boliviya', capital: 'Sukre', continent: 'Janubiy Amerika',
    clues: ['Dengizga chiqishi yoʻq', 'Uyuni tuz choʻli shu yerda', 'And togʻlarida baland joylashgan'] },

  /* ════════════════════════════════════════════════════════════
     Qolgan davlatlar — xarita uchun (nomi · poytaxti · qit'asi).
     Bularda "clues" yo'q, shuning uchun o'yinlarda ishlatilmaydi.
     ════════════════════════════════════════════════════════════ */

  // ── Osiyo ───────────────────────────────────────────────────
  { code: 'af', name: "Afg'oniston", capital: 'Kobul', continent: 'Osiyo' },
  { code: 'am', name: 'Armaniston', capital: 'Yerevan', continent: 'Osiyo' },
  { code: 'bh', name: 'Bahrayn', capital: 'Manama', continent: 'Osiyo' },
  { code: 'bn', name: 'Bruney', capital: 'Bandar-Seri-Begavan', continent: 'Osiyo' },
  { code: 'bt', name: 'Butan', capital: 'Thimphu', continent: 'Osiyo' },
  { code: 'ge', name: 'Gruziya', capital: 'Tbilisi', continent: 'Osiyo' },
  { code: 'il', name: 'Isroil', capital: 'Quddus', continent: 'Osiyo' },
  { code: 'jo', name: 'Iordaniya', capital: 'Ammon', continent: 'Osiyo' },
  { code: 'kh', name: 'Kambodja', capital: 'Pnompen', continent: 'Osiyo' },
  { code: 'kp', name: 'Shimoliy Koreya', capital: 'Pxenyan', continent: 'Osiyo' },
  { code: 'kw', name: 'Quvayt', capital: 'El-Quvayt', continent: 'Osiyo' },
  { code: 'la', name: 'Laos', capital: 'Vyentyan', continent: 'Osiyo' },
  { code: 'lb', name: 'Livan', capital: 'Bayrut', continent: 'Osiyo' },
  { code: 'mv', name: 'Maldiv orollari', capital: 'Male', continent: 'Osiyo' },
  { code: 'mm', name: 'Myanma', capital: 'Naypidav', continent: 'Osiyo' },
  { code: 'om', name: 'Ummon', capital: 'Maskat', continent: 'Osiyo' },
  { code: 'ps', name: 'Falastin', capital: 'Ramalla', continent: 'Osiyo' },
  { code: 'sg', name: 'Singapur', capital: 'Singapur', continent: 'Osiyo' },
  { code: 'sy', name: 'Suriya', capital: 'Damashq', continent: 'Osiyo' },
  { code: 'tw', name: 'Tayvan', capital: 'Taybey', continent: 'Osiyo' },
  { code: 'tl', name: 'Sharqiy Timor', capital: 'Dili', continent: 'Osiyo' },
  { code: 'ye', name: 'Yaman', capital: 'Sano', continent: 'Osiyo' },

  // ── Yevropa ─────────────────────────────────────────────────
  { code: 'al', name: 'Albaniya', capital: 'Tirana', continent: 'Yevropa' },
  { code: 'ad', name: 'Andorra', capital: 'Andorra-la-Vella', continent: 'Yevropa' },
  { code: 'ba', name: 'Bosniya va Gertsegovina', capital: 'Sarayevo', continent: 'Yevropa' },
  { code: 'bg', name: 'Bolgariya', capital: 'Sofiya', continent: 'Yevropa' },
  { code: 'by', name: 'Belarus', capital: 'Minsk', continent: 'Yevropa' },
  { code: 'hr', name: 'Xorvatiya', capital: 'Zagreb', continent: 'Yevropa' },
  { code: 'cy', name: 'Kipr', capital: 'Nikoziya', continent: 'Yevropa' },
  { code: 'ee', name: 'Estoniya', capital: 'Tallin', continent: 'Yevropa' },
  { code: 'is', name: 'Islandiya', capital: 'Reykyavik', continent: 'Yevropa' },
  { code: 'xk', name: 'Kosovo', capital: 'Pristina', continent: 'Yevropa' },
  { code: 'lv', name: 'Latviya', capital: 'Riga', continent: 'Yevropa' },
  { code: 'li', name: 'Lixtenshteyn', capital: 'Vaduts', continent: 'Yevropa' },
  { code: 'lt', name: 'Litva', capital: 'Vilnyus', continent: 'Yevropa' },
  { code: 'lu', name: 'Lyuksemburg', capital: 'Lyuksemburg', continent: 'Yevropa' },
  { code: 'mt', name: 'Malta', capital: 'Valletta', continent: 'Yevropa' },
  { code: 'md', name: 'Moldova', capital: 'Kishinyov', continent: 'Yevropa' },
  { code: 'mc', name: 'Monako', capital: 'Monako', continent: 'Yevropa' },
  { code: 'me', name: 'Chernogoriya', capital: 'Podgoritsa', continent: 'Yevropa' },
  { code: 'mk', name: 'Shimoliy Makedoniya', capital: 'Skopye', continent: 'Yevropa' },
  { code: 'sm', name: 'San-Marino', capital: 'San-Marino', continent: 'Yevropa' },
  { code: 'sk', name: 'Slovakiya', capital: 'Bratislava', continent: 'Yevropa' },
  { code: 'si', name: 'Sloveniya', capital: 'Lyublyana', continent: 'Yevropa' },
  { code: 'va', name: 'Vatikan', capital: 'Vatikan', continent: 'Yevropa' },

  // ── Afrika ──────────────────────────────────────────────────
  { code: 'ao', name: 'Angola', capital: 'Luanda', continent: 'Afrika' },
  { code: 'bj', name: 'Benin', capital: 'Porto-Novo', continent: 'Afrika' },
  { code: 'bw', name: 'Botsvana', capital: 'Gaboron', continent: 'Afrika' },
  { code: 'bf', name: 'Burkina-Faso', capital: 'Uagadugu', continent: 'Afrika' },
  { code: 'bi', name: 'Burundi', capital: 'Gitega', continent: 'Afrika' },
  { code: 'cm', name: 'Kamerun', capital: 'Yaunde', continent: 'Afrika' },
  { code: 'cv', name: 'Kabo-Verde', capital: 'Praya', continent: 'Afrika' },
  { code: 'cf', name: 'Markaziy Afrika Respublikasi', capital: 'Bangi', continent: 'Afrika' },
  { code: 'td', name: 'Chad', capital: 'Ndjamena', continent: 'Afrika' },
  { code: 'km', name: 'Komor orollari', capital: 'Moroni', continent: 'Afrika' },
  { code: 'cg', name: 'Kongo Respublikasi', capital: 'Brazzavil', continent: 'Afrika' },
  { code: 'cd', name: 'Kongo DR', capital: 'Kinshasa', continent: 'Afrika' },
  { code: 'ci', name: "Kot-d'Ivuar", capital: 'Yamusukro', continent: 'Afrika' },
  { code: 'dj', name: 'Jibuti', capital: 'Jibuti', continent: 'Afrika' },
  { code: 'gq', name: 'Ekvatorial Gvineya', capital: 'Malabo', continent: 'Afrika' },
  { code: 'er', name: 'Eritreya', capital: 'Asmara', continent: 'Afrika' },
  { code: 'sz', name: 'Esvatini', capital: 'Mbabane', continent: 'Afrika' },
  { code: 'ga', name: 'Gabon', capital: 'Librevil', continent: 'Afrika' },
  { code: 'gm', name: 'Gambiya', capital: 'Banjul', continent: 'Afrika' },
  { code: 'gn', name: 'Gvineya', capital: 'Konakri', continent: 'Afrika' },
  { code: 'gw', name: 'Gvineya-Bisau', capital: 'Bisau', continent: 'Afrika' },
  { code: 'ls', name: 'Lesoto', capital: 'Maseru', continent: 'Afrika' },
  { code: 'lr', name: 'Liberiya', capital: 'Monroviya', continent: 'Afrika' },
  { code: 'ly', name: 'Liviya', capital: 'Tripoli', continent: 'Afrika' },
  { code: 'mg', name: 'Madagaskar', capital: 'Antananarivu', continent: 'Afrika' },
  { code: 'mw', name: 'Malavi', capital: 'Lilongve', continent: 'Afrika' },
  { code: 'ml', name: 'Mali', capital: 'Bamako', continent: 'Afrika' },
  { code: 'mr', name: 'Mavritaniya', capital: 'Nuakshot', continent: 'Afrika' },
  { code: 'mu', name: 'Mavrikiy', capital: 'Port-Luis', continent: 'Afrika' },
  { code: 'mz', name: 'Mozambik', capital: 'Maputu', continent: 'Afrika' },
  { code: 'na', name: 'Namibiya', capital: 'Vindxuk', continent: 'Afrika' },
  { code: 'ne', name: 'Niger', capital: 'Niamey', continent: 'Afrika' },
  { code: 'rw', name: 'Ruanda', capital: 'Kigali', continent: 'Afrika' },
  { code: 'st', name: 'San-Tome va Prinsipi', capital: 'San-Tome', continent: 'Afrika' },
  { code: 'sc', name: 'Seyshel orollari', capital: 'Viktoriya', continent: 'Afrika' },
  { code: 'sl', name: 'Syerra-Leone', capital: 'Fritaun', continent: 'Afrika' },
  { code: 'so', name: 'Somali', capital: 'Mogadisho', continent: 'Afrika' },
  { code: 'ss', name: 'Janubiy Sudan', capital: 'Juba', continent: 'Afrika' },
  { code: 'sd', name: 'Sudan', capital: 'Xartum', continent: 'Afrika' },
  { code: 'tg', name: 'Togo', capital: 'Lome', continent: 'Afrika' },
  { code: 'tn', name: 'Tunis', capital: 'Tunis', continent: 'Afrika' },
  { code: 'ug', name: 'Uganda', capital: 'Kampala', continent: 'Afrika' },
  { code: 'zm', name: 'Zambiya', capital: 'Lusaka', continent: 'Afrika' },
  { code: 'zw', name: 'Zimbabve', capital: 'Xarare', continent: 'Afrika' },

  // ── Shimoliy Amerika ────────────────────────────────────────
  { code: 'ag', name: 'Antigua va Barbuda', capital: 'Sent-Jons', continent: 'Shimoliy Amerika' },
  { code: 'bs', name: 'Bagama orollari', capital: 'Nassau', continent: 'Shimoliy Amerika' },
  { code: 'bb', name: 'Barbados', capital: 'Bridjtaun', continent: 'Shimoliy Amerika' },
  { code: 'bz', name: 'Beliz', capital: 'Belmopan', continent: 'Shimoliy Amerika' },
  { code: 'dm', name: 'Dominika', capital: 'Rozo', continent: 'Shimoliy Amerika' },
  { code: 'do', name: 'Dominikan Respublikasi', capital: 'Santo-Domingo', continent: 'Shimoliy Amerika' },
  { code: 'sv', name: 'Salvador', capital: 'San-Salvador', continent: 'Shimoliy Amerika' },
  { code: 'gd', name: 'Grenada', capital: 'Sent-Jorjes', continent: 'Shimoliy Amerika' },
  { code: 'gl', name: 'Grenlandiya', capital: 'Nuuk', continent: 'Shimoliy Amerika' },
  { code: 'ht', name: 'Gaiti', capital: 'Port-o-Prens', continent: 'Shimoliy Amerika' },
  { code: 'hn', name: 'Gonduras', capital: 'Tegusigalpa', continent: 'Shimoliy Amerika' },
  { code: 'ni', name: 'Nikaragua', capital: 'Managua', continent: 'Shimoliy Amerika' },
  { code: 'kn', name: 'Sent-Kits va Nevis', capital: 'Bastir', continent: 'Shimoliy Amerika' },
  { code: 'lc', name: 'Sent-Lyusiya', capital: 'Kastri', continent: 'Shimoliy Amerika' },
  { code: 'vc', name: 'Sent-Vinsent va Grenadinlar', capital: 'Kingstaun', continent: 'Shimoliy Amerika' },
  { code: 'tt', name: 'Trinidad va Tobago', capital: 'Port-of-Speyn', continent: 'Shimoliy Amerika' },

  // ── Janubiy Amerika ─────────────────────────────────────────
  { code: 'gy', name: 'Gayana', capital: 'Jorjtaun', continent: 'Janubiy Amerika' },
  { code: 'py', name: 'Paragvay', capital: 'Asunsion', continent: 'Janubiy Amerika' },
  { code: 'sr', name: 'Surinam', capital: 'Paramaribo', continent: 'Janubiy Amerika' },

  // ── Okeaniya ────────────────────────────────────────────────
  { code: 'ki', name: 'Kiribati', capital: 'Tarava', continent: 'Okeaniya' },
  { code: 'mh', name: 'Marshall orollari', capital: 'Majuro', continent: 'Okeaniya' },
  { code: 'fm', name: 'Mikroneziya', capital: 'Palikir', continent: 'Okeaniya' },
  { code: 'nr', name: 'Nauru', capital: 'Yaren', continent: 'Okeaniya' },
  { code: 'pw', name: 'Palau', capital: 'Ngerulmud', continent: 'Okeaniya' },
  { code: 'pg', name: 'Papua-Yangi Gvineya', capital: 'Port-Morsbi', continent: 'Okeaniya' },
  { code: 'ws', name: 'Samoa', capital: 'Apia', continent: 'Okeaniya' },
  { code: 'sb', name: 'Solomon orollari', capital: 'Xoniara', continent: 'Okeaniya' },
  { code: 'to', name: 'Tonga', capital: 'Nukualofa', continent: 'Okeaniya' },
  { code: 'tv', name: 'Tuvalu', capital: 'Funafuti', continent: 'Okeaniya' },
  { code: 'vu', name: 'Vanuatu', capital: 'Port-Vila', continent: 'Okeaniya' },
]

/* O'yinlar uchun — to'liq ipuchli (mashhur, tanilgan) davlatlar to'plami.
   Xarita esa to'liq COUNTRIES ro'yxatidan foydalanadi. */
export const GAME_COUNTRIES = COUNTRIES.filter(c => c.clues && c.clues.length >= 3)

/* Tasodifiy aralashtirish (Fisher–Yates) */
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* Bitta davlat uchun 3 ta chalg'ituvchi nom tanlaydi.
   Imkon qadar bir xil qit'adan — qiyinroq va realroq bo'lsin. */
export function pickDistractors(target, pool, n = 3) {
  const sameContinent = shuffle(
    pool.filter(c => c.code !== target.code && c.continent === target.continent)
  )
  const other = shuffle(
    pool.filter(c => c.code !== target.code && c.continent !== target.continent)
  )
  return [...sameContinent, ...other].slice(0, n)
}

export const flagUrl = code => `https://flagcdn.com/w640/${code}.png`
export const shapeUrl = code => `https://cdn.jsdelivr.net/gh/djaiss/mapsicon@master/all/${code}/1024.png`
