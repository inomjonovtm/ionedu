# -*- coding: utf-8 -*-
"""
Demo ma'lumotlar generatori — Ionedu (geografiya ta'lim platformasi).

Sayt to'liq EMAIL-ga o'tgandan keyin bazani tozalab, barcha modellarga
izchil va realistik soxta (fake) ma'lumot quyadi.

Foydalanish:
    python manage.py seed_demo            # bazani tozalab, to'liq demo data quyadi
    python manage.py seed_demo --no-clean # tozalamasdan ustiga qo'shadi

Barcha foydalanuvchilar EMAIL bilan kiradi. Umumiy parol:  demo1234
Admin:  admin@ionedu.uz / admin1234
"""
import datetime
import random
import unicodedata

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from apps.courses.models import (
    Category, Course, Section, Lesson, Enrollment, LessonProgress,
    Review, LessonComment, LessonResource,
)
from apps.tests.models import (
    Test, Question, AnswerOption, TestAttempt, AttemptAnswer,
)
from apps.certificates.models import Certificate
from apps.notifications.models import Notification
from apps.resources.models import Resource
from apps.accounts.models import (
    SiteSettings, TeamMember, TeacherCredential, ContactMessage,
)

User = get_user_model()
PASSWORD = 'demo1234'

# ---------------------------------------------------------------------------
# Curated Uzbek data pools
# ---------------------------------------------------------------------------
MALE_NAMES = [
    "Aziz", "Jasur", "Dilshod", "Sardor", "Bekzod", "Otabek", "Shoxrux",
    "Javohir", "Akmal", "Nodir", "Ulug'bek", "Farrux", "Murod", "Sherzod",
    "Bobur", "Davron", "Islom", "Kamol", "Rustam", "Temur",
]
FEMALE_NAMES = [
    "Dilnoza", "Madina", "Sevara", "Nigora", "Gulnoza", "Malika", "Zarina",
    "Kamola", "Feruza", "Shahnoza", "Nilufar", "Oysha", "Laylo", "Charos",
    "Dildora", "Munisa", "Robiya", "Aziza", "Maftuna", "Sabina",
]
SURNAMES = [
    "Karimov", "Yusupov", "Abdullayev", "Rahimov", "To'xtayev", "Ergashev",
    "Sobirov", "Nazarov", "Qodirov", "Umarov", "Saidov", "Olimov", "Hasanov",
    "Mirzayev", "Yo'ldoshev", "Rasulov", "Tursunov", "Xolmatov", "Niyozov",
    "Sharipov", "Aliyev", "Yoqubov", "Ismoilov", "Tojiboyev",
]
REGIONS = [
    ("Toshkent", "Chilonzor"), ("Samarqand", "Urgut"), ("Buxoro", "Kogon"),
    ("Andijon", "Asaka"), ("Farg'ona", "Marg'ilon"), ("Namangan", "Chust"),
    ("Qashqadaryo", "Shahrisabz"), ("Surxondaryo", "Termiz"),
    ("Xorazm", "Urganch"), ("Navoiy", "Zarafshon"), ("Jizzax", "Zomin"),
    ("Sirdaryo", "Guliston"), ("Qoraqalpog'iston", "Nukus"),
]
SCHOOLS = [
    "1-umumta'lim maktabi", "15-maktab", "Prezident maktabi",
    "23-IDUM", "Xususiy 'Bilim' maktabi", "7-son akademik litsey",
    "42-maktab", "Ixtisoslashtirilgan maktab-internat", "5-maktab",
]
TEACHER_SPECIALTIES = [
    ("Fizik geografiya o'qituvchisi",
     "O'zbekiston Milliy universiteti, Geografiya fakulteti (2009)"),
    ("Iqtisodiy geografiya mutaxassisi",
     "TDPU, Geografiya-iqtisodiyot yo'nalishi (2012)"),
    ("Kartografiya va GIS o'qituvchisi",
     "Toshkent davlat texnika universiteti, Geodeziya (2011)"),
    ("O'lkashunoslik va tabiiy geografiya o'qituvchisi",
     "Samarqand davlat universiteti, Geografiya (2008)"),
    ("Geografiya fan o'qituvchisi, oliy toifa",
     "O'zMU magistraturasi, Geomorfologiya (2014)"),
    ("Geoekologiya va atrof-muhit o'qituvchisi",
     "Buxoro davlat universiteti, Tabiiy fanlar (2013)"),
]
TEACHER_BIOS = [
    "15 yildan ortiq tajribaga ega geografiya o'qituvchisi. Respublika fan olimpiadalari g'oliblarini tayyorlagan.",
    "Maktab va litseylarda dars beradi, interaktiv usullar tarafdori.",
    "Geografiyani hayot bilan bog'lab o'rgatishni yaxshi ko'raman.",
    "Mualliflik darsliklari va metodik qo'llanmalar muallifi.",
    "Onlayn ta'lim va raqamli xaritalar bo'yicha trener.",
]

CATEGORIES = [
    ("Umumiy geografiya", "🌍"),
    ("Materik va okeanlar", "🗺️"),
    ("O'zbekiston geografiyasi", "🇺🇿"),
    ("Iqlim va ob-havo", "☁️"),
    ("Kartografiya", "🧭"),
    ("Iqtisodiy geografiya", "📊"),
    ("Tabiiy geografiya", "⛰️"),
    ("Aholi geografiyasi", "👥"),
]

COURSES = [
    ("Umumiy yer bilimi asoslari", "Umumiy geografiya", "beginner",
     "Yer sayyorasi, uning shakli, harakati va geografik qobiq haqidagi boshlang'ich kurs. Yangi boshlovchilar uchun.",
     "🌍", "blue"),
    ("Materiklar va okeanlar geografiyasi", "Materik va okeanlar", "beginner",
     "Yetti materik va to'rt okeanning joylashuvi, tabiati va o'ziga xos xususiyatlari bilan tanishamiz.",
     "🗺️", "teal"),
    ("O'zbekiston tabiiy geografiyasi", "O'zbekiston geografiyasi", "intermediate",
     "Vatanimizning relyefi, iqlimi, suv resurslari, tuproqlari va tabiat zonalari to'liq yoritiladi.",
     "🇺🇿", "green"),
    ("Iqlimshunoslik va ob-havo", "Iqlim va ob-havo", "intermediate",
     "Atmosfera, iqlim mintaqalari, ob-havo hodisalari va ularni o'lchash usullari haqida amaliy kurs.",
     "☁️", "slate"),
    ("Kartografiya va topografiya asoslari", "Kartografiya", "beginner",
     "Xarita, masshtab, koordinatalar tizimi va shartli belgilarni o'qishni o'rganamiz.",
     "🧭", "amber"),
    ("Dunyo iqtisodiy geografiyasi", "Iqtisodiy geografiya", "advanced",
     "Jahon xo'jaligi, sanoat tarmoqlari, transport va xalqaro savdo geografiyasi chuqur tahlil qilinadi.",
     "📊", "violet"),
    ("Aholi va demografiya geografiyasi", "Aholi geografiyasi", "intermediate",
     "Aholi soni, joylashuvi, migratsiya jarayonlari va urbanizatsiya masalalari.",
     "👥", "rose"),
    ("Geomorfologiya: yer relyefi", "Tabiiy geografiya", "advanced",
     "Tog'lar, tekisliklar, vulqonlar va relyef shakllarining paydo bo'lish jarayonlari.",
     "⛰️", "slate"),
    ("Tabiiy resurslar va ekologiya", "Tabiiy geografiya", "intermediate",
     "Tabiiy boyliklar, ulardan oqilona foydalanish va atrof-muhit muammolari.",
     "🌱", "green"),
]

SECTION_TITLES = ["Kirish", "Asosiy tushunchalar", "Chuqurlashtirilgan mavzular",
                  "Amaliy mashg'ulotlar", "Yakuniy bo'lim"]

LESSON_TITLES = [
    "Geografiya faniga kirish", "Yer shakli va o'lchamlari", "Globus va xarita",
    "Geografik koordinatalar", "Materiklarning joylashuvi", "Okean suvlari xossalari",
    "Atmosfera va uning tuzilishi", "Iqlim mintaqalari", "Atmosfera bosimi va shamollar",
    "Daryolar va ko'llar", "Yer osti suvlari", "Tog' jinslari va minerallar",
    "Vulqonlar va ularning turlari", "Zilzilalar va seysmik mintaqalar",
    "Tabiat zonalari", "Tuproq va uning unumdorligi", "Aholi joylashuvi",
    "Shaharlar va urbanizatsiya", "Sanoat geografiyasi", "Qishloq xo'jaligi geografiyasi",
    "Transport tarmoqlari", "Tabiiy resurslar", "Ekologik muammolar",
    "O'zbekiston viloyatlari", "Orol dengizi muammosi",
]

# YouTube watch URL'lar (geografiya videolari uchun namuna)
YT = [
    "https://www.youtube.com/watch?v=zNCq5jSrqgc",
    "https://www.youtube.com/watch?v=Az5Ls2A1A1w",
    "https://www.youtube.com/watch?v=H7nmGu6Y6Lo",
    "https://www.youtube.com/watch?v=GMtN8N7XjQk",
    "https://www.youtube.com/watch?v=KUWn_dPlqYI",
    "https://www.youtube.com/watch?v=swKBi6hHHMA",
    "https://www.youtube.com/watch?v=rNSnfXl1ZjU",
    "https://www.youtube.com/watch?v=6kKb6jZ2k0E",
]

LESSON_DESC = [
    "Ushbu darsda mavzuning asosiy tushunchalari bilan tanishamiz va misollar ko'rib chiqamiz.",
    "Nazariy qism va amaliy topshiriqlar birga beriladi. Daftaringizni tayyorlab oling.",
    "Xarita ustida ishlashni mashq qilamiz va muhim atamalarni yodlaymiz.",
    "Qisqa va tushunarli tarzda mavzuni yoritamiz, oxirida o'z-o'zini tekshirish savollari bor.",
]

REVIEW_COMMENTS = [
    "Juda foydali kurs bo'ldi, o'qituvchiga rahmat!",
    "Mavzular tushunarli yoritilgan, tavsiya qilaman.",
    "Ba'zi darslar biroz tez o'tildi, lekin umuman zo'r.",
    "Xaritalar bilan ishlashni yaxshi o'rgandim.",
    "Geografiyani sevib qoldim, ajoyib material.",
    "Testlar bilimni mustahkamlashga yordam berdi.",
    "Yaxshi tushuntirilgan, yangi boshlovchilar uchun ideal.",
    "Amaliy misollar ko'p bo'lgani yoqdi.",
]
LESSON_COMMENTS = [
    "Tushunarli dars, rahmat!",
    "Bu joyni qayta tushuntirib bera olasizmi?",
    "Juda qiziqarli ekan.",
    "Videoning sifati zo'r.",
    "Savol bor edi: bu qoida hamma materiklarga tegishlimi?",
    "Yodlab oldim, rahmat ustoz.",
]

RESOURCES = [
    ("7-sinf Geografiya darsligi", "pdf", "7-8",
     "Umumta'lim maktablari uchun 7-sinf geografiya darsligi (to'liq versiya)."),
    ("8-sinf Geografiya darsligi", "pdf", "7-8",
     "O'zbekiston geografiyasi — 8-sinf darsligi."),
    ("O'zbekiston tabiiy xaritasi", "map", "all",
     "Yuqori aniqlikdagi tabiiy geografik xarita (relyef, daryolar, tog'lar)."),
    ("Dunyo siyosiy xaritasi", "map", "all",
     "Barcha davlatlar va poytaxtlar ko'rsatilgan zamonaviy siyosiy xarita."),
    ("Geografik atlas 8-sinf", "pdf", "7-8",
     "Rangli atlas — materiklar, okeanlar va iqlim xaritalari."),
    ("Iqlim mintaqalari haqida video dars", "video", "9-10",
     "Yer iqlim mintaqalari batafsil tushuntirilgan video qo'llanma."),
    ("Kartografiya bo'yicha qo'llanma", "doc", "11",
     "Masshtab, koordinatalar va xarita o'qish bo'yicha metodik qo'llanma."),
    ("O'zbekiston viloyatlari jadvali", "doc", "9-10",
     "Viloyatlar, markazlari, maydoni va aholisi keltirilgan jadval."),
    ("Materiklar bo'yicha taqdimot", "pdf", "5-6",
     "Yetti materik haqida rasmli taqdimot (slaydlar)."),
    ("National Geographic — interaktiv globus", "link", "all",
     "Onlayn interaktiv globus va geografik ma'lumotlar manbasi."),
    ("9-sinf Geografiya darsligi", "pdf", "9-10",
     "Iqtisodiy va ijtimoiy geografiya — 9-sinf darsligi."),
    ("Topografik xarita namunasi", "map", "11",
     "Topografik xaritani o'qishni mashq qilish uchun namuna."),
]

TEAM = [
    ("Jamshid Ergashev", "Asoschisi va bosh direktor",
     "Ta'lim sohasida 10 yillik tajriba. Ionedu g'oyasi muallifi."),
    ("Nilufar Saidova", "Ta'lim bo'yicha direktor",
     "O'quv dasturlari va metodikani nazorat qiladi."),
    ("Sardor Qodirov", "Bosh dasturchi",
     "Platformaning texnik qismi va infratuzilmasi uchun mas'ul."),
    ("Madina Yusupova", "Kontent menejeri",
     "Kurslar va testlar sifatini ta'minlaydi."),
    ("Bekzod To'xtayev", "Qo'llab-quvvatlash xizmati rahbari",
     "Foydalanuvchilar bilan ishlash va texnik yordam."),
]

CONTACT_MESSAGES = [
    ("Aliya Karimova", "aliya.k@gmail.com", "Hamkorlik taklifi",
     "Assalomu alaykum, maktabimiz uchun ommaviy litsenziya olish mumkinmi?"),
    ("Doston Rahimov", "doston@mail.ru", "Kurs haqida savol",
     "Iqtisodiy geografiya kursi sertifikat beradimi?"),
    ("Maktab #15", "info@maktab15.uz", "Ko'p foydalanuvchi",
     "100 nafar o'quvchi uchun chegirma bormi?"),
    ("Anonim", "test@example.com", "Texnik muammo",
     "Video ba'zan ochilmayapti, tekshirib ko'rsangiz."),
]

# Geografiya savollar bazasi (lesson/section testlari uchun) — (savol, [variantlar], to'g'ri_index)
QUIZ_POOL = [
    ("Yer Quyosh atrofini necha kunda aylanib chiqadi?",
     ["365 kun", "30 kun", "24 soat", "100 kun"], 0),
    ("Eng katta okean qaysi?",
     ["Tinch okean", "Atlantika", "Hind okeani", "Shimoliy Muz okeani"], 0),
    ("Yer o'qi necha gradusga og'gan?",
     ["23,5°", "45°", "90°", "0°"], 0),
    ("Geografik kenglik qaysi chiziqdan hisoblanadi?",
     ["Ekvator", "Grinvich meridiani", "Shimoliy qutb", "Tropik"], 0),
    ("Eng baland tog' cho'qqisi qaysi?",
     ["Everest", "Elbrus", "Kilimanjaro", "Hisor"], 0),
    ("Atmosferaning yerga eng yaqin qatlami qaysi?",
     ["Troposfera", "Stratosfera", "Mezosfera", "Termosfera"], 0),
    ("Eng uzun daryo qaysi?",
     ["Nil", "Amazonka", "Volga", "Amudaryo"], 0),
    ("O'zbekiston nechta viloyatdan iborat?",
     ["12", "10", "14", "13"], 0),
    ("Globusda 0° meridian qayerdan o'tadi?",
     ["Grinvich", "Parij", "Moskva", "Nyu-York"], 0),
    ("Eng katta materik qaysi?",
     ["Yevrosiyo", "Afrika", "Shimoliy Amerika", "Antarktida"], 0),
    ("Zilzila kuchini qaysi shkala o'lchaydi?",
     ["Rixter", "Selsiy", "Bofort", "Kelvin"], 0),
    ("Eng chuqur ko'l qaysi?",
     ["Baykal", "Kaspiy", "Viktoriya", "Issiqko'l"], 0),
    ("Toshkent qaysi geografik mintaqada joylashgan?",
     ["Mo''tadil mintaqa", "Tropik mintaqa", "Ekvatorial", "Arktik"], 0),
    ("Sahroi Kabir qaysi materikda?",
     ["Afrika", "Osiyo", "Avstraliya", "Janubiy Amerika"], 0),
    ("Vulqondan otilib chiqadigan erigan jins nima deyiladi?",
     ["Lava", "Bazalt", "Granit", "Qum"], 0),
    ("Aholi sonini o'rganadigan fan qanday nomlanadi?",
     ["Demografiya", "Geologiya", "Meteorologiya", "Kartografiya"], 0),
]


# ---------------------------------------------------------------------------
def ascii_slug(text):
    """O'zbekcha matnni email/login uchun lotin-asciiga aylantiradi."""
    repl = {"'": "", "'": "", "ʻ": "", "g'": "g", "o'": "o", "G'": "G", "O'": "O",
            "sh": "sh", "ch": "ch", " ": ".", "-": ""}
    for k, v in repl.items():
        text = text.replace(k, v)
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return text.lower()


class Command(BaseCommand):
    help = "Bazani tozalab, barcha modellarga demo (fake) ma'lumot quyadi."

    def add_arguments(self, parser):
        parser.add_argument("--no-clean", action="store_true",
                            help="Mavjud ma'lumotni o'chirmaydi, ustiga qo'shadi.")
        parser.add_argument("--seed", type=int, default=42,
                            help="Random seed (takrorlanuvchanlik uchun).")

    @transaction.atomic
    def handle(self, *args, **opts):
        random.seed(opts["seed"])
        self.now = timezone.now()

        if not opts["no_clean"]:
            self.clean()

        admin = self.create_admin()
        teachers = self.create_teachers(6)
        students = self.create_students(24)
        self.site_settings()
        self.team()
        self.credentials(teachers)
        cats = self.categories()
        courses = self.courses(teachers, cats)
        self.public_tests(teachers, cats)
        self.enroll_and_engage(students, courses)
        self.resources(cats, teachers + [admin])
        self.contact_messages()
        self.notifications(students, teachers)

        self.summary()

    # ------------------------------------------------------------------ utils
    def _set_dt(self, obj, **fields):
        """auto_now_add maydonlarni o'tmishdagi sanaga o'rnatish (to'g'ridan-to'g'ri UPDATE)."""
        type(obj).objects.filter(pk=obj.pk).update(**fields)

    def _days_ago(self, lo, hi):
        d = random.randint(lo, hi)
        return self.now - datetime.timedelta(
            days=d, hours=random.randint(0, 23), minutes=random.randint(0, 59))

    # ------------------------------------------------------------------ clean
    def clean(self):
        self.stdout.write("Bazani tozalash...")
        AttemptAnswer.objects.all().delete()
        TestAttempt.objects.all().delete()
        AnswerOption.objects.all().delete()
        Question.objects.all().delete()
        Test.objects.all().delete()
        Certificate.objects.all().delete()
        Notification.objects.all().delete()
        Review.objects.all().delete()
        LessonComment.objects.all().delete()
        LessonProgress.objects.all().delete()
        LessonResource.objects.all().delete()
        Enrollment.objects.all().delete()
        Lesson.objects.all().delete()
        Section.objects.all().delete()
        Course.objects.all().delete()
        Resource.objects.all().delete()
        TeacherCredential.objects.all().delete()
        TeamMember.objects.all().delete()
        ContactMessage.objects.all().delete()
        Category.objects.all().delete()
        SiteSettings.objects.all().delete()
        User.objects.all().delete()
        self.stdout.write(self.style.WARNING("  Barcha eski ma'lumot o'chirildi."))

    # ------------------------------------------------------------------ users
    def create_admin(self):
        admin = User.objects.create_superuser(
            email="admin@ionedu.uz", password="admin1234",
            full_name="Platforma Administratori", city="Toshkent",
        )
        self._set_dt(admin, date_joined=self._days_ago(200, 220))
        return admin

    def create_teachers(self, n):
        teachers = []
        used = set()
        for i in range(n):
            first = random.choice(MALE_NAMES + FEMALE_NAMES)
            last = SURNAMES[i % len(SURNAMES)]
            full = f"{first} {last}"
            email = self._uniq_email(first, last, used)
            spec, edu = TEACHER_SPECIALTIES[i % len(TEACHER_SPECIALTIES)]
            region, district = random.choice(REGIONS)
            t = User.objects.create_user(
                email=email, password=PASSWORD, full_name=full,
                role="teacher", is_verified=True,
                bio=random.choice(TEACHER_BIOS), city=region, region=region,
                specialty=spec, education=edu,
                experience_years=random.randint(3, 22),
            )
            self._set_dt(t, date_joined=self._days_ago(150, 200))
            teachers.append(t)
        self.stdout.write(f"  O'qituvchilar: {len(teachers)}")
        return teachers

    def create_students(self, n):
        students = []
        used = set()
        for i in range(n):
            pool = FEMALE_NAMES if i % 2 else MALE_NAMES
            first = random.choice(pool)
            last = random.choice(SURNAMES)
            full = f"{first} {last}"
            email = self._uniq_email(first, last, used)
            region, district = random.choice(REGIONS)
            s = User.objects.create_user(
                email=email, password=PASSWORD, full_name=full,
                role="student", is_verified=random.random() > 0.15,
                city=region, region=region, district=district,
                school=random.choice(SCHOOLS),
                birth_year=random.randint(2004, 2012),
            )
            self._set_dt(s, date_joined=self._days_ago(5, 160))
            students.append(s)
        self.stdout.write(f"  O'quvchilar: {len(students)}")
        return students

    def _uniq_email(self, first, last, used):
        base = f"{ascii_slug(first)}.{ascii_slug(last)}"
        domain = random.choice(["gmail.com", "mail.ru", "inbox.uz", "umail.uz"])
        email = f"{base}@{domain}"
        n = 1
        while email in used:
            n += 1
            email = f"{base}{n}@{domain}"
        used.add(email)
        return email

    # ------------------------------------------------------------ site config
    def site_settings(self):
        SiteSettings.objects.all().delete()
        s = SiteSettings.objects.create(
            pk=1, site_name="Ionedu",
            contact_email="info@ionedu.uz", contact_phone="+998 71 200 70 70",
            address="Toshkent shahri, Amir Temur ko'chasi, 108",
            telegram_url="https://t.me/ionedu", instagram_url="https://instagram.com/ionedu",
            youtube_url="https://youtube.com/@ionedu", facebook_url="https://facebook.com/ionedu",
            about_text=("Ionedu — geografiya fanini zamonaviy va qiziqarli tarzda "
                        "o'rgatuvchi onlayn ta'lim platformasi. Bizning maqsadimiz "
                        "har bir o'quvchiga sifatli bilim berishdir."),
        )
        self.stdout.write("  Sayt sozlamalari: OK")
        return s

    def team(self):
        for order, (name, pos, bio) in enumerate(TEAM):
            tm = TeamMember.objects.create(
                full_name=name, position=pos, bio=bio, order=order,
                telegram="https://t.me/ionedu", is_active=True,
            )
            self._set_dt(tm, created_at=self._days_ago(180, 210))
        self.stdout.write(f"  Jamoa a'zolari: {len(TEAM)}")

    def credentials(self, teachers):
        titles = [
            ("Geografiya o'qituvchisi diplomi", "O'zbekiston Milliy universiteti"),
            ("Oliy toifa sertifikati", "Xalq ta'limi vazirligi"),
            ("Malaka oshirish guvohnomasi", "RTM — Respublika ta'lim markazi"),
            ("Xalqaro GIS sertifikati", "ESRI Academy"),
        ]
        cnt = 0
        for t in teachers:
            for title, issuer in random.sample(titles, random.randint(1, 3)):
                c = TeacherCredential.objects.create(
                    teacher=t, title=title, issuer=issuer,
                    issued_year=random.randint(2010, 2023),
                    note="Tasdiqlangan hujjat.",
                )
                self._set_dt(c, created_at=self._days_ago(100, 150))
                cnt += 1
        self.stdout.write(f"  O'qituvchi hujjatlari: {cnt}")

    # ------------------------------------------------------------- categories
    def categories(self):
        cats = {}
        for name, icon in CATEGORIES:
            cats[name] = Category.objects.create(name=name, icon=icon)
        self.stdout.write(f"  Kategoriyalar: {len(cats)}")
        return cats

    # ----------------------------------------------------------------- courses
    def courses(self, teachers, cats):
        created = []
        for i, (title, cat_name, level, desc, emoji, color) in enumerate(COURSES):
            teacher = teachers[i % len(teachers)]
            # Aksariyat kurslar nashr etilgan, bir nechtasi kutilmoqda/qoralama
            status = "published"
            if i == len(COURSES) - 1:
                status = "pending"
            elif i == len(COURSES) - 2:
                status = "draft"
            is_free = random.random() > 0.4
            course = Course.objects.create(
                title=title, description=desc, teacher=teacher,
                category=cats.get(cat_name), level=level, status=status,
                thumb_emoji=emoji, thumb_color=color,
                is_free=is_free,
                price=0 if is_free else random.choice([49000, 79000, 99000, 149000]),
            )
            created_at = self._days_ago(60, 140)
            self._set_dt(course, created_at=created_at, updated_at=created_at)
            self._build_sections(course, teacher)
            created.append(course)
        self.stdout.write(f"  Kurslar: {len(created)} (bo'lim, dars va testlar bilan)")
        return created

    def _build_sections(self, course, teacher):
        n_sections = random.randint(2, 4)
        lesson_titles = random.sample(LESSON_TITLES, min(len(LESSON_TITLES), n_sections * 4))
        li = 0
        first_lesson = True
        for s_order in range(n_sections):
            section = Section.objects.create(
                course=course, title=SECTION_TITLES[s_order % len(SECTION_TITLES)],
                order=s_order,
            )
            for l_order in range(random.randint(2, 4)):
                if li >= len(lesson_titles):
                    break
                lesson = Lesson.objects.create(
                    section=section, title=lesson_titles[li], order=l_order,
                    video_type="youtube", youtube_url=random.choice(YT),
                    description=random.choice(LESSON_DESC),
                    duration_minutes=random.choice([8, 10, 12, 15, 18, 22, 25]),
                    is_free_preview=first_lesson,
                )
                first_lesson = False
                li += 1
                # Ba'zi darslarga material biriktiramiz
                if random.random() > 0.6:
                    lr = LessonResource.objects.create(
                        lesson=lesson, title=f"{lesson.title} — konspekt (PDF)",
                    )
                    self._set_dt(lr, created_at=self._days_ago(30, 90))
            # Har bo'limga test
            if random.random() > 0.4:
                self._make_quiz(section=section, teacher=teacher,
                                title=f"{section.title} bo'yicha test")

    def _make_quiz(self, teacher, title, section=None, lesson=None,
                   public=False, category=None):
        qs = random.sample(QUIZ_POOL, random.randint(3, 5))
        test = Test.objects.create(
            section=section, lesson=lesson, created_by=teacher,
            category=category, is_public=public, title=title,
            description="Mavzuni qanchalik o'zlashtirganingizni tekshiring.",
            time_limit_minutes=random.choice([5, 8, 10]),
            pass_percent=random.choice([60, 70]),
        )
        self._set_dt(test, created_at=self._days_ago(30, 90))
        for q_order, (qtext, opts, correct) in enumerate(qs):
            q = Question.objects.create(
                test=test, text=qtext, question_type="single", order=q_order)
            order = list(range(len(opts)))
            random.shuffle(order)
            for o_order, idx in enumerate(order):
                AnswerOption.objects.create(
                    question=q, text=opts[idx], is_correct=(idx == correct),
                    order=o_order)
        return test

    # ------------------------------------------------------------ public tests
    def public_tests(self, teachers, cats):
        cat = cats.get("Umumiy geografiya")
        for i, t in enumerate(PUBLIC_TESTS):
            teacher = teachers[i % len(teachers)]
            test = Test.objects.create(
                title=t["title"], description=t["description"],
                time_limit_minutes=t["time"], pass_percent=t["pass"],
                is_public=True, created_by=teacher, category=cat,
            )
            self._set_dt(test, created_at=self._days_ago(20, 100))
            for q_order, (qtype, qtext, opts) in enumerate(t["questions"]):
                q = Question.objects.create(
                    test=test, text=qtext, question_type=qtype, order=q_order)
                for o_order, (otext, ok) in enumerate(opts):
                    AnswerOption.objects.create(
                        question=q, text=otext, is_correct=ok, order=o_order)
        self.stdout.write(f"  Ommaviy testlar: {len(PUBLIC_TESTS)}")

    # ---------------------------------------------- enrollments & engagement
    def enroll_and_engage(self, students, courses):
        published = [c for c in courses if c.status == "published"]
        enr_cnt = rev_cnt = com_cnt = att_cnt = cert_cnt = 0

        for student in students:
            chosen = random.sample(published, random.randint(1, min(4, len(published))))
            for course in chosen:
                enrolled_at = self._days_ago(3, 120)
                enr = Enrollment.objects.create(student=student, course=course)
                self._set_dt(enr, enrolled_at=enrolled_at)
                enr_cnt += 1

                lessons = list(Lesson.objects.filter(section__course=course).order_by(
                    "section__order", "order"))
                tests = list(Test.objects.filter(section__course=course))
                total = len(lessons) + len(tests)

                # Tasodifiy ulush: tugatgan / yarmida / endi boshlagan
                roll = random.random()
                if roll < 0.3:
                    done_lessons = len(lessons)
                    done_tests = len(tests)
                elif roll < 0.7:
                    done_lessons = random.randint(0, len(lessons))
                    done_tests = random.randint(0, len(tests))
                else:
                    done_lessons = random.randint(0, max(1, len(lessons) // 2))
                    done_tests = 0

                for lesson in lessons[:done_lessons]:
                    lp = LessonProgress.objects.create(
                        student=student, lesson=lesson, completed=True)
                    self._set_dt(lp, completed_at=self._days_ago(1, 110))

                for test in tests[:done_tests]:
                    att_cnt += self._take_test(student, test, base_days=110)

                done = done_lessons + done_tests
                progress = round(done / total * 100, 1) if total else 0.0
                completed = total > 0 and done >= total
                Enrollment.objects.filter(pk=enr.pk).update(
                    progress_percent=progress, completed=completed,
                    completed_at=self._days_ago(1, 60) if completed else None)

                # Tugatganlar uchun sharh + sertifikat
                if completed:
                    cert, made = Certificate.objects.get_or_create(
                        student=student, course=course,
                        defaults={"score_percent": round(random.uniform(75, 100), 1)})
                    if made:
                        self._set_dt(cert, issued_at=self._days_ago(1, 55))
                        cert_cnt += 1

                if progress > 40 and random.random() > 0.4:
                    rev, made = Review.objects.get_or_create(
                        student=student, course=course,
                        defaults={"rating": random.choices([5, 4, 3], [6, 3, 1])[0],
                                  "comment": random.choice(REVIEW_COMMENTS)})
                    if made:
                        self._set_dt(rev, created_at=self._days_ago(1, 70))
                        rev_cnt += 1

                # Dars izohlari
                if lessons and random.random() > 0.5:
                    lesson = random.choice(lessons[:max(1, done_lessons)])
                    lc = LessonComment.objects.create(
                        lesson=lesson, user=student,
                        text=random.choice(LESSON_COMMENTS))
                    self._set_dt(lc, created_at=self._days_ago(1, 80))
                    com_cnt += 1

        # Ba'zi o'quvchilar ommaviy testlarni ham ishlaydi
        public_tests = list(Test.objects.filter(is_public=True))
        for student in random.sample(students, len(students) // 2):
            for test in random.sample(public_tests, random.randint(1, min(3, len(public_tests)))):
                att_cnt += self._take_test(student, test, base_days=90)

        self.stdout.write(
            f"  Yozilishlar: {enr_cnt} | Sharhlar: {rev_cnt} | "
            f"Izohlar: {com_cnt} | Test urinishlari: {att_cnt} | Sertifikatlar: {cert_cnt}")

    def _take_test(self, student, test, base_days):
        questions = list(test.questions.prefetch_related("options").all())
        if not questions:
            return 0
        started = self._days_ago(1, base_days)
        attempt = TestAttempt.objects.create(student=student, test=test)
        correct = 0
        for q in questions:
            opts = list(q.options.all())
            correct_opts = [o for o in opts if o.is_correct]
            # 70% ehtimol bilan to'g'ri javob beradi
            if opts and (random.random() < 0.7 and correct_opts):
                chosen = correct_opts[0]
                is_ok = True
                correct += 1
            elif opts:
                chosen = random.choice(opts)
                is_ok = chosen.is_correct
                if is_ok:
                    correct += 1
            else:
                chosen, is_ok = None, False
            aa = AttemptAnswer.objects.create(
                attempt=attempt, question=q, selected_option=chosen, is_correct=is_ok)
            if chosen and q.question_type == "multiple" and is_ok:
                aa.selected_options.set(correct_opts)

        total = len(questions)
        score = round(correct / total * 100, 1) if total else 0.0
        passed = score >= test.pass_percent
        finished = started + datetime.timedelta(minutes=random.randint(2, 9))
        TestAttempt.objects.filter(pk=attempt.pk).update(
            started_at=started, finished_at=finished,
            score_percent=score, correct_count=correct,
            wrong_count=total - correct, passed=passed,
            finish_reason=random.choice(["manual", "manual", "timeout"]))
        return 1

    # --------------------------------------------------------------- resources
    def resources(self, cats, uploaders):
        cat_list = list(cats.values())
        for title, rtype, grade, desc in RESOURCES:
            is_link = rtype == "link"
            r = Resource.objects.create(
                title=title, description=desc, resource_type=rtype,
                grade_level=grade, category=random.choice(cat_list),
                uploaded_by=random.choice(uploaders),
                external_url="https://www.nationalgeographic.com/" if is_link else "",
                download_count=random.randint(5, 850),
                file_size_mb=0 if is_link else round(random.uniform(0.5, 45), 1),
                page_count=0 if rtype in ("video", "link") else random.randint(8, 220),
            )
            self._set_dt(r, created_at=self._days_ago(10, 130))
        self.stdout.write(f"  Resurslar: {len(RESOURCES)}")

    # ------------------------------------------------------------- contact msg
    def contact_messages(self):
        for name, email, subject, msg in CONTACT_MESSAGES:
            cm = ContactMessage.objects.create(
                name=name, email=email, subject=subject, message=msg,
                is_read=random.random() > 0.5)
            self._set_dt(cm, created_at=self._days_ago(1, 40))
        self.stdout.write(f"  Murojaatlar: {len(CONTACT_MESSAGES)}")

    # ------------------------------------------------------------ notifications
    def notifications(self, students, teachers):
        cnt = 0
        # Sistema xush kelibsiz xabari — hammaga
        for u in students + teachers:
            n = Notification.objects.create(
                user=u, kind="system", message="Ionedu platformasiga xush kelibsiz!",
                link="/")
            self._set_dt(n, created_at=u.date_joined + datetime.timedelta(minutes=2))
            cnt += 1

        # O'quvchilar uchun faoliyatga oid bildirishnomalar
        for enr in Enrollment.objects.select_related("course").all():
            n = Notification.objects.create(
                user_id=enr.student_id, kind="enrollment",
                message=f"\"{enr.course.title}\" kursiga muvaffaqiyatli yozildingiz.",
                link=f"/courses/{enr.course.slug}", is_read=random.random() > 0.4)
            self._set_dt(n, created_at=enr.enrolled_at + datetime.timedelta(minutes=1))
            cnt += 1

        for cert in Certificate.objects.select_related("course").all():
            n = Notification.objects.create(
                user_id=cert.student_id, kind="certificate",
                message=f"Tabriklaymiz! \"{cert.course.title}\" kursi uchun sertifikat oldingiz.",
                link="/certificates", is_read=random.random() > 0.5)
            self._set_dt(n, created_at=cert.issued_at)
            cnt += 1

        # O'qituvchilarga kurs tasdiqlangani haqida
        for course in Course.objects.filter(status="published"):
            n = Notification.objects.create(
                user_id=course.teacher_id, kind="course_approved",
                message=f"\"{course.title}\" kursingiz tasdiqlandi va nashr etildi.",
                link=f"/courses/{course.slug}", is_read=True)
            self._set_dt(n, created_at=course.created_at + datetime.timedelta(days=1))
            cnt += 1

        # O'qituvchilarga yangi sharh haqida
        for rev in Review.objects.select_related("course", "student").all():
            n = Notification.objects.create(
                user_id=rev.course.teacher_id, kind="review",
                message=f"{rev.student.display_name} \"{rev.course.title}\" kursiga {rev.rating}★ sharh qoldirdi.",
                link=f"/courses/{rev.course.slug}", is_read=random.random() > 0.6)
            self._set_dt(n, created_at=rev.created_at)
            cnt += 1

        self.stdout.write(f"  Bildirishnomalar: {cnt}")

    # ------------------------------------------------------------------ summary
    def summary(self):
        self.stdout.write(self.style.SUCCESS("\nDemo ma'lumotlar tayyor!"))
        self.stdout.write(
            f"  Foydalanuvchilar: {User.objects.count()} "
            f"(o'qituvchi: {User.objects.filter(role='teacher').count()}, "
            f"o'quvchi: {User.objects.filter(role='student').count()})")
        self.stdout.write(
            f"  Kurslar: {Course.objects.count()} | "
            f"Darslar: {Lesson.objects.count()} | "
            f"Testlar: {Test.objects.count()} | "
            f"Savollar: {Question.objects.count()}")
        self.stdout.write(
            f"  Yozilishlar: {Enrollment.objects.count()} | "
            f"Sertifikatlar: {Certificate.objects.count()} | "
            f"Resurslar: {Resource.objects.count()}")
        self.stdout.write(self.style.HTTP_INFO(
            "\n  Kirish: admin@ionedu.uz / admin1234"))
        self.stdout.write(self.style.HTTP_INFO(
            "  Boshqa hammasi uchun parol: demo1234"))


# ---------------------------------------------------------------------------
# Ommaviy (standalone) geografiya testlari — mazmunli savollar bilan
# ---------------------------------------------------------------------------
PUBLIC_TESTS = [
    {
        "title": "Dunyo poytaxtlari", "time": 8, "pass": 60,
        "description": "Davlatlar va ularning poytaxtlarini qanchalik bilasiz?",
        "questions": [
            ("single", "Fransiyaning poytaxti qaysi shahar?",
             [("Parij", True), ("Lion", False), ("Marsel", False), ("Nitsa", False)]),
            ("single", "Yaponiyaning poytaxti qaysi?",
             [("Osaka", False), ("Tokio", True), ("Kioto", False), ("Nagoya", False)]),
            ("single", "Kanadaning poytaxti qaysi shahar?",
             [("Toronto", False), ("Vankuver", False), ("Ottava", True), ("Monreal", False)]),
            ("multiple", "Qaysilari Yevropa davlatlarining poytaxtlari?",
             [("Vena", True), ("Berlin", True), ("Qohira", False), ("Madrid", True)]),
            ("true_false", "Avstraliyaning poytaxti — Sidney.",
             [("To'g'ri", False), ("Noto'g'ri", True)]),
            ("text", "O'zbekistonning poytaxtini yozing.",
             [("Toshkent", True), ("Tashkent", True)]),
        ],
    },
    {
        "title": "Materiklar va okeanlar", "time": 10, "pass": 70,
        "description": "Yer yuzining yirik quruqlik va suv havzalari bo'yicha sinov.",
        "questions": [
            ("single", "Yer yuzidagi eng katta materik qaysi?",
             [("Afrika", False), ("Yevrosiyo", True), ("Shimoliy Amerika", False), ("Antarktida", False)]),
            ("single", "Eng katta okean qaysi?",
             [("Atlantika", False), ("Hind okeani", False), ("Tinch okean", True), ("Shimoliy Muz okeani", False)]),
            ("multiple", "Qaysi materiklar ekvatordan o'tadi?",
             [("Afrika", True), ("Janubiy Amerika", True), ("Avstraliya", False), ("Yevrosiyo", True)]),
            ("true_false", "Antarktida — eng sovuq materik.",
             [("To'g'ri", True), ("Noto'g'ri", False)]),
            ("text", "Eng kichik materik nomini yozing.",
             [("Avstraliya", True), ("Australia", True)]),
        ],
    },
    {
        "title": "O'zbekiston geografiyasi", "time": 12, "pass": 60,
        "description": "Vatanimiz tabiati, viloyatlari va suv havzalari haqida test.",
        "questions": [
            ("single", "O'zbekiston nechta viloyatdan iborat?",
             [("10", False), ("12", True), ("13", False), ("14", False)]),
            ("multiple", "Qaysi daryolar O'zbekiston hududidan oqib o'tadi?",
             [("Amudaryo", True), ("Sirdaryo", True), ("Volga", False), ("Zarafshon", True)]),
            ("true_false", "O'zbekiston dengizga chiqish yo'liga ega emas.",
             [("To'g'ri", True), ("Noto'g'ri", False)]),
            ("text", "Qoraqalpog'iston Respublikasining poytaxtini yozing.",
             [("Nukus", True)]),
        ],
    },
    {
        "title": "Iqlim va ob-havo", "time": 10, "pass": 60,
        "description": "Iqlim mintaqalari, ob-havo hodisalari va ularning sabablari.",
        "questions": [
            ("single", "Ob-havoni o'rganadigan fan qanday nomlanadi?",
             [("Geologiya", False), ("Meteorologiya", True), ("Gidrologiya", False), ("Kartografiya", False)]),
            ("single", "Eng issiq iqlim mintaqasi qaysi?",
             [("Mo''tadil", False), ("Tropik", False), ("Ekvatorial", True), ("Subtropik", False)]),
            ("true_false", "Atmosfera bosimi balandlik oshgan sari kamayadi.",
             [("To'g'ri", True), ("Noto'g'ri", False)]),
            ("text", "Shamol tezligini o'lchaydigan asbob nomini yozing.",
             [("Anemometr", True)]),
        ],
    },
    {
        "title": "Xarita va masshtab", "time": 12, "pass": 70,
        "description": "Kartografiya asoslari: masshtab, shartli belgilar va koordinatalar.",
        "questions": [
            ("single", "1:100 000 masshtabda 1 sm necha km ga teng?",
             [("1 km", True), ("10 km", False), ("100 km", False), ("0.1 km", False)]),
            ("single", "0° meridian qaysi shahar orqali o'tadi?",
             [("Parij", False), ("London (Grinvich)", True), ("Nyu-York", False), ("Moskva", False)]),
            ("true_false", "Ekvator — eng uzun parallel.",
             [("To'g'ri", True), ("Noto'g'ri", False)]),
            ("text", "Yerning qog'ozdagi kichraytirilgan tasviri qanday ataladi?",
             [("Xarita", True), ("Karta", True)]),
        ],
    },
    {
        "title": "Vulqonlar va zilzilalar", "time": 10, "pass": 60,
        "description": "Yer ichki kuchlari: vulqonizm va seysmik hodisalar.",
        "questions": [
            ("single", "Zilzila kuchini o'lchaydigan shkala qaysi?",
             [("Selsiy", False), ("Rixter", True), ("Bofort", False), ("Kelvin", False)]),
            ("multiple", "Qaysilari vulqonli tog'lar?",
             [("Fudziyama", True), ("Vezuviy", True), ("Chimyon", False), ("Etna", True)]),
            ("true_false", "Zilzila o'chog'i yer yuzasida joylashadi.",
             [("To'g'ri", False), ("Noto'g'ri", True)]),
            ("text", "Vulqondan otilib chiqadigan erigan jins nomini yozing.",
             [("Lava", True), ("Magma", True)]),
        ],
    },
    {
        "title": "Buyuk geografik kashfiyotlar", "time": 12, "pass": 60,
        "description": "Sayohatchilar, kashfiyotlar va ekspeditsiyalar tarixi.",
        "questions": [
            ("single", "Amerikani 1492-yilda kim kashf etgan?",
             [("Vasko da Gama", False), ("Xristofor Kolumb", True), ("Magellan", False), ("Jeyms Kuk", False)]),
            ("single", "Dunyo bo'ylab birinchi sayohatni kim boshlagan?",
             [("Fernan Magellan", True), ("Marko Polo", False), ("Vespuchchi", False), ("Bartolomeu Dias", False)]),
            ("true_false", "Amerika qit'asi Amerigo Vespuchchi sharafiga nomlangan.",
             [("To'g'ri", True), ("Noto'g'ri", False)]),
            ("text", "Hindistonga dengiz yo'lini ochgan portugal sayohatchisini yozing.",
             [("Gama", True), ("da Gama", True), ("Vasko da Gama", True)]),
        ],
    },
]
