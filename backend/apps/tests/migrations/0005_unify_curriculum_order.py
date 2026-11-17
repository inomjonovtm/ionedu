from django.db import migrations
from django.db.models import F


def forwards(apps, schema_editor):
    """Give lessons and tests one shared position sequence per section.

    Before: lessons were ordered by `order`, tests had no position and were
    always rendered after every lesson. Lesson-attached tests become section
    tests placed right after their lesson.
    """
    Section = apps.get_model('courses', 'Section')
    Lesson = apps.get_model('courses', 'Lesson')
    Test = apps.get_model('tests', 'Test')
    TestAttempt = apps.get_model('tests', 'TestAttempt')

    for section in Section.objects.all():
        items = []
        for lesson in Lesson.objects.filter(section=section).order_by('order', 'id'):
            items.append(lesson)
            for t in Test.objects.filter(lesson=lesson).order_by('created_at', 'id'):
                t.section_id = section.id
                t.lesson_id = None
                items.append(t)
        for t in Test.objects.filter(section=section, lesson__isnull=True).order_by('created_at', 'id'):
            if t not in items:
                items.append(t)
        for pos, obj in enumerate(items):
            obj.order = pos
            obj.save()

    TestAttempt.objects.filter(finished_at__isnull=False).update(
        earned_points=F('correct_count'),
        max_points=F('correct_count') + F('wrong_count'),
    )


class Migration(migrations.Migration):

    dependencies = [
        ('tests', '0004_attemptanswer_points_earned_question_explanation_and_more'),
        ('courses', '0002_lessoncomment_lessonresource'),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
