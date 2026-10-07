from django.contrib import admin
from .models import Category, Course, Section, Lesson, Enrollment, LessonProgress, Review


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0


class SectionInline(admin.TabularInline):
    model = Section
    extra = 0


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'teacher', 'category', 'level', 'status', 'is_free', 'created_at')
    list_filter = ('status', 'level', 'is_free', 'category')
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [SectionInline]


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order')
    inlines = [LessonInline]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'section', 'duration_minutes', 'video_type')


admin.site.register(Enrollment)
admin.site.register(LessonProgress)
admin.site.register(Review)
