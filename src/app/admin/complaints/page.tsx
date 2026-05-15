'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, MessageSquare, Search, X, Check, FileText, Activity } from 'lucide-react'
import { Complaint, Syndrome } from '@/generated/prisma-client'

type ComplaintWithSyndromes = Complaint & {
  syndromes: {
    syndrome: Syndrome
  }[]
}

export default function ComplaintsAdmin() {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [editingComplaint, setEditingComplaint] = useState<ComplaintWithSyndromes | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [syndromeSearch, setSyndromeSearch] = useState('')
  const [formData, setFormData] = useState({ name: '', description: '', syndromeIds: [] as string[] })

  const { data: complaints = [], isLoading } = useQuery<ComplaintWithSyndromes[]>({
    queryKey: ['complaints'],
    queryFn: async () => {
      const res = await fetch('/api/complaints')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch complaints')
      return data
    }
  })

  const { data: syndromes = [] } = useQuery<Syndrome[]>({
    queryKey: ['syndromes'],
    queryFn: async () => {
      const res = await fetch('/api/syndromes')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch syndromes')
      return data
    }
  })

  const createMutation = useMutation({
    mutationFn: async (newComplaint: { name: string, description: string, syndromeIds: string[] }) => {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComplaint)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      setIsAdding(false)
      setFormData({ name: '', description: '', syndromeIds: [] })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (complaint: ComplaintWithSyndromes & { syndromeIds?: string[] }) => {
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: complaint.name,
          description: complaint.description,
          syndromeIds: complaint.syndromeIds
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      setEditingComplaint(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/complaints/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
    }
  })

  const toggleSyndrome = (id: string) => {
    if (isAdding) {
      setFormData(prev => ({
        ...prev,
        syndromeIds: prev.syndromeIds.includes(id) 
          ? prev.syndromeIds.filter(sid => sid !== id)
          : [...prev.syndromeIds, id]
      }))
    } else if (editingComplaint) {
      const currentIds = (editingComplaint as any).syndromeIds !== undefined 
        ? (editingComplaint as any).syndromeIds 
        : editingComplaint.syndromes.map(s => s.syndrome.id)
        
      const newIds = currentIds.includes(id)
        ? currentIds.filter((sid: string) => sid !== id)
        : [...currentIds, id]
      
      setEditingComplaint({
        ...editingComplaint,
        syndromeIds: newIds
      } as any)
    }
  }

  const safeComplaints = Array.isArray(complaints) ? complaints : [];
  const filteredComplaints = safeComplaints.filter((c: ComplaintWithSyndromes) => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const currentSelectedSyndromeIds = isAdding 
    ? formData.syndromeIds 
    : editingComplaint 
      ? ((editingComplaint as any).syndromeIds !== undefined 
          ? (editingComplaint as any).syndromeIds 
          : editingComplaint.syndromes.map(s => s.syndrome.id))
      : [];


  return (
    <div className="space-y-10 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground tracking-tight">Main Complaints</h1>
          <p className="text-slate-500 mt-2 font-body text-base md:text-lg italic max-w-xl">
            Primary clinical symptoms used for initial syndrome categorization.
          </p>
        </div>
      </div>

      {/* Editor Modal/Panel */}
      {(isAdding || editingComplaint) && (
        <div className="tcm-card p-6 md:p-8 lg:p-10 border-l-4 border-tcm-accent animate-slide-up">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground tracking-tight">
              {isAdding ? 'Register New Complaint' : `Modify Complaint: ${editingComplaint?.name}`}
            </h2>
            <button 
              onClick={() => {
                setIsAdding(false)
                setEditingComplaint(null)
                createMutation.reset()
                updateMutation.reset()
              }}
              className="p-2 text-slate-400 hover:text-slate-500 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Error Feedback */}
          {(createMutation.isError || updateMutation.isError) && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-bold animate-fade-in">
              {(createMutation.error as Error)?.message || (updateMutation.error as Error)?.message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="tcm-label">Clinical Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Chronic Headache"
                  value={isAdding ? formData.name : (editingComplaint?.name ?? '')}
                  onChange={(e) => {
                    if (isAdding) setFormData({...formData, name: e.target.value})
                    else if (editingComplaint) setEditingComplaint({...editingComplaint, name: e.target.value})
                  }}
                  className="tcm-input"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="tcm-label">Registry Description</label>
                <input 
                  type="text" 
                  placeholder="Brief clinical context"
                  value={isAdding ? formData.description : (editingComplaint?.description ?? '')}
                  onChange={(e) => {
                    if (isAdding) setFormData({...formData, description: e.target.value})
                    else if (editingComplaint) setEditingComplaint({...editingComplaint, description: e.target.value})
                  }}
                  className="tcm-input"
                />
              </div>

              {/* Selected Syndromes Pills */}
              <div className="space-y-3 pt-2">
                <label className="tcm-label flex items-center gap-2 text-slate-600">
                  Currently Associated ({currentSelectedSyndromeIds.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {currentSelectedSyndromeIds.map((id: string) => {
                    const s = syndromes.find(syn => syn.id === id);
                    if (!s) return null;
                    return (
                      <span key={s.id} className="flex items-center gap-1.5 bg-teal-50 text-teal-800 px-3 py-1.5 rounded-lg text-sm font-bold border border-teal-100 shadow-sm animate-zoom-in">
                        {s.name}
                        <button 
                          onClick={() => toggleSyndrome(s.id)} 
                          className="text-teal-400 hover:text-red-500 transition-colors bg-white rounded-full p-0.5 ml-1"
                          aria-label={`Remove ${s.name}`}
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      </span>
                    )
                  })}
                  {currentSelectedSyndromeIds.length === 0 && (
                    <span className="text-sm text-slate-400 italic py-2 px-1">No syndromes currently linked.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="tcm-label flex items-center gap-2">
                  <Activity size={14} className="text-tcm-accent" /> Available Syndromes
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                  <input 
                    type="text"
                    placeholder="Filter syndromes..."
                    value={syndromeSearch}
                    onChange={(e) => setSyndromeSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-body focus:border-tcm-accent outline-none transition-all"
                  />
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 max-h-[250px] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 gap-2">
                  {syndromes
                    .filter(s => s.name.toLowerCase().includes(syndromeSearch.toLowerCase()))
                    .map((s: Syndrome) => {
                      const isSelected = currentSelectedSyndromeIds.includes(s.id);
                      
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleSyndrome(s.id)}
                          className={`text-left px-4 py-2 rounded-lg text-sm font-heading font-bold transition-all border flex items-center justify-between ${
                            isSelected 
                              ? 'bg-tcm-accent border-tcm-accent text-white' 
                              : 'bg-white border-slate-100 text-teal-800 hover:border-tcm-accent/30'
                          }`}
                        >
                          <span>{s.name}</span>
                          {isSelected && <Check size={14} />}
                        </button>
                      )
                    })}
                  {syndromes.filter(s => s.name.toLowerCase().includes(syndromeSearch.toLowerCase())).length === 0 && (
                    <p className="text-center py-4 text-xs text-slate-400 italic">No patterns found matching &quot;{syndromeSearch}&quot;</p>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-body italic">
                Link this complaint to the syndromes it can manifest in.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-8">
            <button 
              onClick={() => {
                if (isAdding) createMutation.mutate(formData)
                else if (editingComplaint) updateMutation.mutate(editingComplaint)
              }}
              disabled={isAdding ? !formData.name : !editingComplaint?.name}
              className="tcm-btn-primary px-12 disabled:opacity-30 flex items-center justify-center gap-2"
            >
              <Check size={18} /> {isAdding ? 'Commit to Registry' : 'Update Record'}
            </button>
            <button 
              onClick={() => {
                setIsAdding(false)
                setEditingComplaint(null)
              }}
              className="tcm-btn-outline px-12"
            >
              Discard Changes
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="relative group flex-1 max-w-4xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tcm-accent transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search the clinical archive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-body text-base focus:border-tcm-accent outline-none transition-all shadow-sm"
            />
          </div>

          {!isAdding && !editingComplaint && (
            <button 
              onClick={() => {
                setIsAdding(true)
                setFormData({ name: '', description: '', syndromeIds: [] })
              }}
              className="tcm-btn-primary flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <Plus size={16} /> <span className="hidden sm:inline">Register Complaint</span><span className="sm:hidden">Register</span>
            </button>
          )}
        </div>

        <div className="tcm-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 md:px-8 py-4 font-heading font-bold text-xs uppercase tracking-wider text-slate-500">Main Complaint</th>
                  <th className="px-6 md:px-8 py-4 font-heading font-bold text-xs uppercase tracking-wider text-slate-500 hidden lg:table-cell">Associated Syndromes</th>
                  <th className="px-6 md:px-8 py-4 font-heading font-bold text-xs uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 md:px-8 py-6"><div className="h-6 bg-teal-100/50 rounded w-1/2" /></td>
                      <td className="px-6 md:px-8 py-6 hidden lg:table-cell"><div className="h-6 bg-background rounded w-3/4" /></td>
                      <td className="px-6 md:px-8 py-6"><div className="h-6 bg-teal-100/50 rounded w-12 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredComplaints.length > 0 ? (
                  filteredComplaints.map((c: ComplaintWithSyndromes) => (
                    <tr key={c.id} className="hover:bg-background/50 transition-colors group">
                      <td className="px-6 md:px-8 py-6">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 shrink-0 rounded-lg bg-cyan-50 text-tcm-accent flex items-center justify-center border border-cyan-100">
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-heading font-bold text-xl md:text-2xl text-teal-800 group-hover:text-tcm-accent transition-colors truncate">{c.name}</p>
                            <p className="text-xs font-body italic text-slate-400 lg:hidden mt-1 truncate">
                              {c.syndromes.length} syndrome(s) linked
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-6 text-slate-500 font-body text-sm hidden lg:table-cell italic opacity-80">
                        <div className="flex flex-wrap gap-1">
                          {c.syndromes.length > 0 ? (
                            c.syndromes.map(s => (
                              <span key={s.syndrome.id} className="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold text-slate-600">
                                {s.syndrome.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-300">No syndromes linked.</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-all transform lg:translate-x-2 lg:group-hover:translate-x-0">
                          <button 
                            onClick={() => {
                              setEditingComplaint({...c})
                              setIsAdding(false)
                            }}
                            aria-label={`Edit ${c.name}`}
                            className="p-2.5 md:p-3 bg-white border border-slate-100 text-slate-400 hover:text-tcm-accent hover:border-tcm-accent/30 rounded-xl shadow-sm transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              if(confirm(`Remove complaint "${c.name}" from registry?`)) deleteMutation.mutate(c.id)
                            }}
                            aria-label={`Delete ${c.name}`}
                            className="p-2.5 md:p-3 bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-xl shadow-sm transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 md:px-8 py-24 text-center">
                      <div className="w-16 h-16 md:w-24 md:h-24 bg-background rounded-2xl flex items-center justify-center text-teal-200 mx-auto mb-8 border border-slate-100 shadow-inner">
                        <MessageSquare size={56} strokeWidth={1} className="w-10 h-10 md:w-14 md:h-14" />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-heading font-bold text-teal-800 tracking-tight">Archive Empty</h3>
                      <p className="mt-2 font-body text-base md:text-lg text-slate-500 italic">No clinical symptoms have been registered in the archive.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
