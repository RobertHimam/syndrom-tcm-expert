'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Thermometer, ChevronRight, Hash, Search, X, Check, Info } from 'lucide-react'
import { SymptomCategory, SymptomOption } from '@/generated/prisma-client'

type SymptomCategoryWithOptions = SymptomCategory & {
  options: SymptomOption[]
}

export default function SymptomsAdmin() {
  const queryClient = useQueryClient()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<SymptomCategory | null>(null)
  const [editingOption, setEditingOption] = useState<SymptomOption | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [isAddingOption, setIsAddingOption] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [optionName, setOptionName] = useState('')

  // Fetch all symptom categories with options
  const { data: categories = [], isLoading } = useQuery<SymptomCategoryWithOptions[]>({
    queryKey: ['symptoms-all'],
    queryFn: () => fetch('/api/symptoms/all').then(res => res.json())
  })

  const selectedCategory = categories.find((c: SymptomCategoryWithOptions) => c.id === selectedCategoryId)

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => 
      fetch('/api/symptoms/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      }).then(res => res.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['symptoms-all'] })
      setIsAddingCategory(false)
      setCategoryName('')
      setSelectedCategoryId(data.id)
    }
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/symptoms/categories/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms-all'] })
      setSelectedCategoryId(null)
    }
  })

  const updateCategoryMutation = useMutation({
    mutationFn: (category: SymptomCategory) => 
      fetch(`/api/symptoms/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: category.name })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms-all'] })
      setEditingCategory(null)
    }
  })

  const createOptionMutation = useMutation({
    mutationFn: (data: { name: string, categoryId: string }) => 
      fetch('/api/symptoms/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms-all'] })
      setIsAddingOption(false)
      setOptionName('')
    }
  })

  const deleteOptionMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/symptoms/options/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms-all'] })
    }
  })

  const updateOptionMutation = useMutation({
    mutationFn: (option: SymptomOption) => 
      fetch(`/api/symptoms/options/${option.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: option.name })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms-all'] })
      setEditingOption(null)
    }
  })

  const filteredCategories = categories.filter((cat: SymptomCategoryWithOptions) => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground tracking-tight">Symptoms Registry</h1>
          <p className="text-slate-500 mt-2 font-body text-base md:text-lg italic max-w-xl">
            Catalog of diagnostic categories and clinical observation points.
          </p>
        </div>
      </div>

      {/* Inline Forms */}
      {(isAddingCategory || isAddingOption) && (
        <div className="tcm-card p-6 md:p-8 border-l-4 border-tcm-accent animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
              {isAddingCategory ? 'Add Clinical Category' : `Add Observation to ${selectedCategory?.name}`}
            </h2>
            <button 
              onClick={() => {
                setIsAddingCategory(false)
                setIsAddingOption(false)
              }} 
              className="p-2 text-slate-400 hover:text-slate-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              placeholder={isAddingCategory ? "e.g. Tongue Coating" : "e.g. Thick Yellow Coat"}
              value={isAddingCategory ? categoryName : optionName}
              onChange={(e) => isAddingCategory ? setCategoryName(e.target.value) : setOptionName(e.target.value)}
              className="tcm-input flex-1"
              autoFocus
            />
            <button 
              onClick={() => {
                if (isAddingCategory) createCategoryMutation.mutate(categoryName)
                else if (selectedCategory) createOptionMutation.mutate({ name: optionName, categoryId: selectedCategory.id })
              }}
              disabled={isAddingCategory ? !categoryName : !optionName}
              className="tcm-btn-primary whitespace-nowrap disabled:opacity-30"
            >
              Commit to Registry
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="relative group flex-1 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tcm-accent transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search registry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-body text-base focus:border-tcm-accent outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setIsAddingCategory(true)}
              className="tcm-btn-outline flex items-center justify-center gap-2 px-4"
            >
              <Plus size={16} /> <span className="hidden sm:inline">Category</span>
            </button>
            <button 
              onClick={() => {
                if (selectedCategory) setIsAddingOption(true)
                else alert('Please select a category first')
              }}
              className="tcm-btn-primary flex items-center justify-center gap-2 px-4"
            >
              <Plus size={16} /> <span className="hidden sm:inline">Observation</span><span className="sm:hidden">Point</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Categories List (Sidebar in Content) */}
          <div className={`lg:col-span-4 space-y-4 animate-fade-in ${selectedCategoryId ? 'hidden lg:block' : 'block'}`}>
            <div className="tcm-card overflow-hidden rounded-2xl">
            <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 font-heading font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Hash size={14} className="text-tcm-accent" /> Clinical Categories
            </div>
            <div className="divide-y divide-teal-50 max-h-[600px] overflow-y-auto custom-scrollbar">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-6 animate-pulse space-y-2">
                    <div className="h-5 bg-teal-100/50 rounded w-1/2" />
                    <div className="h-3 bg-background rounded w-1/4" />
                  </div>
                ))
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map((cat: SymptomCategoryWithOptions) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategoryId(cat.id)
                      setEditingCategory(null)
                      setIsAddingOption(false)
                    }}
                    className={`w-full text-left px-6 py-5 hover:bg-background transition-all flex justify-between items-center group border-l-4 ${
                      selectedCategoryId === cat.id ? 'bg-cyan-50/30 border-tcm-accent' : 'border-transparent'
                    }`}
                  >
                    <div>
                        <p className={`font-heading font-bold text-lg transition-colors ${selectedCategoryId === cat.id ? 'text-tcm-accent' : 'text-teal-800'}`}>
                          {cat.name}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                          {cat.options?.length || 0} Points
                        </p>
                    </div>
                    <ChevronRight size={16} className={`transition-all ${selectedCategoryId === cat.id ? 'text-tcm-accent translate-x-1' : 'text-teal-300 opacity-0 group-hover:opacity-100'}`} />
                  </button>
                ))
              ) : (
                <div className="p-12 text-center text-slate-400 font-body italic text-sm">
                  No records found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details View */}
        <div className={`lg:col-span-8 ${selectedCategoryId ? 'block' : 'hidden lg:block'}`}>
          {selectedCategory ? (
            <div key={`symptom-view-${selectedCategoryId}`} className="tcm-card overflow-hidden rounded-2xl flex flex-col min-h-[400px] md:min-h-[600px] animate-zoom-in">
                {/* Mobile Back Button */}
                <button 
                  onClick={() => setSelectedCategoryId(null)}
                  className="lg:hidden flex items-center gap-2 p-4 text-tcm-accent font-heading font-bold text-sm uppercase tracking-wider border-b border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight size={18} className="rotate-180" /> Back to Registry
                </button>

                {/* Category Header */}
                <div className="p-6 md:p-8 lg:p-10 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start gap-6">
                    <div className="flex-1 min-w-0">
                       <span className="tcm-badge mb-4 inline-block">
                         Symptom Details
                       </span>

                        {editingCategory?.id === selectedCategory.id ? (
                          <div className="flex items-center gap-3 mt-2 max-w-md">
                            <input 
                              type="text" 
                              value={editingCategory.name}
                              onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                              className="text-2xl md:text-3xl font-heading font-bold text-foreground bg-background border-b-2 border-tcm-accent px-2 py-1 outline-none flex-1 min-w-0"
                              autoFocus
                            />
                            <div className="flex gap-2 shrink-0">
                              <button 
                                onClick={() => updateCategoryMutation.mutate(editingCategory)}
                                className="p-2 bg-tcm-accent text-white rounded-lg shadow-md shadow-tcm-accent/10 hover:bg-teal-600 transition-colors"
                              >
                                <Check size={20} />
                              </button>
                              <button 
                                onClick={() => setEditingCategory(null)}
                                className="p-2 bg-teal-100/50 text-slate-500 rounded-lg hover:bg-teal-100 transition-colors"
                              >
                                <X size={20} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground tracking-tight mt-2 truncate">
                            {selectedCategory.name}
                          </h2>
                        )}
                        <p className="text-slate-500 mt-2 font-body italic text-base md:text-lg leading-relaxed">
                          &quot;Management of observation points for this clinical category.&quot;
                        </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        {!editingCategory && (
                          <button 
                            onClick={() => setEditingCategory({...selectedCategory})}
                            className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-tcm-accent hover:border-tcm-accent/30 rounded-xl transition-all shadow-sm"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            if (confirm(`Archive category "${selectedCategory.name}"? All related options will be removed from the registry.`)) {
                              deleteCategoryMutation.mutate(selectedCategory.id)
                            }
                          }}
                          className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-xl transition-all shadow-sm"
                        >
                          <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Observation Points Grid */}
                <div className="p-6 md:p-8 lg:p-10 bg-background/30 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedCategory.options?.map((opt: SymptomOption) => (
                            <div key={opt.id} className="tcm-card p-5 group flex items-center justify-between hover:border-tcm-accent/20 transition-all">
                                {editingOption?.id === opt.id ? (
                                  <div className="flex items-center gap-3 w-full">
                                    <input 
                                      type="text" 
                                      value={editingOption.name}
                                      onChange={(e) => setEditingOption({...editingOption, name: e.target.value})}
                                      className="flex-1 min-w-0 font-heading font-bold text-lg text-teal-800 bg-background border-b border-tcm-accent outline-none px-1"
                                      autoFocus
                                    />
                                    <div className="flex gap-2 shrink-0">
                                      <button 
                                        onClick={() => updateOptionMutation.mutate(editingOption)}
                                        className="p-1.5 bg-tcm-accent text-white rounded-md hover:bg-teal-600 transition-colors"
                                      >
                                        <Check size={16} />
                                      </button>
                                      <button 
                                        onClick={() => setEditingOption(null)}
                                        className="p-1.5 bg-teal-200 text-slate-500 rounded-md hover:bg-teal-300 transition-colors"
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-2 h-2 rounded-full bg-teal-200 group-hover:bg-tcm-accent transition-colors" />
                                      <span className="font-heading font-bold text-lg text-teal-700 truncate group-hover:text-foreground transition-colors">
                                        {opt.name}
                                      </span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                        <button 
                                          onClick={() => setEditingOption({...opt})}
                                          className="p-2 text-slate-400 hover:text-tcm-accent transition-colors"
                                        >
                                          <Edit2 size={16} />
                                        </button>
                                        <button 
                                          onClick={() => {
                                            if (confirm(`Remove observation "${opt.name}"?`)) {
                                              deleteOptionMutation.mutate(opt.id)
                                            }
                                          }}
                                          aria-label={`Delete ${opt.name}`}
                                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                    </div>
                                  </>
                                )}
                            </div>
                        ))}
                        
                        {/* Add New Observation Trigger */}
                        <button 
                          onClick={() => setIsAddingOption(true)}
                          className="flex items-center gap-3 p-5 border border-dashed border-slate-200 text-slate-400 hover:border-tcm-accent/30 hover:text-tcm-accent hover:bg-white rounded-xl transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-background border border-slate-100 flex items-center justify-center group-hover:bg-cyan-50 group-hover:border-cyan-100 transition-all">
                            <Plus size={18} />
                          </div>
                          <span className="font-heading font-bold text-sm uppercase tracking-widest">Register Point</span>
                        </button>
                    </div>
                </div>

                {/* Info Footer */}
                <div className="p-6 bg-teal-900 text-slate-500 border-t border-teal-800 flex items-center gap-4">
                  <div className="p-2 bg-teal-800 text-tcm-accent rounded-lg">
                    <Info size={16} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Updates to this registry are synchronized with the diagnostic engine in real-time.
                  </p>
                </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] md:min-h-[600px] flex flex-col items-center justify-center tcm-card rounded-3xl border-dashed border-slate-200 text-slate-400 p-6 md:p-12 text-center animate-fade-in">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-background rounded-2xl flex items-center justify-center text-teal-200 mb-6 md:mb-8 border border-slate-100 shadow-inner">
                <Thermometer size={56} strokeWidth={1} className="w-10 h-10 md:w-14 md:h-14" />
              </div>
              <h3 className="text-2xl md:text-3xl font-heading font-bold text-teal-800 tracking-tight">Select Registry Category</h3>
              <p className="text-slate-500 mt-4 max-w-sm font-body text-base md:text-lg italic leading-relaxed">
                Pick a symptom category from the registry to manage clinical observation points and diagnostic mappings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)
}

