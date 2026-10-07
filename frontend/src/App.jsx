import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/auth'
import Profile from './pages/Profile'

import Home from './pages/Home'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import Tests from './pages/Tests'
import Games from './pages/Games'
import Blog from './pages/Blog'
import BlogDetail from './pages/BlogDetail'
import Teachers from './pages/Teachers'
import TeacherProfile from './pages/TeacherProfile'
import Resources from './pages/Resources'
import Ratings from './pages/Ratings'
import Search from './pages/Search'
import About from './pages/About'
import Contact from './pages/Contact'
import CertificatePublic from './pages/CertificatePublic'
import VerifyCertificate from './pages/VerifyCertificate'
import NotFound from './pages/NotFound'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Reset from './pages/auth/Reset'

import Notifications from './pages/dashboard/Notifications'

import LessonPlayer from './pages/learn/LessonPlayer'
import TestPage from './pages/learn/TestPage'
import TestResult from './pages/learn/TestResult'
import CourseCongrats from './pages/learn/CourseCongrats'

import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherCourses from './pages/teacher/TeacherCourses'
import TeacherTests from './pages/teacher/TeacherTests'
import CourseBuilder from './pages/teacher/CourseBuilder'
import TeacherStudents from './pages/teacher/TeacherStudents'
import TeacherReviews from './pages/teacher/TeacherReviews'
import CourseStats from './pages/teacher/CourseStats'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminUserDetail from './pages/admin/AdminUserDetail'
import AdminCourses from './pages/admin/AdminCourses'
import AdminCategories from './pages/admin/AdminCategories'
import AdminCertificates from './pages/admin/AdminCertificates'
import AdminResources from './pages/admin/AdminResources'
import AdminReviews from './pages/admin/AdminReviews'
import AdminBlog from './pages/admin/AdminBlog'
import AdminBlogEditor from './pages/admin/AdminBlogEditor'
import AdminSettings from './pages/admin/AdminSettings'
import AdminMessages from './pages/admin/AdminMessages'
import AdminTeam from './pages/admin/AdminTeam'

import Protected from './components/Protected'
import ScrollToTop from './components/ScrollToTop'
import IntroLoader from './components/IntroLoader'
import WorldMap from './pages/WorldMap'

export default function App() {
  const hydrate = useAuth(s => s.hydrate)
  useEffect(() => { hydrate() }, [hydrate])

  return (
    <>
    <IntroLoader />
    <ScrollToTop />
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:slug" element={<CourseDetail />} />
      <Route path="/tests" element={<Tests />} />
      <Route path="/games" element={<Games />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogDetail />} />
      <Route path="/world" element={<WorldMap />} />
      <Route path="/tests/:testId/take" element={<Protected><TestPage /></Protected>} />
      <Route path="/tests/:testId/result/:attemptId" element={<Protected><TestResult /></Protected>} />
      <Route path="/teachers" element={<Teachers />} />
      <Route path="/teachers/:id" element={<TeacherProfile />} />
      <Route path="/resources" element={<Resources />} />
      <Route path="/ratings" element={<Ratings />} />
      <Route path="/search" element={<Search />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/certificate/:uuid" element={<CertificatePublic />} />
      <Route path="/verify" element={<VerifyCertificate />} />
      <Route path="/verify/:uuid" element={<CertificatePublic />} />

      {/* Auth */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/reset" element={<Reset />} />

      {/* Unified profile (all roles) */}
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      {/* Legacy dashboard routes redirect to profile */}
      <Route path="/dashboard" element={<Navigate to="/profile" replace />} />
      <Route path="/dashboard/courses" element={<Navigate to="/profile" replace />} />
      <Route path="/dashboard/certificates" element={<Navigate to="/profile" replace />} />
      <Route path="/dashboard/tests" element={<Navigate to="/profile" replace />} />
      <Route path="/dashboard/profile" element={<Navigate to="/profile" replace />} />
      <Route path="/notifications" element={<Protected><Notifications /></Protected>} />

      {/* Learning */}
      <Route path="/learn/:slug/:lessonId" element={<Protected><LessonPlayer /></Protected>} />
      <Route path="/learn/:slug/test/:testId" element={<Protected><TestPage /></Protected>} />
      <Route path="/learn/:slug/test/:testId/result/:attemptId" element={<Protected><TestResult /></Protected>} />
      <Route path="/learn/:slug/complete" element={<Protected><CourseCongrats /></Protected>} />

      {/* Teacher */}
      <Route path="/teacher" element={<Protected roles={['teacher', 'admin']}><TeacherDashboard /></Protected>} />
      <Route path="/teacher/courses" element={<Protected roles={['teacher', 'admin']}><TeacherCourses /></Protected>} />
      <Route path="/teacher/tests" element={<Protected roles={['teacher', 'admin']}><TeacherTests /></Protected>} />
      <Route path="/admin-panel/tests" element={<Protected roles={['admin']}><TeacherTests /></Protected>} />
      <Route path="/teacher/courses/new" element={<Protected roles={['teacher', 'admin']}><CourseBuilder /></Protected>} />
      <Route path="/teacher/courses/:slug/edit" element={<Protected roles={['teacher', 'admin']}><CourseBuilder /></Protected>} />
      <Route path="/teacher/courses/:slug/stats" element={<Protected roles={['teacher', 'admin']}><CourseStats /></Protected>} />
      <Route path="/teacher/students" element={<Protected roles={['teacher', 'admin']}><TeacherStudents /></Protected>} />
      <Route path="/teacher/reviews" element={<Protected roles={['teacher', 'admin']}><TeacherReviews /></Protected>} />

      {/* Admin */}
      <Route path="/admin-panel" element={<Protected roles={['admin']}><AdminDashboard /></Protected>} />
      <Route path="/admin-panel/users" element={<Protected roles={['admin']}><AdminUsers /></Protected>} />
      <Route path="/admin-panel/users/:id" element={<Protected roles={['admin']}><AdminUserDetail /></Protected>} />
      <Route path="/admin-panel/courses" element={<Protected roles={['admin']}><AdminCourses /></Protected>} />
      <Route path="/admin-panel/courses/new" element={<Protected roles={['admin']}><CourseBuilder /></Protected>} />
      <Route path="/admin-panel/courses/:slug/edit" element={<Protected roles={['admin']}><CourseBuilder /></Protected>} />
      <Route path="/admin-panel/courses/:slug/stats" element={<Protected roles={['admin']}><CourseStats /></Protected>} />
      <Route path="/admin-panel/categories" element={<Protected roles={['admin']}><AdminCategories /></Protected>} />
      <Route path="/admin-panel/certificates" element={<Protected roles={['admin']}><AdminCertificates /></Protected>} />
      <Route path="/admin-panel/resources" element={<Protected roles={['admin']}><AdminResources /></Protected>} />
      <Route path="/admin-panel/reviews" element={<Protected roles={['admin']}><AdminReviews /></Protected>} />
      <Route path="/admin-panel/blog" element={<Protected roles={['admin']}><AdminBlog /></Protected>} />
      <Route path="/admin-panel/blog/new" element={<Protected roles={['admin']}><AdminBlogEditor /></Protected>} />
      <Route path="/admin-panel/blog/:slug/edit" element={<Protected roles={['admin']}><AdminBlogEditor /></Protected>} />
      <Route path="/admin-panel/messages" element={<Protected roles={['admin']}><AdminMessages /></Protected>} />
      <Route path="/admin-panel/team" element={<Protected roles={['admin']}><AdminTeam /></Protected>} />
      <Route path="/admin-panel/settings" element={<Protected roles={['admin']}><AdminSettings /></Protected>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  )
}
