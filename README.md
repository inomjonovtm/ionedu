# Ionedu — Geografiya o'rganish platformasi

Full-stack educational platform built for geography students and teachers in Uzbekistan.

**Tech stack:** Django 5.2 (REST + JWT) backend · React 18 + Vite frontend · SQLite (dev) · ReportLab PDF certificates.

## Quick start

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

Backend serves at `http://127.0.0.1:8000/` and the API at `/api/...`.

### Frontend

In a separate terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend serves at `http://localhost:5173/` (or 5174 if 5173 is busy — both are allowed by CORS in dev).

### Seed accounts (logging in by email)

| Role     | Email                | Password    |
|----------|----------------------|-------------|
| Admin    | `admin@ionedu.uz`    | admin123    |
| Teacher  | `teacher@ionedu.uz`  | teacher123  |
| Student  | `student@ionedu.uz`  | student123  |

If you need to recreate them, run:

```powershell
.\venv\Scripts\python.exe manage.py shell -c @"
from django.contrib.auth import get_user_model
U = get_user_model()
seeds = [
    ('admin@ionedu.uz','+998901112233','Admin','admin','admin123', True),
    ('teacher@ionedu.uz','+998901112244','Doniyor Rahimov','teacher','teacher123', False),
    ('student@ionedu.uz','+998901112255','Aziza Tojiyeva','student','student123', False),
]
for email, phone, name, role, pw, su in seeds:
    u, c = U.objects.get_or_create(email=email, defaults={'username': email, 'phone': phone, 'full_name': name, 'role': role})
    u.set_password(pw); u.is_staff = su; u.is_superuser = su
    if role == 'student':
        u.birth_year = 2009; u.region='Toshkent'; u.district='Yunusobod'; u.school='1-maktab'
    u.save()
"@
```

## Project structure

```
Ionedu/
├── backend/
│   ├── ionedu/                    Django project (settings, urls)
│   ├── apps/
│   │   ├── accounts/              CustomUser (phone-based), JWT auth, profile,
│   │   │                          admin user mgmt, teachers, search, contact,
│   │   │                          site settings, public stats
│   │   ├── courses/               Course, Section, Lesson, Enrollment, Review,
│   │   │                          LessonComment, LessonResource (materials)
│   │   ├── tests/                 Test, Question, AnswerOption, TestAttempt
│   │   ├── resources/             Reusable downloadable resources
│   │   ├── certificates/          ReportLab PDF certificate generator
│   │   ├── ratings/               Leaderboards (students/teachers/courses)
│   │   └── notifications/         In-app notifications + unread count
│   ├── manage.py
│   ├── requirements.txt
│   └── venv/
└── frontend/
    ├── src/
    │   ├── api/client.js          Axios + JWT refresh interceptor
    │   ├── store/auth.js          Zustand auth store (phone login)
    │   ├── components/
    │   │   ├── Navbar.jsx         Animated nav, search, user dropdown
    │   │   ├── Footer.jsx         Pulls site settings + public stats
    │   │   ├── Layout.jsx         Public-page wrapper
    │   │   ├── DashLayout.jsx     Sidebar layout for teacher/admin
    │   │   ├── Protected.jsx      Auth + role guard
    │   │   ├── CourseCard.jsx     Course list card (image fallback to emoji)
    │   │   ├── PhoneInput.jsx     +998 XX XXX XX XX mask
    │   │   ├── FileInput.jsx      Styled drop-zone file picker
    │   │   ├── LessonMaterialsManager.jsx   per-lesson file upload
    │   │   └── Icon.jsx           Lucide wrapper
    │   ├── pages/                 (40+ pages — see route map below)
    │   ├── ioneda.css             Design system
    │   ├── App.jsx                Router
    │   └── main.jsx
    ├── index.html                 Google Fonts: Plus Jakarta + Inter + Cormorant
    └── package.json
```

## Roles & permissions

| Capability                                       | Student | Teacher | Admin |
|--------------------------------------------------|---------|---------|-------|
| Browse courses, teachers, resources, ratings     | ✅      | ✅      | ✅    |
| Enroll, watch lessons, take tests, get certs     | ✅      | —       | —     |
| Comment on lessons, leave course reviews         | ✅      | ✅      | ✅    |
| Message a teacher                                | ✅      | —       | —     |
| Create courses (saved as `draft`)                | —       | ✅      | ✅    |
| Add sections, lessons, tests, lesson materials   | —       | ✅      | ✅    |
| Submit course to moderation (`pending`)          | —       | ✅      | —     |
| Approve / reject pending courses                 | —       | —       | ✅    |
| Publish own course directly (skip moderation)    | —       | —       | ✅    |
| Manage users (view detail, change role, block)   | —       | —       | ✅    |
| Edit site settings & social links                | —       | —       | ✅    |
| Read inbound contact messages                    | —       | —       | ✅    |

## Course publishing flow

1. Teacher (or admin) creates a course → `status = draft`.
2. Teacher fills out: basics → sections/lessons → tests → preview.
3. Teacher clicks **"Moderatsiyaga yuborish"** → `status = pending`.
4. Admin sees it under **`/admin-panel/courses` → Kutilmoqda**.
5. Admin clicks **Tasdiqlash** → `status = published`, the course becomes publicly visible.
6. Admin can also **Rad etish** with a note — the teacher gets a notification.
7. Admin creating their own course can hit **"Darhol nashr etish"** to skip moderation.

## Auth

- **Login by email** + password. Legacy accounts can still type their phone number
  into the same field — the backend resolves it.
- **Google Sign-In** ("Continue with Google", Google Identity Services) on the login
  and register pages. New Google users are created as `student` with a verified
  email and no password. Requires an OAuth client ID — see setup below.
- **Phone number is optional** — collected on register/profile as contact info only,
  normalized to `+998XXXXXXXXX` (loose formats all normalize to the canonical form).
- Password reset: a 6-digit code is sent **by email** (`/auth/password-reset/` →
  `/auth/password-reset/confirm/`). In dev (no `EMAIL_HOST` configured) the code
  is printed to the runserver console.
- JWT access (60min) + refresh (7days). Refresh handled transparently by Axios interceptor.
- Registration asks role (student/teacher), then for students collects: birth year, region, district, school.
- After login the user **lands on home** (`/`). They navigate to their panel/profile via the avatar dropdown.

### Google Sign-In setup

1. [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services →
   Credentials → **Create credentials → OAuth client ID** → type **Web application**.
2. Authorized JavaScript origins: `http://localhost:5173` (dev) plus your production origin.
3. Put the same client ID in **both** env files:
   - `backend/.env` → `GOOGLE_CLIENT_ID=...`
   - `frontend/.env` → `VITE_GOOGLE_CLIENT_ID=...`
4. Restart both servers. With no client ID configured the Google button is simply
   hidden and email/password auth keeps working.

## Route map (frontend)

**Public**
- `/` Home (live stats from `/api/stats/`)
- `/courses` Catalog with category/level/free filter + name search + sort
- `/courses/:slug` Detail with tabs: Dastur · Haqida · Sharhlar (+ review form)
- `/teachers` · `/teachers/:id` (with "Yozish" message modal)
- `/resources` filter by type
- `/ratings` Students / Teachers / Courses
- `/search?q=...`
- `/about` · `/contact` (POST → admin's Xabarlar)
- `/certificate/:uuid` public certificate view + PDF download
- `/404`

**Auth**
- `/auth/login` (email + password, or Google)
- `/auth/register` (2-step; email required, phone optional, or Google)
- `/auth/reset` (email-based reset with 6-digit code)

**Unified profile** (every role; replaces the old student dashboard)
- `/profile` — tabs: Umumiy · Kurslarim · Sertifikatlar · Test natijalari · Tahrirlash · Parol
- Avatar upload available for every role
- `/notifications`
- Old `/dashboard/*` routes redirect to `/profile`

**Learning (enrolled)**
- `/learn/:slug/:lessonId` — video player + curriculum sidebar + 3 tabs (Tavsif/Muhokama/Resurslar)
- `/learn/:slug/test/:testId` — timed test
- `/learn/:slug/test/:testId/result/:attemptId` — animated score circle + wrong-answer review
- `/learn/:slug/complete` — congrats + certificate preview

**Teacher panel** (role=teacher | admin)
- `/teacher` — stats, courses table, recent students, latest reviews
- `/teacher/courses`
- `/teacher/courses/new` · `/teacher/courses/:slug/edit` — 4-step builder with file uploads
- `/teacher/students` — students with progress
- `/teacher/reviews`

**Admin panel** (role=admin)
- `/admin-panel` — stats, pending courses, contact-message inbox, recent users
- `/admin-panel/users` · `/admin-panel/users/:id` — full user detail with enrolments / certs / courses
- `/admin-panel/courses` · `/admin-panel/courses/new` · `/admin-panel/courses/:slug/edit`
- `/admin-panel/certificates`
- `/admin-panel/resources` (upload modal w/ FileInput)
- `/admin-panel/reviews`
- `/admin-panel/messages` — inbound contact form messages with read state
- `/admin-panel/settings` — site name, contact email, social links, about

## Course builder (Google-Forms-style modals)

- **Section** modal — title only.
- **Lesson** modal — two tabs:
  - *Asosiy*: title, video type (YouTube URL or upload), duration, free-preview flag, description.
  - *Materiallar*: per-lesson downloadable files (PDF, slides, etc.) — drag-drop FileInput.
- **Test** modal — title, pass-percent, optional time limit.
- **Question** modal — text + 4 answer options + click marker to mark the correct one.

All forms use the styled drop-zone `<FileInput />` instead of native file picker.

## API surface

All under `/api`.

### Auth
| Method | Path                       |
|--------|----------------------------|
| POST   | `/auth/register/`          |
| POST   | `/auth/login/`             |
| POST   | `/auth/google/`            |
| POST   | `/auth/refresh/`           |
| POST   | `/auth/logout/`            |
| GET    | `/auth/me/`                |
| PUT    | `/auth/me/update/`         |
| POST   | `/auth/password-reset/`    |
| POST   | `/auth/password-reset/confirm/` |
| POST   | `/auth/change-password/`   |

### Courses & learning
| Method            | Path |
|-------------------|------|
| GET               | `/categories/` |
| GET / POST        | `/courses/` (filters: `category`, `level`, `is_free`, `status`, `mine`, `search`, `ordering`) |
| GET / PATCH / DELETE | `/courses/<slug>/` |
| GET               | `/courses/<slug>/curriculum/` |
| POST              | `/courses/<slug>/enroll/` |
| GET / POST        | `/courses/<slug>/reviews/` |
| GET               | `/courses/enrolled/` |
| GET / POST        | `/courses/<slug>/sections/` |
| GET / PATCH / DELETE | `/sections/<id>/` |
| POST              | `/sections/<id>/lessons/` |
| GET / PATCH / DELETE | `/lessons/<id>/` |
| POST              | `/lessons/<id>/complete/` |
| GET / POST        | `/lessons/<id>/comments/` |
| DELETE            | `/comments/<id>/` |
| GET / POST        | `/lessons/<id>/materials/` |
| DELETE            | `/materials/<id>/` |

### Tests
| Method | Path |
|--------|------|
| POST   | `/tests/` |
| GET / PATCH / DELETE | `/tests/<id>/` |
| GET    | `/tests/<id>/detail/` |
| POST   | `/tests/<id>/start/` |
| POST   | `/tests/<id>/questions/` |
| GET / PATCH / DELETE | `/questions/<id>/` |
| POST   | `/attempts/<id>/submit/` |
| GET    | `/attempts/<id>/result/` |
| GET    | `/attempts/mine/` |

### Resources, certificates, ratings, notifications, stats
| Method | Path |
|--------|------|
| GET / POST | `/resources/` |
| DELETE | `/resources/<id>/` |
| GET    | `/certificates/mine/` |
| GET    | `/certificates/<uuid>/` (public) |
| POST   | `/certificates/generate/<course_slug>/` |
| GET    | `/ratings/students/` · `/ratings/teachers/` · `/ratings/courses/` |
| GET    | `/notifications/` · POST `/notifications/read-all/` |
| GET    | `/notifications/unread-count/` |
| GET    | `/stats/` (public counters for home page) |

### Teachers & admin
| Method | Path |
|--------|------|
| GET    | `/teachers/` · `/teachers/<id>/` |
| POST   | `/teachers/<id>/message/` (student → teacher) |
| GET    | `/teacher/students/` · `/teacher/reviews/` |
| GET    | `/admin/users/` |
| GET    | `/admin/users/<id>/detail/` |
| POST   | `/admin/users/<id>/status/` (block / unblock) |
| PUT    | `/admin/users/<id>/role/` |
| GET    | `/admin/stats/` |
| GET    | `/admin/courses/pending/` |
| POST   | `/admin/courses/<slug>/approve/` |
| POST   | `/admin/courses/<slug>/reject/` |
| GET    | `/admin/certificates/` |
| GET / DELETE | `/admin/reviews/` · `/admin/reviews/<id>/` |
| GET    | `/admin/contact-messages/` |
| POST   | `/admin/contact-messages/<id>/read/` |
| GET / PUT | `/admin/settings/` |
| GET    | `/search/?q=...` |
| POST   | `/contact/` |

## Design system

- **Fonts**: Plus Jakarta Sans (headings, weights 500-800), Inter (body, weights 400-700), Cormorant Garamond (certificate).
- **Colors**: Primary `#16A34A` (green-600), neutral whites, accents in blue/amber/rose/teal/violet/slate.
- **Radius**: cards 12px, buttons 8px, badges 999px.
- **Animations**: subtle fade-up on mount, hover-lift on cards, scaled-in modals, animated nav underline.

All styles live in `frontend/src/ioneda.css`. **No Tailwind** — design system is hand-rolled to match the original HTML mockups 1:1.

## Notes on the data model

- `CustomUser` uses `email` as the username field (`USERNAME_FIELD`); `phone` is optional and unique when present. Derived `display_name` and `initials`. Students additionally carry `birth_year`, `region`, `district`, `school`.
- `Course.thumbnail` is an optional uploaded image; if missing the UI falls back to `thumb_emoji` + `thumb_color`.
- `Lesson` may have a `youtube_url` OR an uploaded `video_file`. A lesson may also have multiple `LessonResource` files (download materials).
- A `Course` has `status ∈ {draft, pending, published, rejected}`. Only `published` is visible publicly; teachers can see their own all-statuses via `?mine=1`.
- `Certificate` is automatically issued once a student's `Enrollment.progress_percent` hits 100% (triggered by lesson-complete endpoint). PDF is rendered by ReportLab and stored as a `FileField`.
- `LessonComment` has `lesson`, `user`, `text` — visible to all enrolled students.

## Deploying to production

The codebase is production-ready out of the box — security hardening turns on
automatically when `DEBUG=False`:

1. **Backend env** (`backend/.env`):
   ```
   SECRET_KEY=<long random string>
   DEBUG=False
   ALLOWED_HOSTS=api.yourdomain.uz
   CORS_ALLOWED_ORIGINS=https://yourdomain.uz
   CSRF_TRUSTED_ORIGINS=https://yourdomain.uz,https://api.yourdomain.uz
   ```
   With `DEBUG=False` the app enables HTTPS redirect, HSTS, secure cookies and
   WhiteNoise's hashed/compressed static storage automatically.
2. **Frontend env** (`frontend/.env`):
   ```
   VITE_API_URL=https://api.yourdomain.uz/api
   VITE_MEDIA_URL=https://api.yourdomain.uz
   ```
3. Build & collect:
   ```
   cd frontend && npm run build          # → dist/ (host on Nginx / Vercel / static CDN)
   cd backend && python manage.py collectstatic --noinput
   gunicorn ionedu.wsgi   # or waitress-serve on Windows
   ```
4. `/media/` is served by Django with HTTP range support (videos are seekable);
   for heavy traffic put Nginx or a CDN in front of it.
5. Optional but recommended for scale: switch SQLite → PostgreSQL and set the
   `EMAIL_HOST*` vars so password-reset codes go out via real SMTP.

## License

MIT.
