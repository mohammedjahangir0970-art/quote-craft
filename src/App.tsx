import type { ReactNode } from 'react'
import { Routes, Route } from 'react-router'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import QuoteBuilderPage from './pages/QuoteBuilderPage'
import PricingPage from './pages/PricingPage'
import AboutPage from './pages/AboutPage'
import AccountPage from './pages/AccountPage'
import AdminPage from './pages/AdminPage'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
      <Route path="/pricing" element={<AppLayout><PricingPage /></AppLayout>} />
      <Route path="/about" element={<AppLayout><AboutPage /></AppLayout>} />
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
      <Route path="/quote/new" element={<AppLayout><QuoteBuilderPage /></AppLayout>} />
      <Route path="/quote/:id" element={<AppLayout><QuoteBuilderPage /></AppLayout>} />
      <Route path="/account" element={<AppLayout><AccountPage /></AppLayout>} />
      <Route path="/admin" element={<AppLayout><AdminPage /></AppLayout>} />

      <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />
    </Routes>
  )
}
