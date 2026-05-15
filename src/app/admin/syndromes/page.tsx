'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ListTree, Zap, ChevronRight, Search, Info, Settings2, Trash2, X, Activity } from 'lucide-react'
import { Syndrome, SyndromeRule, SymptomOption, SymptomCategory, Complaint } from '@/generated/prisma-client'

type SyndromeWithDetails = Syndrome & {
  complaints: {
    complaint: Complaint
  }[]
}

type SyndromeRuleWithDetails = SyndromeRule & {
  symptomOption: SymptomOption & {
    category: SymptomCategory
  }
}

type SymptomCategoryWithOptions = SymptomCategory & {
  options: SymptomOption[]
}

export default function SyndromesAdmin() {
  const queryClient = useQueryClient()
  const [selectedSyndrome, setSelectedSyndrome] = useState<SyndromeWithDetails | null>(null)
  const [isEditingRules, setIsEditingRules] = useState(false)
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({ name: '', therapyPrinciple: '', acupoints: '', complaintIds: [] as string[] })

  // Fetch Syndromes
  const { data: syndromes = [], isLoading: isLoadingSyndromes } = useQuery<SyndromeWithDetails[]>({
    queryKey: ['syndromes'],
    queryFn: async () => {
      const res = await fetch('/api/syndromes')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch syndromes')
      return data
    }
  })

  // Fetch All Complaints for selection
  const { data: complaints = [] } = useQuery<Complaint[]>({
    queryKey: ['complaints-all'],
    queryFn: async () => {
      const res = await fetch('/api/complaints')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch complaints')
      return data
    }
  })

  // Mutation to create syndrome
  const createMutation = useMutation({
    mutationFn: (newSyndrome: { name: string, therapyPrinciple: string, acupoints: string, complaintIds: string[] }) => 
      fetch('/api/syndromes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSyndrome)
      }).then(res => res.json()),
    onSuccess: (data: SyndromeWithDetails) => {
      queryClient.invalidateQueries({ queryKey: ['syndromes'] })
      setIsAdding(false)
      setSelectedSyndrome(data)
      setFormData({ name: '', therapyPrinciple: '', acupoints: '', complaintIds: [] })
    }
  })

  // Mutation to update syndrome
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Syndrome> & { complaintIds?: string[] } }) => 
      fetch(`/api/syndromes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: (data: SyndromeWithDetails) => {
      queryClient.invalidateQueries({ queryKey: ['syndromes'] })
      setIsEditingDetails(false)
      setSelectedSyndrome(data)
    }
  })

  const toggleComplaint = (id: string) => {
    if (isAdding) {
      setFormData(prev => ({
        ...prev,
        complaintIds: prev.complaintIds.includes(id) 
          ? prev.complaintIds.filter(cid => cid !== id)
          : [...prev.complaintIds, id]
      }))
    } else if (selectedSyndrome) {
      const currentIds = selectedSyndrome.complaints.map(c => c.complaint.id)
      const newIds = currentIds.includes(id)
        ? currentIds.filter(cid => cid !== id)
        : [...currentIds, id]
      
      setSelectedSyndrome({
        ...selectedSyndrome,
        complaints: newIds.map(cid => ({ 
          complaint: complaints.find(c => c.id === cid) 
        })),
        complaintIds: newIds
      } as any)
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/syndromes/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syndromes'] })
      setSelectedSyndrome(null)
    }
  })

  // Fetch All Symptoms for Rule setting
  const { data: symptomCategories = [] } = useQuery<SymptomCategoryWithOptions[]>({
    queryKey: ['symptoms-all'],
    queryFn: () => fetch('/api/symptoms/all').then(res => res.json())
  })

  // Fetch Rules for selected Syndrome
  const { data: currentRules = [], refetch: refetchRules } = useQuery<SyndromeRuleWithDetails[]>({
    queryKey: ['rules', selectedSyndrome?.id],
    queryFn: () => fetch(`/api/rules?syndromeId=${selectedSyndrome?.id}`).then(res => res.json()),
    enabled: !!selectedSyndrome
  })

  const saveRuleMutation = useMutation({
    mutationFn: (rule: Partial<SyndromeRule>) => 
      fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      }).then(res => res.json()),
    onSuccess: () => {
      refetchRules()
    }
  })

  const getRuleWeight = (optionId: string) => {
    const rule = currentRules.find((r: SyndromeRuleWithDetails) => r.symptomOptionId === optionId)
    return rule ? rule.cfWeight : 0
  }

  const handleEditDetails = (s: SyndromeWithDetails) => {
    setFormData({
      name: s.name,
      therapyPrinciple: s.therapyPrinciple,
      acupoints: s.acupoints,
      complaintIds: s.complaints.map(c => c.complaint.id)
    })
    setIsEditingDetails(true)
    setIsAdding(false)
    setIsEditingRules(false)
  }

  const safeSyndromes = Array.isArray(syndromes) ? syndromes : [];
  const filteredSyndromes = safeSyndromes.filter((s: SyndromeWithDetails) => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground tracking-tight">Syndrome Catalog</h1>
          <p className="text-slate-500 mt-2 font-body text-base md:text-lg italic max-w-xl">
            Comprehensive repository of TCM syndrome patterns and diagnostic weights.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="relative group flex-1 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tcm-accent transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search syndrome catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-body text-base focus:border-tcm-accent outline-none transition-all shadow-sm"
            />
          </div>

          {!isAdding && !isEditingDetails && (
            <button 
              onClick={() => {
                setIsAdding(true)
                setSelectedSyndrome(null)
                setIsEditingDetails(false)
                setFormData({ name: '', therapyPrinciple: '', acupoints: '', complaintIds: [] })
              }}
              className="tcm-btn-primary flex items-center justify-center gap-2 whitespace-nowrap shrink-0 px-4"
            >
              <Plus size={16} /> <span className="hidden sm:inline">Register Syndrome</span><span className="sm:hidden">Register</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* List (Sidebar in Content) */}
          <div className={`lg:col-span-4 space-y-4 animate-fade-in ${selectedSyndrome || isAdding || isEditingDetails ? 'hidden lg:block' : 'block'}`}>
            <div className="tcm-card overflow-hidden rounded-2xl">
            <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 font-heading font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <ListTree size={14} className="text-tcm-accent" /> Syndrome Catalog
            </div>
            <div className="divide-y divide-teal-50 max-h-[600px] overflow-y-auto custom-scrollbar">
              {isLoadingSyndromes ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-6 animate-pulse space-y-2">
                    <div className="h-5 bg-teal-100/50 rounded w-1/2" />
                    <div className="h-3 bg-background rounded w-3/4" />
                  </div>
                ))
              ) : filteredSyndromes.length > 0 ? (
                filteredSyndromes.map((s: SyndromeWithDetails) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSyndrome(s)
                      setIsEditingRules(false)
                      setIsAdding(false)
                      setIsEditingDetails(false)
                    }}
                    className={`w-full text-left px-6 py-5 hover:bg-background transition-all group flex items-center justify-between border-l-4 ${
                      selectedSyndrome?.id === s.id ? 'bg-cyan-50/30 border-tcm-accent' : 'border-transparent'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <p className={`font-heading font-bold text-lg transition-colors truncate ${selectedSyndrome?.id === s.id ? 'text-tcm-accent' : 'text-teal-800'}`}>
                        {s.name}
                      </p>
                      <p className="text-xs font-body italic text-slate-500 truncate mt-0.5">{s.therapyPrinciple}</p>
                    </div>
                    <ChevronRight size={16} className={`shrink-0 transition-all ${selectedSyndrome?.id === s.id ? 'text-tcm-accent translate-x-1' : 'text-teal-300 opacity-0 group-hover:opacity-100'}`} />
                  </button>
                ))
              ) : (
                <div className="p-12 text-center text-slate-400 font-body italic text-sm">
                  No patterns found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details / Editor View */}
        <div className={`lg:col-span-8 ${selectedSyndrome || isAdding || isEditingDetails ? 'block' : 'hidden lg:block'}`}>
          {isAdding || isEditingDetails ? (
            <div key={isAdding ? 'add-view' : `edit-view-${selectedSyndrome?.id}`} className="tcm-card overflow-hidden rounded-2xl animate-zoom-in">
              <div className="p-6 md:p-8 lg:p-10 border-b border-slate-100 bg-background/50 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground tracking-tight">
                    {isAdding ? 'Register New Syndrome' : `Edit: ${selectedSyndrome?.name}`}
                  </h2>
                  <p className="text-slate-500 mt-2 font-body text-sm md:text-base italic leading-relaxed">
                    {isAdding 
                      ? '&quot;Define the clinical profile and therapeutic principles for a new pattern.&quot;'
                      : '&quot;Update the clinical profile and therapeutic principles for this pattern.&quot;'}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setIsAdding(false)
                    setIsEditingDetails(false)
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
                <div className="mx-6 md:mx-8 lg:mx-10 mt-6 mb-2 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-bold animate-fade-in">
                  {(createMutation.error as Error)?.message || (updateMutation.error as Error)?.message}
                </div>
              )}

              <div className="p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8">
                <div className="space-y-2">
                  <label className="tcm-label">Pattern Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Spleen Qi Deficiency"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="tcm-input"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="tcm-label">Therapeutic Principle</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Tonify Spleen and Qi"
                    value={formData.therapyPrinciple}
                    onChange={(e) => setFormData({...formData, therapyPrinciple: e.target.value})}
                    className="tcm-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="tcm-label">Recommended Acupoints</label>
                  <textarea 
                    placeholder="e.g. ST36, SP3, SP6"
                    rows={3}
                    value={formData.acupoints}
                    onChange={(e) => setFormData({...formData, acupoints: e.target.value})}
                    className="tcm-input resize-none"
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="tcm-label flex items-center gap-2">
                    <Activity size={14} className="text-tcm-accent" /> Associated Complaints
                  </label>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 max-h-[200px] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {complaints.map((c: Complaint) => {
                        const isSelected = isAdding 
                          ? formData.complaintIds.includes(c.id)
                          : selectedSyndrome?.complaints.some(rc => rc.complaint.id === c.id) || (selectedSyndrome as any)?.complaintIds?.includes(c.id);
                        
                        return (
                          <button
                            key={c.id}
                            onClick={() => toggleComplaint(c.id)}
                            className={`text-left px-4 py-2 rounded-lg text-sm font-heading font-bold transition-all border ${
                              isSelected 
                                ? 'bg-tcm-accent border-tcm-accent text-white' 
                                : 'bg-white border-slate-100 text-teal-800 hover:border-tcm-accent/30'
                            }`}
                          >
                            {c.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4">
                  <button 
                    onClick={() => {
                      if (isAdding) {
                        createMutation.mutate(formData)
                      } else if (selectedSyndrome) {
                        updateMutation.mutate({ id: selectedSyndrome.id, data: formData })
                      }
                    }}
                    disabled={!formData.name}
                    className="tcm-btn-primary flex-1 disabled:opacity-30"
                  >
                    {isAdding ? 'Commit to Catalog' : 'Save Changes'}
                  </button>
                  <button 
                    onClick={() => {
                      setIsAdding(false)
                      setIsEditingDetails(false)
                    }}
                    className="tcm-btn-outline flex-1"
                  >
                    Discard Changes
                  </button>
                </div>
              </div>
            </div>
          ) : selectedSyndrome ? (
            <div key={`view-${selectedSyndrome.id}`} className="tcm-card overflow-hidden rounded-2xl flex flex-col min-h-[400px] md:min-h-[600px] animate-zoom-in">
                {/* Mobile Back Button */}
                <button 
                  onClick={() => setSelectedSyndrome(null)}
                  className="lg:hidden flex items-center gap-2 p-4 text-tcm-accent font-heading font-bold text-sm uppercase tracking-wider border-b border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight size={18} className="rotate-180" /> Back to Catalog
                </button>

              <div className="p-6 md:p-8 lg:p-10 bg-background/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start gap-6">
                <div className="flex-1 min-w-0 w-full overflow-hidden">
                 <div className="flex items-center gap-3 mb-4">
                   <span className="tcm-badge">
                     Clinical Profile
                   </span>
                   <button 
                    onClick={() => handleEditDetails(selectedSyndrome)}
                    className="text-xs font-heading font-bold text-tcm-accent hover:underline flex items-center gap-1"
                   >
                     <Settings2 size={12} /> Edit Details
                   </button>
                 </div>

                  <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground tracking-tight truncate block w-full" title={selectedSyndrome.name}>
                    {selectedSyndrome.name}
                  </h2>
                  <p className="text-slate-500 mt-2 font-body italic text-lg md:text-xl leading-relaxed max-w-2xl">&quot;{selectedSyndrome.therapyPrinciple}&quot;</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => setIsEditingRules(!isEditingRules)}
                    className={`whitespace-nowrap px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-heading font-bold tracking-widest uppercase text-[10px] transition-all border ${
                      isEditingRules 
                        ? 'bg-tcm-accent border-tcm-accent text-white shadow-lg shadow-tcm-accent/20' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-tcm-accent/30 hover:bg-background shadow-sm'
                    }`}
                  >
                    {isEditingRules ? 'View Profile' : 'Edit Matrix'}
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`Archive syndrome "${selectedSyndrome.name}"? This will remove all diagnostic rules from the matrix.`)) {
                        deleteMutation.mutate(selectedSyndrome.id)
                      }
                    }}
                    aria-label={`Delete ${selectedSyndrome.name}`}
                    className="p-2.5 md:p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-xl shadow-sm transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 md:p-8 lg:p-10 flex-1">
                {!isEditingRules ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                    <div className="space-y-6 md:space-y-8">
                      <div>
                        <h3 className="tcm-label mb-4 flex items-center gap-2">
                          <Zap size={14} className="text-tcm-accent" /> Targeted Acupoints
                        </h3>
                        <div className="p-5 md:p-6 bg-background rounded-2xl border border-slate-100 text-teal-700 font-body text-base md:text-lg italic leading-relaxed">
                          {selectedSyndrome.acupoints}
                        </div>
                      </div>
                      
                      <div className="p-6 md:p-8 bg-teal-900 rounded-3xl text-teal-50 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
                        <h3 className="text-[10px] font-heading font-black text-tcm-accent uppercase tracking-[0.3em] mb-4 relative z-10">Syndrome Summary</h3>
                        <p className="text-base md:text-lg font-body italic leading-relaxed opacity-90 relative z-10">
                          This pattern represents a core clinical observation requiring: {selectedSyndrome.therapyPrinciple}.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2 relative z-10">
                          {selectedSyndrome.complaints?.map(c => (
                            <span key={c.complaint.id} className="px-2 py-1 bg-teal-800/50 border border-teal-700 rounded-lg text-[10px] font-bold text-tcm-accent uppercase tracking-wider">
                              {c.complaint.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="tcm-label mb-4 flex items-center gap-2">
                        <Settings2 size={14} className="text-tcm-accent" /> Active Matrix Weights
                      </h3>
                      <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                        {currentRules.filter((r: SyndromeRuleWithDetails) => r.cfWeight !== 0).length > 0 ? (
                          currentRules.filter((r: SyndromeRuleWithDetails) => r.cfWeight !== 0).map((r: SyndromeRuleWithDetails) => (
                            <div key={r.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl hover:border-tcm-accent/20 transition-all shadow-sm group">
                              <div className="min-w-0 pr-4">
                                <p className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest">{r.symptomOption.category.name}</p>
                                <p className="text-base md:text-lg font-heading font-bold text-teal-700 truncate group-hover:text-foreground transition-colors">{r.symptomOption.name}</p>
                              </div>
                              <span className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg font-heading font-black text-lg md:text-xl flex items-center justify-center border border-slate-100 shadow-inner group-hover:bg-cyan-50 transition-colors ${
                                r.cfWeight > 0 ? 'text-tcm-accent bg-background' : 'text-orange-500 bg-orange-50/50'
                              }`}>
                                {r.cfWeight.toFixed(1)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 md:py-16 bg-background rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-body italic">
                            No active diagnostic rules.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 md:space-y-10 animate-fade-in">
                    <div className="p-5 md:p-6 bg-teal-900 rounded-2xl text-teal-50 shadow-lg flex items-start gap-4 md:gap-6 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
                      <div className="p-2.5 md:p-3 bg-tcm-accent text-white rounded-xl relative z-10 shadow-lg shadow-tcm-accent/20 shrink-0">
                        <Info size={24} />
                      </div>
                      <div className="relative z-10">
                        <p className="font-heading font-bold text-lg md:text-xl tracking-wide uppercase text-tcm-accent">Weight Calibration Matrix</p>
                        <p className="text-slate-400 font-body text-sm md:text-base italic mt-1 leading-relaxed">
                          Calibrate the Certainty Factor (-1.0 to 1.0) for each clinical observation. Positive values support the pattern, negative values detract from it.
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-8 md:space-y-12 pb-10">
                      {symptomCategories.map((cat: SymptomCategoryWithOptions) => (
                        <div key={cat.id} className="space-y-4 md:space-y-6">
                          <div className="flex items-center gap-4 md:gap-6">
                            <h3 className="font-heading font-black text-foreground uppercase tracking-[0.3em] text-[10px] whitespace-nowrap">{cat.name}</h3>
                            <div className="h-px bg-teal-200 flex-1" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {cat.options.map((opt: SymptomOption) => (
                              <div key={opt.id} className="group flex items-center justify-between p-4 md:p-5 bg-background border border-transparent rounded-xl hover:border-tcm-accent/20 hover:bg-white transition-all shadow-sm">
                                <span className="text-base md:text-lg font-heading font-bold text-slate-500 group-hover:text-foreground transition-colors truncate pr-4">{opt.name}</span>
                                <div className="flex items-center gap-3">
                                  <input 
                                    type="number"
                                    step="0.1"
                                    min="-1"
                                    max="1"
                                    defaultValue={getRuleWeight(opt.id)}
                                    onBlur={(e) => {
                                      const val = parseFloat(e.target.value)
                                      if (!isNaN(val)) {
                                        saveRuleMutation.mutate({
                                          syndromeId: selectedSyndrome.id,
                                          symptomOptionId: opt.id,
                                          cfWeight: val
                                        })
                                      }
                                    }}
                                    className="w-14 md:w-16 h-9 md:h-10 p-1 text-center bg-white border border-slate-200 rounded-lg font-heading font-black text-lg md:text-xl text-tcm-accent focus:border-tcm-accent outline-none transition-all shadow-inner"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Info Footer */}
              <div className="p-5 md:p-6 bg-teal-900 text-slate-500 border-t border-teal-800 flex items-center gap-4">
                <div className="p-2 bg-teal-800 text-tcm-accent rounded-lg">
                  <Activity size={16} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                  Diagnostic weights are processed via the Certainty Factor combining algorithm.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] md:min-h-[600px] flex flex-col items-center justify-center tcm-card rounded-3xl border-dashed border-slate-200 text-slate-400 p-8 md:p-12 text-center animate-fade-in">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-background rounded-2xl flex items-center justify-center text-teal-200 mb-6 md:mb-8 border border-slate-100 shadow-inner">
                <Zap size={64} strokeWidth={1} className="w-10 h-10 md:w-14 md:h-14" />
              </div>
              <h3 className="text-2xl md:text-3xl font-heading font-bold text-teal-800 tracking-tight">Select Catalog Entry</h3>
              <p className="text-slate-500 mt-4 max-w-sm font-body text-base md:text-lg italic leading-relaxed">
                Pick a syndrome pattern from the catalog to view its clinical profile and calibrate diagnostic weights.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)
}

