'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  MessageSquare, 
  Thermometer, 
  Zap, 
  Users, 
  Menu, 
  Bell, 
  Search, 
  ChevronRight, 
  User,
  LogOut
} from 'lucide-react'

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Complaints', href: '/admin/complaints', icon: MessageSquare },
  { name: 'Symptoms', href: '/admin/symptoms', icon: Thermometer },
  { name: 'Syndromes', href: '/admin/syndromes', icon: Zap },
  { name: 'Contributors', href: '/admin/contributors', icon: Users },
]

const SidebarContent = ({ pathname, setIsMobileMenuOpen }: { pathname: string, setIsMobileMenuOpen: (open: boolean) => void }) => {
  const router = useRouter()
  
  const handleLogout = () => {
    document.cookie = 'admin-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    router.push('/admin/login')
  }

  return (
    <div className="flex flex-col h-full bg-background border-r border-slate-200 shadow-sm relative z-20">
      {/* Brand Section */}
      <div className="p-8 flex items-center gap-4 border-b border-teal-100">
        <div className="w-12 h-12 bg-tcm-accent rounded-xl flex items-center justify-center text-white font-heading text-2xl font-black shadow-lg shadow-tcm-accent/20">
          經
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground tracking-tight">TCM Admin</h2>
          <p className="text-[10px] text-teal-400 font-bold uppercase tracking-[0.2em]">Clinical Expert System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[10px] font-bold text-teal-400 uppercase tracking-[0.2em] mb-4">Main Navigation</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`tcm-sidebar-item ${
                isActive 
                  ? 'tcm-sidebar-item-active' 
                  : 'hover:bg-white hover:shadow-sm hover:text-foreground group'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-tcm-accent' : 'text-teal-400 group-hover:text-tcm-accent transition-colors'} />
              <span className="font-heading text-base tracking-wide">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1 h-4 rounded-full bg-tcm-accent shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-teal-100 bg-white/50 space-y-2">
        <div className="bg-background rounded-xl p-3 flex items-center gap-3 border border-teal-100">
          <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-teal-400 border border-teal-100">
            <User size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-heading font-bold text-foreground truncate">Clinical Master</p>
            <p className="text-[10px] text-tcm-accent font-bold uppercase tracking-widest mt-0.5">Administrator</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all font-heading font-bold text-xs uppercase tracking-widest"
        >
          <LogOut size={16} />
          <span>Logout Session</span>
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Skip layout for login page
  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-slate-50 font-body">{children}</div>
  }

  return (
    <div className="flex min-h-screen bg-background/50 selection:bg-tcm-accent/10 selection:text-tcm-accent font-body">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 z-50">
        <SidebarContent pathname={pathname} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
        <aside className={`absolute top-0 left-0 bottom-0 w-80 bg-white transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full shadow-2xl'}`}>
          <SidebarContent pathname={pathname} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-teal-100 px-6 lg:px-10 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4 lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-teal-100/50 text-slate-600 rounded-lg transition-colors"
            >
              <Menu size={22} />
            </button>
            <div className="w-8 h-8 bg-tcm-accent rounded-lg flex items-center justify-center text-white font-heading font-bold text-lg shadow-md shadow-tcm-accent/10">經</div>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-teal-400">
            <span className="text-xs font-bold uppercase tracking-widest">Admin</span>
            <ChevronRight size={14} />
            <span className="text-xs font-bold uppercase tracking-widest text-foreground">
              {pathname === '/admin' ? 'Dashboard' : pathname.split('/').pop()?.replace(/-/g, ' ')}
            </span>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <div className="hidden sm:flex items-center relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-400 group-focus-within:text-tcm-accent transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="bg-background/50 border border-teal-100 rounded-lg pl-10 pr-4 py-2 text-xs font-body focus:bg-white focus:border-tcm-accent focus:outline-none transition-all w-48 lg:w-64"
              />
            </div>
            <button className="relative p-2 text-teal-400 hover:text-tcm-accent transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-6 w-px bg-teal-100/50 hidden sm:block" />
            <div className="w-8 h-8 rounded-full bg-cyan-50 border border-cyan-100 flex items-center justify-center text-tcm-accent overflow-hidden shadow-sm">
              <User size={18} />
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-6 lg:p-10 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        <footer className="px-6 lg:px-10 py-6 border-t border-teal-100 bg-white/50 text-center lg:text-left">
          <p className="text-[10px] font-bold text-teal-400 uppercase tracking-[0.3em]">
            © 2026 TCM Syndrome Expert System • Version 1.2.0 • Build Stability 99.8%
          </p>
        </footer>
      </div>
    </div>

  )
}

