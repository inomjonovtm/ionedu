# -*- coding: utf-8 -*-
"""Seed 10 public standalone geography tests with mixed question types.
Run:  python seed_tests.py   (idempotent — skips tests that already exist)"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ionedu.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.courses.models import Category
from apps.tests.models import Test, Question, AnswerOption

User = get_user_model()
teachers = list(User.objects.filter(role='teacher').order_by('id'))
category = Category.objects.first()

# Q tuple: (type, text, [(option_text, is_correct), ...])
TESTS = [
    {
        'title': "Dunyo poytaxtlari",
        'description': "Davlatlar va ularning poytaxtlarini qanchalik bilasiz? Tezkor sinov.",
        'time': 8, 'pass': 60,
        'questions': [
            ('single', "Fransiyaning poytaxti qaysi shahar?",
             [("Parij", True), ("Lion", False), ("Marsel", False), ("Nitsa", False)]),
            ('single', "Yaponiyaning poytaxti qaysi?",
             [("Osaka", False), ("Tokio", True), ("Kioto", False), ("Nagoya", False)]),
            ('single', "Kanadaning poytaxti qaysi shahar?",
             [("Toronto", False), ("Vankuver", False), ("Ottava", True), ("Monreal", False)]),
            ('multiple', "Quyidagilardan qaysilari Yevropa davlatlarining poytaxtlari?",
             [("Vena", True), ("Berlin", True), ("Qohira", False), ("Madrid", True)]),
            ('true_false', "Avstraliyaning poytaxti — Sidney.",
             [("To'g'ri", False), ("Noto'g'ri", True)]),
            ('text', "O'zbekistonning poytaxtini yozing.",
             [("Toshkent", True), ("Tashkent", True)]),
            ('text', "Turkiyaning poytaxtini yozing.",
             [("Anqara", True), ("Ankara", True)]),
        ],
    },
    {
        'title': "Materiklar va okeanlar",
        'description': "Yer yuzining yirik quruqlik va suv havzalari bo'yicha bilimingizni sinang.",
        'time': 10, 'pass': 70,
        'questions': [
            ('single', "Yer yuzidagi eng katta materik qaysi?",
             [("Afrika", False), ("Yevrosiyo", True), ("Shimoliy Amerika", False), ("Antarktida", False)]),
            ('single', "Eng katta okean qaysi?",
             [("Atlantika okeani", False), ("Hind okeani", False), ("Tinch okean", True), ("Shimoliy Muz okeani", False)]),
            ('multiple', "Qaysi materiklar ekvator chizig'idan o'tadi?",
             [("Afrika", True), ("Janubiy Amerika", True), ("Avstraliya", False), ("Osiyo (Yevrosiyo)", True)]),
            ('true_false', "Antarktida — eng sovuq materik.",
             [("To'g'ri", True), ("Noto'g'ri", False)]),
            ('true_false', "Hind okeani Atlantika okeanidan kattaroq.",
             [("To'g'ri", False), ("Noto'g'ri", True)]),
            ('text', "Eng kichik materik nomini yozing.",
             [("Avstraliya", True), ("Australia", True)]),
        ],
    },
    {
        'title': "O'zbekiston geografiyasi",
        'description': "Vatanimiz tabiati, viloyatlari va suv havzalari haqida test.",
        'time': 12, 'pass': 60,
        'questions': [
            ('single', "O'zbekiston nechta viloyatdan iborat?",
             [("10", False), ("12", True), ("13", False), ("14", False)]),
            ('single', "O'zbekistondagi eng baland nuqta qaysi tog' tizmasida joylashgan?",
             [("Hisor tizmasi", True), ("Nurota tizmasi", False), ("Chotqol tizmasi", False), ("Zarafshon tizmasi", False)]),
            ('multiple', "Quyidagi daryolardan qaysilari O'zbekiston hududidan oqib o'tadi?",
             [("Amudaryo", True), ("Sirdaryo", True), ("Volga", False), ("Zarafshon", True)]),
            ('true_false', "O'zbekiston dengizga chiqish yo'liga ega emas.",
             [("To'g'ri", True), ("Noto'g'ri", False)]),
            ('true_false', "Orol dengizi hozirda to'liq saqlanib qolgan.",
             [("To'g'ri", False), ("Noto'g'ri", True)]),
            ('text', "Qoraqalpog'iston Respublikasining poytaxtini yozing.",
             [("Nukus", True)]),
        ],
    },
    {
        'title': "Daryolar va ko'llar",
        'description': "Dunyodagi yirik daryolar va ko'llar bo'yicha bilim sinovi.",
        'time': 10, 'pass': 60,
        'questions': [
            ('single', "Dunyodagi eng uzun daryo qaysi?",
             [("Amazonka", False), ("Nil", True), ("Yantszi", False), ("Missisipi", False)]),
            ('single', "Dunyodagi eng chuqur ko'l qaysi?",
             [("Kaspiy", False), ("Baykal", True), ("Viktoriya", False), ("Issiqko'l", False)]),
            ('multiple', "Quyidagilardan qaysilari Afrika daryolari?",
             [("Nil", True), ("Kongo", True), ("Dunay", False), ("Niger", True)]),
            ('true_false', "Kaspiy dengizi aslida dunyodagi eng katta ko'ldir.",
             [("To'g'ri", True), ("Noto'g'ri", False)]),
            ('text', "Janubiy Amerikadagi eng sersuv daryo nomini yozing.",
             [("Amazonka", True), ("Amazon", True)]),
            ('single', "Amudaryo va Sirdaryo qaysi havzaga quyiladi?",
             [("Kaspiy dengizi", False), ("Orol dengizi", True), ("Balxash ko'li", False), ("Qora dengiz", False)]),
        ],
    },
    {
        'title': "Iqlim va ob-havo",
        'description': "Iqlim mintaqalari, ob-havo hodisalari va ularning sabablari.",
        'time': 10, 'pass': 60,
        'questions': [
            ('single', "Ob-havoni o'rganadigan fan qanday nomlanadi?",
             [("Geologiya", False), ("Meteorologiya", True), ("Gidrologiya", False), ("Kartografiya", False)]),
            ('single', "Yer yuzida eng issiq iqlim mintaqasi qaysi?",
             [("Mo''tadil", False), ("Tropik", False), ("Ekvatorial", True), ("Subtropik", False)]),
            ('multiple', "Iqlimga ta'sir etuvchi omillarni belgilang.",
             [("Geografik kenglik", True), ("Dengiz oqimlari", True), ("Tuproq rangi", False), ("Relyef", True)]),
            ('true_false', "Atmosfera bosimi balandlik oshgan sari kamayadi.",
             [("To'g'ri", True), ("Noto'g'ri", False)]),
            ('text', "Shamol tezligini o'lchaydigan asbob nomini yozing.",
             [("Anemometr", True)]),
            ('true_false', "O'zbekiston iqlimi keskin kontinental hisoblanadi.",
             [("To'g'ri", True), ("Noto'g'ri", False)]),
        ],
    },
    {
        'title': "Xarita va masshtab",
        'description': "Kartografiya asoslari: masshtab, shartli belgilar va koordinatalar.",
        'time': 12, 'pass': 70,
        'questions': [
            ('single', "1:100 000 masshtabda xaritadagi 1 sm necha km ga teng?",
             [("1 km", True), ("10 km", False), ("100 km", False), ("0.1 km", False)]),
            ('single', "Globusda 0° meridian qaysi shahar orqali o'tadi?",
             [("Parij", False), ("London (Grinvich)", True), ("Nyu-York", False), ("Moskva", False)]),
            ('multiple', "Xaritada qaysi elementlar bo'lishi shart?",
             [("Masshtab", True), ("Shartli belgilar", True), ("Muallif rasmi", False), ("Yo'nalish (shimol)", True)]),
            ('true_false', "Ekvator — eng uzun parallel.",
             [("To'g'ri", True), ("Noto'g'ri", False)]),
            ('text', "Yerning qog'ozdagi kichraytirilgan tasviri qanday ataladi? (bitta so'z)",
             [("Xarita", True), ("Karta", True)]),
        ],
    },
    {
        'title': "Vulqonlar va zilzilalar",
        'description': "Yer ichki kuchlari: vulqonizm, seysmik hodisalar va litosfera plitalari.",
        'time': 10, 'pass': 60,
        'questions': [
            ('single', "Zilzila kuchini o'lchaydigan shkala qaysi?",
             [("Selsiy", False), ("Rixter", True), ("Bofort", False), ("Kelvin", False)]),
            ('single', "Dunyodagi eng faol seysmik mintaqa qanday ataladi?",
             [("Atlantika halqasi", False), ("Tinch okean olovli halqasi", True), ("Alp kamari", False), ("Rift vodiysi", False)]),
            ('multiple', "Quyidagilardan qaysilari vulqonli tog'lar?",
             [("Fudziyama", True), ("Vezuviy", True), ("Chimyon", False), ("Etna", True)]),
            ('true_false', "Zilzila o'chog'i yer yuzasida joylashadi.",
             [("To'g'ri", False), ("Noto'g'ri", True)]),
            ('text', "Vulqondan otilib chiqadigan erigan tog' jinsi nomini yozing.",
             [("Lava", True), ("Magma", True)]),
        ],
    },
    {
        'title': "Dunyo davlatlari",
        'description': "Davlatlar, ularning joylashuvi va o'ziga xos xususiyatlari.",
        'time': 10, 'pass': 60,
        'questions': [
            ('single', "Maydoni bo'yicha dunyodagi eng katta davlat qaysi?",
             [("Kanada", False), ("Xitoy", False), ("Rossiya", True), ("AQSH", False)]),
            ('single', "Aholisi eng ko'p davlat qaysi (2024-yil holatiga)?",
             [("Xitoy", False), ("Hindiston", True), ("AQSH", False), ("Indoneziya", False)]),
            ('multiple', "Quyidagilardan qaysilari O'zbekiston bilan chegaradosh?",
             [("Qozog'iston", True), ("Tojikiston", True), ("Eron", False), ("Afg'oniston", True)]),
            ('true_false', "Vatikan — dunyodagi eng kichik davlat.",
             [("To'g'ri", True), ("Noto'g'ri", False)]),
            ('text', "Ikki materik (Yevropa va Osiyo)da joylashgan, poytaxti Anqara bo'lgan davlat nomini yozing.",
             [("Turkiya", True)]),
            ('true_false', "Misr davlati ikki materikda joylashgan.",
             [("To'g'ri", True), ("Noto'g'ri", False)]),
        ],
    },
    {
        'title': "Tabiat zonalari",
        'description': "Tundra, tayga, dasht, cho'l va boshqa tabiat zonalari haqida.",
        'time': 10, 'pass': 60,
        'questions': [
            ('single', "Eng katta cho'l qaysi?",
             [("Qoraqum", False), ("Sahroi Kabir", True), ("Gobi", False), ("Atakama", False)]),
            ('single', "Doimiy muzloq yerlar qaysi tabiat zonasiga xos?",
             [("Tayga", False), ("Tundra", True), ("Dasht", False), ("Savanna", False)]),
            ('multiple', "Cho'l zonasiga xos belgilarni tanlang.",
             [("Yog'in juda kam", True), ("Harorat keskin o'zgaradi", True), ("O'simliklar zich o'sadi", False), ("Sho'rxok tuproqlar uchraydi", True)]),
            ('true_false', "Savanna — Afrikaning tropik o'tloq zonasi.",
             [("To'g'ri", True), ("Noto'g'ri", False)]),
            ('text', "Ignabargli o'rmonlar zonasi qanday nomlanadi?",
             [("Tayga", True)]),
        ],
    },
    {
        'title': "Buyuk geografik kashfiyotlar",
        'description': "Sayohatchilar, kashfiyotlar va ekspeditsiyalar tarixi.",
        'time': 12, 'pass': 60,
        'questions': [
            ('single', "Amerikani 1492-yilda kim kashf etgan?",
             [("Vasko da Gama", False), ("Xristofor Kolumb", True), ("Magellan", False), ("Jeyms Kuk", False)]),
            ('single', "Dunyo bo'ylab birinchi sayohatni kim boshlab bergan?",
             [("Fernan Magellan", True), ("Marko Polo", False), ("Amerigo Vespuchchi", False), ("Bartolomeu Dias", False)]),
            ('multiple', "Quyidagilardan qaysilari mashhur sayohatchilar?",
             [("Marko Polo", True), ("Ibn Battuta", True), ("Isaak Nyuton", False), ("Vasko da Gama", True)]),
            ('true_false', "Amerika qit'asi Amerigo Vespuchchi sharafiga nomlangan.",
             [("To'g'ri", True), ("Noto'g'ri", False)]),
            ('text', "Hindistonga dengiz yo'lini ochgan portugal sayohatchisining familiyasini yozing.",
             [("Gama", True), ("da Gama", True), ("Vasko da Gama", True)]),
        ],
    },
]


def run():
    if not teachers:
        print("Teacher topilmadi — avval o'qituvchi yarating.")
        return
    created = 0
    for idx, t in enumerate(TESTS):
        if Test.objects.filter(title=t['title'], section__isnull=True, lesson__isnull=True).exists():
            print(f"  o'tkazib yuborildi (bor): {t['title']}")
            continue
        teacher = teachers[idx % len(teachers)]
        test = Test.objects.create(
            title=t['title'], description=t['description'],
            time_limit_minutes=t['time'], pass_percent=t['pass'],
            is_public=True, created_by=teacher, category=category,
        )
        for q_order, (qtype, qtext, opts) in enumerate(t['questions']):
            q = Question.objects.create(test=test, text=qtext, question_type=qtype, order=q_order)
            for o_order, (otext, ok) in enumerate(opts):
                AnswerOption.objects.create(question=q, text=otext, is_correct=ok, order=o_order)
        created += 1
        print(f"  + {t['title']} ({len(t['questions'])} savol, {teacher.display_name})")
    print(f"\nJami yangi test: {created}")


if __name__ == '__main__':
    run()
