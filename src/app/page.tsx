"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Search,
  RotateCcw,
  User,
  Activity,
  ClipboardList,
  Stethoscope,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Complaint,
  SymptomCategory,
  SymptomOption,
  Syndrome,
} from '@/generated/prisma-client';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type SymptomCategoryWithSyndromeCount = SymptomCategory & {
  options: (SymptomOption & { syndromeRules: { syndromeId: string }[] })[];
  syndromeCount: number;
};

interface WizardStep {
  name: string;
  categories: SymptomCategoryWithSyndromeCount[];
}

interface DiagnosisResult extends Syndrome {
  confidence: number;
  confidenceLevel: string;
}

export default function ConsultationFlow() {
  const [step, setStep] = useState(1);
  const [patientData, setPatientData] = useState({ age: "", gender: "Male" });
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );
  const [selectedSymptoms, setSelectedSymptoms] = useState<
    Record<string, string>
  >({});
  const [currentSymptomIdx, setCurrentSymptomIdx] = useState(0);
  const [results, setResults] = useState<DiagnosisResult[]>([]);

  // Fetch Data
  const { data: complaints = [] } = useQuery<Complaint[]>({
    queryKey: ["complaints"],
    queryFn: () => fetch("/api/complaints").then((res) => res.json()),
  });

  const {
    data: symptomCategoriesData = [],
    isLoading: isSymptomsLoading,
    isError: isSymptomsError,
    error: symptomsError,
  } = useQuery<SymptomCategoryWithSyndromeCount[]>({
    queryKey: ["symptoms", selectedComplaint?.id],
    queryFn: () => {
      const url = new URL("/api/symptoms/all", window.location.origin);
      if (selectedComplaint)
        url.searchParams.set("complaintId", selectedComplaint.id);
      return fetch(url).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw data;
        return data;
      });
    },
  });

  // Group symptoms into wizard steps
  const wizardSteps = useMemo<WizardStep[]>(() => {
    const symptomCategories = Array.isArray(symptomCategoriesData)
      ? symptomCategoriesData
      : [];

    if (symptomCategories.length === 0) return [];

    const core = symptomCategories.filter((c) => c.syndromeCount >= 4);
    const secondary = symptomCategories.filter(
      (c) => c.syndromeCount === 3,
    );
    const peripheral = symptomCategories.filter(
      (c) => c.syndromeCount < 3,
    );

    const steps: WizardStep[] = [];
    if (core.length > 0)
      steps.push({ name: "Core Symptoms", categories: core });
    if (secondary.length > 0)
      steps.push({ name: "Secondary Symptoms", categories: secondary });
    if (peripheral.length > 0)
      steps.push({ name: "Other Observations", categories: peripheral });

    return steps;
  }, [symptomCategoriesData]);

  const diagnoseMutation = useMutation({
    mutationFn: (data: {
      symptomOptionIds: string[];
      patientData: { age: string; gender: string };
      complaintId: string;
    }) =>
      fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: (data: DiagnosisResult[]) => {
      setResults(data);
      setStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  const handleNext = () => {
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleBack = () => {
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectSymptom = (categoryId: string, symptomId: string) => {
    setSelectedSymptoms((prev) => ({
      ...prev,
      [categoryId]: symptomId,
    }));
  };

  const steps = [
    { id: 1, name: "Profile", icon: User },
    { id: 2, name: "Complaint", icon: Activity },
    { id: 3, name: "Symptoms", icon: ClipboardList },
    { id: 4, name: "Result", icon: Stethoscope },
  ];

  return (
    <main className="max-w-2xl mx-auto min-h-screen bg-background flex flex-col p-4 sm:p-8">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center justify-center gap-2">
          <span className="w-10 h-10 bg-tcm-accent rounded-lg flex items-center justify-center text-white">
            T
          </span>
          TCM Expert
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          Holistic Diagnosis System
        </p>

        {/* Progress Stepper */}
        <div className="relative flex justify-between mt-10 max-w-sm mx-auto">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-teal-200 -translate-y-1/2 z-0" />
          {steps.map((s) => (
            <div
              key={s.id}
              className="relative z-10 flex flex-col items-center"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                  step === s.id
                    ? "bg-tcm-accent border-tcm-accent text-white shadow-lg shadow-tcm-accent/10 scale-110"
                    : step > s.id
                      ? "bg-cyan-50 border-cyan-100 text-tcm-accent"
                      : "bg-white border-slate-200 text-slate-400",
                )}
              >
                <s.icon size={18} />
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider mt-2",
                  step >= s.id ? "text-tcm-accent" : "text-slate-400",
                )}
              >
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Patient Info */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8 animate-slide-up">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Patient Information
            </h2>
            <p className="text-slate-500 mt-1">
              Please provide basic details to begin the consultation.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-teal-700 mb-3">
                Biological Gender
              </label>
              <div className="grid grid-cols-2 gap-4">
                {["Male", "Female"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setPatientData((p) => ({ ...p, gender: g }))}
                    className={cn(
                      "py-4 rounded-2xl border-2 font-semibold transition-all cursor-pointer flex items-center justify-center gap-2",
                      patientData.gender === g
                        ? "border-tcm-accent bg-cyan-50 text-tcm-accent shadow-sm"
                        : "border-slate-100 bg-background text-slate-500 hover:border-slate-200",
                    )}
                  >
                    {patientData.gender === g && <Check size={18} />}
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-teal-700 mb-3">
                Patient Age
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={patientData.age}
                  onChange={(e) =>
                    setPatientData((p) => ({ ...p, age: e.target.value }))
                  }
                  className="w-full p-4 pl-12 rounded-2xl border-2 border-slate-100 bg-background focus:bg-white focus:border-tcm-accent outline-none transition-all text-foreground font-medium"
                  placeholder="Enter age"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={20} />
                </div>
              </div>
            </div>
          </div>

          <button
            disabled={!patientData.age}
            onClick={handleNext}
            className="w-full py-5 bg-tcm-accent hover:bg-tcm-accent/90 text-white rounded-2xl font-bold shadow-lg shadow-tcm-accent/10 disabled:opacity-30 disabled:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Start Consultation <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Step 2: Complaint Selection */}
      {step === 2 && (
        <div className="space-y-6 animate-slide-up">
          <div className="px-2">
            <h2 className="text-2xl font-bold text-foreground">
              Main Complaint
            </h2>
            <p className="text-slate-500 mt-1">
              What is the primary reason for today&apos;s visit?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {complaints.map((c: Complaint) => (
              <button
                key={c.id}
                onClick={() => setSelectedComplaint(c)}
                className={cn(
                  "p-6 rounded-3xl border-2 text-left transition-all cursor-pointer group hover:shadow-md",
                  selectedComplaint?.id === c.id
                    ? "border-tcm-accent bg-cyan-50 text-tcm-accent shadow-sm"
                    : "border-slate-100 bg-white text-slate-500 hover:border-cyan-200",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl mb-4 flex items-center justify-center transition-colors",
                    selectedComplaint?.id === c.id
                      ? "bg-tcm-accent text-white"
                      : "bg-background text-slate-400 group-hover:bg-cyan-50 group-hover:text-tcm-accent",
                  )}
                >
                  <Activity size={20} />
                </div>
                <div className="font-bold text-lg">{c.name}</div>
                <div className="text-sm opacity-70 mt-1">
                  Select this to diagnose related syndromes.
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="p-5 rounded-2xl border-2 border-slate-200 bg-white text-slate-400 hover:text-slate-500 hover:border-teal-300 transition-all cursor-pointer"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              disabled={!selectedComplaint}
              onClick={handleNext}
              className="flex-1 py-5 bg-tcm-accent hover:bg-tcm-accent/90 text-white rounded-2xl font-bold shadow-lg shadow-tcm-accent/10 disabled:opacity-30 disabled:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Continue <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Symptoms Wizard */}
      {step === 3 && (
        <div className="space-y-8 animate-slide-up">
          {isSymptomsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-cyan-100 border-t-tcm-accent rounded-full animate-spin" />
              <p className="text-slate-500 font-medium">
                Preparing symptom checklist...
              </p>
            </div>
          ) : isSymptomsError ? (
            <div className="text-center py-10 bg-red-50 rounded-3xl border border-red-100 px-6">
              <RotateCcw size={48} className="mx-auto text-red-200 mb-4" />
              <p className="text-red-700 font-bold">Error loading symptoms</p>
              <div className="mt-4 p-4 bg-white/50 rounded-xl text-left overflow-auto max-h-40">
                <p className="text-red-500 text-xs font-mono">
                  {(symptomsError as Error)?.message ||
                    "Unknown error"}
                </p>
                {(symptomsError as Error)?.stack && (
                  <pre className="text-[10px] text-red-300 mt-2 font-mono leading-tight">
                    {(symptomsError as Error).stack}
                  </pre>
                )}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm"
              >
                Retry
              </button>
            </div>
          ) : wizardSteps.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <Search size={48} className="mx-auto text-teal-200 mb-4" />
              <p className="text-slate-500 font-medium">
                No relevant symptoms found
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Try choosing a different main complaint.
              </p>
              <button
                onClick={handleBack}
                className="mt-6 px-6 py-2 bg-tcm-accent text-white rounded-xl font-bold text-sm"
              >
                Change Complaint
              </button>
            </div>
          ) : (
            <>
              <div className="px-2">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      Symptoms Checklist
                    </h2>
                    <p className="text-slate-500 mt-1">
                      {wizardSteps[currentSymptomIdx].name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-tcm-accent uppercase tracking-widest">
                      Phase {currentSymptomIdx + 1} of {wizardSteps.length}
                    </span>
                  </div>
                </div>

                {/* Sub-progress bar */}
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-tcm-accent transition-all duration-500"
                    style={{
                      width: `${
                        ((currentSymptomIdx + 1) / wizardSteps.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-12 min-h-75">
                {wizardSteps[currentSymptomIdx].categories.map((cat) => (
                  <div key={cat.id} className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center text-tcm-accent">
                        <ClipboardList size={16} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">
                        {cat.name}
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {cat.options.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => selectSymptom(cat.id, opt.id)}
                          className={cn(
                            "px-5 py-2.5 rounded-full border-2 text-sm font-semibold transition-all cursor-pointer",
                            selectedSymptoms[cat.id] === opt.id
                              ? "bg-tcm-accent border-tcm-accent text-white shadow-md shadow-tcm-accent/10"
                              : "border-slate-100 bg-white text-slate-500 hover:border-cyan-200 hover:text-tcm-accent",
                          )}
                        >
                          {opt.name}
                        </button>
                      ))}

                      {selectedSymptoms[cat.id] && (
                        <button
                          onClick={() => {
                            const newSelected = { ...selectedSymptoms };
                            delete newSelected[cat.id];
                            setSelectedSymptoms(newSelected);
                          }}
                          className="p-2.5 rounded-full border-2 border-slate-100 text-slate-300 hover:text-red-400 hover:border-red-100 transition-all cursor-pointer"
                          title="Clear selection"
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 sticky bottom-4 pt-4 bg-background/80 backdrop-blur-sm">
                <button
                  onClick={() => {
                    if (currentSymptomIdx > 0) {
                      setCurrentSymptomIdx((prev) => prev - 1);
                    } else {
                      handleBack();
                    }
                  }}
                  className="p-5 rounded-2xl border-2 border-slate-200 bg-white text-slate-400 hover:text-slate-500 hover:border-teal-300 transition-all cursor-pointer shadow-lg shadow-teal-100"
                >
                  <ChevronLeft size={24} />
                </button>

                {currentSymptomIdx < wizardSteps.length - 1 ? (
                  <button
                    onClick={() => setCurrentSymptomIdx((prev) => prev + 1)}
                    className="flex-1 py-5 bg-teal-900 hover:bg-teal-800 text-white rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Next Phase <ChevronRight size={20} />
                  </button>
                ) : (
                  <button
                    disabled={
                      Object.keys(selectedSymptoms).length === 0 ||
                      diagnoseMutation.isPending
                    }
                    onClick={() => {
                      if (selectedComplaint) {
                        diagnoseMutation.mutate({
                          symptomOptionIds: Object.values(selectedSymptoms),
                          patientData,
                          complaintId: selectedComplaint.id,
                        });
                      }
                    }}
                    className="flex-1 py-5 bg-tcm-accent hover:bg-tcm-accent/90 text-white rounded-2xl font-bold shadow-xl shadow-tcm-accent/10 disabled:opacity-30 disabled:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {diagnoseMutation.isPending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Generate Diagnosis <Check size={20} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 4: Results */}
      {step === 4 && (
        <div className="space-y-8 animate-zoom-in">
          <div className="text-center px-2">
            <div className="w-16 h-16 bg-cyan-50 text-tcm-accent rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-100">
              <Check size={32} />
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Diagnosis Complete
            </h2>
            <p className="text-slate-500 mt-2">
              Based on the symptoms provided, here are the results.
            </p>
          </div>
          <div className="space-y-6">
            {results.length > 0 ? (
              results.map((r: DiagnosisResult) => (
                <div
                  key={r.id}
                  className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm space-y-8 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6">
                    <div className="bg-cyan-50 text-tcm-accent px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-cyan-100">
                      {r.confidence}% Match
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {r.name}
                    </h3>
                    <div className="h-1.5 w-full bg-teal-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-tcm-accent transition-all duration-1000"
                        style={{ width: `${r.confidence}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                    <div className="bg-background p-6 rounded-2xl border border-slate-100">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <ClipboardList size={14} className="text-tcm-accent" />
                        Therapy Principle
                      </h4>
                      <p className="text-teal-700 font-medium leading-relaxed">
                        {r.therapyPrinciple}
                      </p>
                    </div>

                    <div className="bg-cyan-50/30 p-6 rounded-2xl border border-cyan-100/50">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Activity size={14} className="text-tcm-accent" />
                        Recommended Acupoints
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {r.acupoints.split(",").map((point: string) => (
                          <span
                            key={point}
                            className="px-3 py-1 bg-white border border-cyan-100 text-tcm-accent rounded-lg text-sm font-bold"
                          >
                            {point.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <Search size={48} className="mx-auto text-teal-200 mb-4" />
                <p className="text-slate-500 font-medium">
                  No matching syndromes found.
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Try adjusting the symptoms and diagnostic data.
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setStep(1);
              setSelectedSymptoms({});
              setSelectedComplaint(null);
              setCurrentSymptomIdx(0);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="w-full py-5 bg-teal-900 hover:bg-teal-800 text-white rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw size={20} /> Consultation
          </button>{" "}
        </div>
      )}

      <footer className="mt-auto pt-10 pb-6 text-center">
        <p className="text-slate-400 text-xs font-medium">
          © 2026 TCM Syndrome Expert System • All Rights Reserved
        </p>
      </footer>
    </main>
  );
}
