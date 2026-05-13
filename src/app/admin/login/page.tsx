'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginSchema } from '@/lib/validations'
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate with Zod
    const result = loginSchema.safeParse({ username, password })
    if (!result.success) {
      setError(result.error.issues[0].message)
      setIsLoading(false)
      return
    }

    // Simulate server delay
    await new Promise(resolve => setTimeout(resolve, 800))

    // Hardcoded check
    if (username === 'admin' && password === 'password123') {
      // Set cookie (client-side for simplicity as requested "hardcoded")
      document.cookie = 'admin-session=true; path=/; max-age=86400; SameSite=Lax'
      router.push('/admin')
    } else {
      setError('Invalid username or password')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-tcm-accent rounded-2xl flex items-center justify-center text-white font-heading text-3xl font-black shadow-xl shadow-tcm-accent/20 mx-auto mb-6">
            經
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Admin Login</h1>
          <p className="text-teal-600 mt-2 font-body italic">
            Clinical Expert System Management
          </p>
        </div>

        <form onSubmit={handleLogin} className="tcm-card p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium animate-slide-up">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="tcm-label">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="tcm-input pl-12"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div>
              <label className="tcm-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="tcm-input pl-12"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="tcm-btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              'Sign In'
            )}
          </button>

          <p className="text-[10px] text-center text-teal-400 font-bold uppercase tracking-widest pt-4">
            Authorized Personnel Only
          </p>
        </form>
      </div>
    </div>
  )
}
