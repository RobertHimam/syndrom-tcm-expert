'use client'

import { useQuery } from '@tanstack/react-query'
import { 
  MessageSquare, 
  Zap, 
  TrendingUp,
  Activity,
  ChevronRight,
  Plus,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { Consultation, Complaint } from '@/generated/prisma-client'

type ConsultationWithComplaint = Consultation & {
  complaint: Complaint
}

interface AdminStats {
  complaintsCount: number
  syndromesCount: number
  rulesCount: number
  contributorsCount: number
  recentConsultations: ConsultationWithComplaint[]
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => fetch('/api/admin/stats').then(res => res.json())
  })

  const stats = [
    { 
      name: 'Complaints', 
      value: data?.complaintsCount ?? 0, 
      icon: MessageSquare, 
      color: 'bg-cyan-50', 
      accent: 'text-tcm-accent',
      description: 'Primary symptoms registered',
      href: '/admin/complaints'
    },
    { 
      name: 'Syndromes', 
      value: data?.syndromesCount ?? 0, 
      icon: Zap, 
      color: 'bg-cyan-50', 
      accent: 'text-tcm-accent',
      description: 'Active diagnostic patterns',
      href: '/admin/syndromes'
    },
    { 
      name: 'Clinical Rules', 
      value: data?.rulesCount ?? 0, 
      icon: Activity, 
      color: 'bg-cyan-50', 
      accent: 'text-tcm-accent',
      description: 'Symptom-syndrome mappings',
      href: '/admin/symptoms'
    },
  ]

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-heading font-bold text-foreground tracking-tight">Clinical Overview</h1>
          <p className="text-teal-600 mt-2 font-body text-lg italic max-w-xl">
            Monitoring the diagnostic integrity and expansion of the TCM knowledge base.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/syndromes" className="tcm-btn-primary flex items-center gap-2">
            <Plus size={16} /> Syndrome
          </Link>
        </div>
      </div>
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((item) => (
          <Link 
            key={item.name} 
            href={item.href}
            className="tcm-card tcm-card-hover p-6 group flex items-start gap-5"
          >
            <div className={`p-3 rounded-xl ${item.color} ${item.accent} transition-colors group-hover:bg-tcm-accent group-hover:text-white`}>
              <item.icon size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-1">{item.name}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-heading font-bold text-foreground">
                  {isLoading ? '...' : item.value}
                </span>
                <span className="text-[10px] font-bold text-tcm-accent flex items-center gap-0.5">
                  <TrendingUp size={10} /> Active
                </span>
              </div>
              <p className="text-xs text-teal-600 font-body mt-1 italic">{item.description}</p>
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-tcm-accent transition-all transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>

      <div className="space-y-8">
        {/* Main Dashboard Section */}
        <div className="w-full">
          {/* Recent Activity / Consultation Logs */}
          <div className="tcm-card p-0 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-teal-100 flex items-center justify-between">
              <h3 className="font-heading font-bold text-xl md:text-2xl text-foreground flex items-center gap-3">
                <Clock size={20} className="text-tcm-accent" /> Recent Diagnoses
              </h3>
            </div>
            <div className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-6 md:p-8 animate-pulse flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-teal-100/50" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-teal-100/50 rounded w-1/3" />
                      <div className="h-4 bg-background rounded w-1/4" />
                    </div>
                  </div>
                ))
              ) : data?.recentConsultations && data.recentConsultations.length > 0 ? (
                data.recentConsultations.map((c: ConsultationWithComplaint) => (
                  <div key={c.id} className="p-6 md:p-8 flex items-center justify-between hover:bg-background transition-colors group">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-teal-900 text-tcm-accent flex items-center justify-center font-heading font-black text-xl shadow-lg shadow-teal-900/10 group-hover:scale-105 transition-transform">
                        {c.patientGender === 'Male' ? 'M' : 'F'}
                      </div>
                      <div>
                        <p className="text-lg font-heading font-bold text-foreground group-hover:text-tcm-accent transition-colors">
                          {c.patientName || `Consultation #${c.id.slice(-4)}`}
                        </p>
                        <p className="text-sm text-teal-600 font-body mt-1">
                          {c.patientAge} years • {c.patientGender} • {c.complaint.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-tcm-accent uppercase tracking-widest">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-teal-400 mt-1 font-medium">
                        {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-24 text-center">
                  <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner text-teal-200">
                    <Clock size={40} strokeWidth={1} />
                  </div>
                  <h4 className="text-xl font-heading font-bold text-teal-800">No Activity Recorded</h4>
                  <p className="mt-2 text-slate-500 font-body italic">Recent diagnostic consultations will appear here in real-time.</p>
                </div>
              )}
              <div className="p-8 text-center bg-background/30 border-t border-teal-50">
                <p className="text-sm text-teal-400 font-body italic flex items-center justify-center gap-2">
                  <Activity size={14} className="animate-pulse" /> Live data synchronization is active
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  )
}

