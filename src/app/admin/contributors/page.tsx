'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, User, Shield, ExternalLink, X, Check, Trash2, Award } from 'lucide-react'
import { Contributor } from '@/generated/prisma-client'

export default function ContributorsAdmin() {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({ name: '', title: '' })

  const { data: contributors = [], isLoading } = useQuery<Contributor[]>({
    queryKey: ['contributors'],
    queryFn: () => fetch('/api/contributors').then(res => res.json()).catch(() => [])
  })

  const createMutation = useMutation({
    mutationFn: (newContributor: Omit<Contributor, 'id' | 'createdAt' | 'updatedAt'>) => 
      fetch('/api/contributors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContributor)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributors'] })
      setIsAdding(false)
      setFormData({ name: '', title: '' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/contributors/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributors'] })
    }
  })

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-heading font-bold text-foreground tracking-tight">Expert Council</h1>
          <p className="text-slate-500 mt-2 font-body text-lg italic max-w-xl">
            Distinguished practitioners contributing to the diagnostic knowledge base.
          </p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="tcm-btn-primary text-sm py-2 px-4 flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Appoint Expert
          </button>
        )}
      </div>

      {/* Add Form Card */}
      {isAdding && (
        <div className="tcm-card p-6 md:p-8 border-l-4 border-tcm-accent animate-slide-up max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl md:text-3xl font-heading font-bold text-teal-800">New Expert</h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-500 transition-colors"><X size={24} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-2">
              <label className="tcm-label">Full Name</label>
              <input 
                type="text" 
                placeholder="e.g. Dr. Li Wei"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="tcm-input"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="tcm-label">Clinical Title</label>
              <input 
                type="text" 
                placeholder="e.g. TCM Specialist"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="tcm-input"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-8">
            <button 
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name}
              className="tcm-btn-primary px-12 disabled:opacity-30 flex items-center justify-center gap-2"
            >
              <Check size={18} /> Register Expert
            </button>
            <button 
              onClick={() => setIsAdding(false)}
              className="tcm-btn-outline px-12"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Contributor Cards */}
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="tcm-card p-8 animate-pulse space-y-6 rounded-2xl">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-teal-100/50 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-teal-100/50 rounded w-1/2" />
                  <div className="h-4 bg-background rounded w-3/4" />
                </div>
              </div>
            </div>
          ))
        ) : contributors.length > 0 ? (
          contributors.map((c: Contributor) => (
            <div key={c.id} className="tcm-card tcm-card-hover p-8 rounded-2xl flex flex-col gap-6 relative overflow-hidden group">
              {/* Card Decoration */}
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Award size={80} />
              </div>
              
              <div className="flex items-center gap-5 relative">
                <div className="w-16 h-16 bg-teal-900 rounded-2xl flex items-center justify-center text-tcm-accent shadow-xl group-hover:scale-105 transition-transform duration-500 overflow-hidden relative">
                  <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
                  <User size={32} strokeWidth={1.5} className="relative z-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-heading font-bold text-teal-800 group-hover:text-tcm-accent transition-colors truncate max-w-[180px]">{c.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{c.title || 'TCM Practitioner'}</p>
                </div>
              </div>

              <div className="pt-6 flex items-center justify-between border-t border-teal-50 relative">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-50 border border-cyan-100 flex items-center justify-center text-tcm-accent">
                    <Shield size={14} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verified Council Member</span>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => {
                      if (confirm(`Remove contributor "${c.name}"?`)) {
                        deleteMutation.mutate(c.id)
                      }
                    }}
                    aria-label={`Delete ${c.name}`}
                    className="p-2 text-teal-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button className="p-2 text-teal-300 hover:text-tcm-accent transition-colors">
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>
              
              {/* Metric Card */}
              <div className="mt-2 p-4 bg-background rounded-xl border border-slate-100 flex items-center justify-between relative overflow-hidden group-hover:bg-white group-hover:border-tcm-accent/20 transition-all">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contribution Integrity</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-heading font-bold text-foreground group-hover:text-tcm-accent transition-colors">98</span>
                  <span className="text-[10px] text-slate-400">pts</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-32 text-center tcm-card rounded-3xl border-dashed border-slate-200">
             <div className="w-24 h-24 bg-background rounded-2xl flex items-center justify-center text-teal-200 mx-auto mb-8 border border-slate-100 shadow-inner">
               <User size={64} strokeWidth={1} />
             </div>
             <h3 className="text-3xl font-heading font-bold text-teal-800 tracking-tight">Council Empty</h3>
             <p className="mt-4 max-w-sm mx-auto font-body text-lg text-slate-500 italic leading-relaxed">
               No practitioners have been appointed to the clinical expert council yet.
             </p>
          </div>
        )}
      </div>
    </div>
  )
}
