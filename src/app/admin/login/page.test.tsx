import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from './page'
import { useRouter } from 'next/navigation'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

describe('LoginPage Component', () => {
  let mockPush: Mock

  beforeEach(() => {
    mockPush = vi.fn()
    ;(useRouter as Mock).mockReturnValue({ push: mockPush })
    vi.clearAllMocks()
    
    // Clear cookies before each test
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    })
  })

  it('renders login form correctly', () => {
    render(<LoginPage />)
    expect(screen.getByRole('heading', { name: /Admin Login/i })).toBeDefined()
    expect(screen.getByPlaceholderText('admin')).toBeDefined()
    expect(screen.getByPlaceholderText('••••••••')).toBeDefined()
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeDefined()
  })

  it('shows validation errors for empty fields', async () => {
    render(<LoginPage />)
    
    // In JSDOM, required attribute prevents click from triggering submit. 
    // We can directly submit the form, or remove required. We will submit the form.
    const form = screen.getByRole('button', { name: /Sign In/i }).closest('form')
    fireEvent.submit(form!)
    
    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeDefined()
    })
  })

  it('shows error for invalid credentials', async () => {
    render(<LoginPage />)
    
    fireEvent.change(screen.getByPlaceholderText('admin'), { target: { value: 'wronguser' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } })
    
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Invalid username or password')).toBeDefined()
    })
  })

  it('sets cookie and redirects on successful login', async () => {
    render(<LoginPage />)
    
    fireEvent.change(screen.getByPlaceholderText('admin'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } })
    
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))
    
    await waitFor(() => {
      expect(document.cookie).toContain('admin-session=true')
      expect(mockPush).toHaveBeenCalledWith('/admin')
    })
  })
})
