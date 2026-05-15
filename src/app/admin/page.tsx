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
import { api } from '@/lib/api'

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
    queryFn: () => api.admin.stats()
  })

  const stats = [
    { 
      name: 'Complaints', 
      value: data?.complaintsCount ?? 0, 
      icon: MessageSquare, 
      color: 'bg-tcm-accent/5', 
      accent: 'text-tcm-accent',
      description: 'Primary symptoms registered',
      href: '/admin/complaints'
    },
    { 
      name: 'Syndromes', 
      value: data?.syndromesCount ?? 0, 
      icon: Zap, 
      color: 'bg-tcm-accent/5', 
      accent: 'text-tcm-accent',
      description: 'Active diagnostic patterns',
      href: '/admin/syndromes'
    },
    { 
      name: 'Clinical Rules', 
      value: data?.rulesCount ?? 0, 
      icon: Activity, 
      color: 'bg-tcm-accent/5', 
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
          <p className="text-muted mt-2 font-body text-lg italic max-w-xl">
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
            <div className={`p-3 rounded-xl ${item.color} ${item.accent} transition-all group-hover:bg-tcm-accent group-hover:text-white border border-tcm-accent/10`}>
              <item.icon size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">{item.name}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-heading font-bold text-foreground group-hover:text-tcm-accent transition-colors">
                  {isLoading ? '...' : item.value}
                </span>
                <span className="text-[10px] font-bold text-tcm-accent flex items-center gap-0.5">
                  <TrendingUp size={10} /> Active
                </span>
              </div>
              <p className="text-xs text-muted font-body mt-1 italic">{item.description}</p>
            </div>
            <ChevronRight size={16} className="text-card-border group-hover:text-tcm-accent transition-all transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>

      <div className="space-y-8">
        {/* Main Dashboard Section */}
        <div className="w-full">
          {/* Recent Activity / Consultation Logs */}
          <div className="tcm-card p-0 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-card-border flex items-center justify-between">
              <h3 className="font-heading font-bold text-xl md:text-2xl text-foreground flex items-center gap-3">
                <Clock size={20} className="text-tcm-accent" /> Recent Diagnoses
              </h3>
            </div>
            <div className="divide-y divide-card-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-6 md:p-8 animate-pulse flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-input" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-input rounded w-1/3" />
                      <div className="h-4 bg-background rounded w-1/4" />
                    </div>
                  </div>
                ))
              ) : data?.recentConsultations && data.recentConsultations.length > 0 ? (
                data.recentConsultations.map((c: ConsultationWithComplaint) => (
                  <div key={c.id} className="p-6 md:p-8 flex items-center justify-between hover:bg-input transition-colors group">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-tcm-ink text-tcm-accent flex items-center justify-center font-heading font-black text-xl shadow-lg shadow-tcm-ink/10 group-hover:scale-105 transition-transform border border-tcm-accent/20">
                        {c.patientGender === 'Male' ? 'M' : 'F'}
                      </div>
                      <div>
                        <p className="text-lg font-heading font-bold text-foreground group-hover:text-tcm-accent transition-colors">
                          {c.patientName || `Consultation #${c.id.slice(-4)}`}
                        </p>
                        <p className="text-sm text-muted font-body mt-1">
                          {c.patientAge} years • {c.patientGender} • {c.complaint.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-tcm-accent uppercase tracking-widest">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-muted mt-1 font-medium">
                        {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-24 text-center">
                  <div className="w-20 h-20 bg-input rounded-full flex items-center justify-center mx-auto mb-6 border border-card-border shadow-inner text-tcm-accent/20">
                    <Clock size={40} strokeWidth={1} />
                  </div>
                  <h4 className="text-xl font-heading font-bold text-foreground">No Activity Recorded</h4>
                  <p className="mt-2 text-muted font-body italic">Recent diagnostic consultations will appear here in real-time.</p>
                </div>
              )}
              <div className="p-8 text-center bg-input/30 border-t border-card-border">
                <p className="text-sm text-muted font-body italic flex items-center justify-center gap-2">
                  <Activity size={14} className="animate-pulse text-tcm-accent" /> Live data synchronization is active
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
