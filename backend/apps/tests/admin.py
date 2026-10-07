from django.contrib import admin
from .models import Test, Question, AnswerOption, TestAttempt, AttemptAnswer


class OptionInline(admin.TabularInline):
    model = AnswerOption
    extra = 4


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0


@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ('title', 'section', 'lesson', 'pass_percent')
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'test', 'order')
    inlines = [OptionInline]


admin.site.register(TestAttempt)
admin.site.register(AttemptAnswer)
