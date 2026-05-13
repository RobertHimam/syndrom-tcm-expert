'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, MessageSquare, Search, X, Check, FileText } from 'lucide-react'
import { Complaint } from '@/generated/prisma-client'

export default function ComplaintsAdmin() {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({ name: '', description: '' })

  const { data: complaints = [], isLoading } = useQuery<Complaint[]>({
    queryKey: ['complaints'],
    queryFn: () => fetch('/api/complaints').then(res => res.json())
  })

  const createMutation = useMutation({
    mutationFn: (newComplaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>) => 
      fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComplaint)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      setIsAdding(false)
      setFormData({ name: '', description: '' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: (complaint: Complaint) => 
      fetch(`/api/complaints/${complaint.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complaint)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      setEditingComplaint(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/complaints/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
    }
  })

  const filteredComplaints = complaints.filter((c: Complaint) => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              }}
              className="p-2 text-slate-400 hover:text-slate-500 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
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
                setFormData({ name: '', description: '' })
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
                  <th className="px-6 md:px-8 py-4 font-heading font-bold text-xs uppercase tracking-wider text-slate-500 hidden lg:table-cell">Registry Description</th>
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
                  filteredComplaints.map((c: Complaint) => (
                    <tr key={c.id} className="hover:bg-background/50 transition-colors group">
                      <td className="px-6 md:px-8 py-6">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 shrink-0 rounded-lg bg-cyan-50 text-tcm-accent flex items-center justify-center border border-cyan-100">
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-heading font-bold text-xl md:text-2xl text-teal-800 group-hover:text-tcm-accent transition-colors truncate">{c.name}</p>
                            <p className="text-xs font-body italic text-slate-400 lg:hidden mt-1 truncate">{c.description || 'No registry entry.'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-6 text-slate-500 font-body text-lg hidden lg:table-cell italic opacity-80">{c.description || '-'}</td>
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
