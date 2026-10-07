import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout({ children, hideFooter }) {
  return (
    <>
      <Navbar />
      {children}
      {!hideFooter && <Footer />}
    </>
  )
}
