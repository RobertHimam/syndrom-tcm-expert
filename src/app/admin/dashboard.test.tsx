import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import AdminDashboard from './page'

describe('AdminDashboard', () => {
  it('renders dashboard with stats from API', async () => {
    render(<AdminDashboard />)

    // Check for title
    expect(screen.getByText('Clinical Overview')).toBeInTheDocument()

    // Wait for stats to load (loading indicators '...' should disappear)
    await waitFor(() => {
      expect(screen.queryByText('...')).not.toBeInTheDocument()
    })

    expect(screen.getByText('Complaints')).toBeInTheDocument()
    expect(screen.getByText('Syndromes')).toBeInTheDocument()
    expect(screen.getByText('Clinical Rules')).toBeInTheDocument()

    // Verify stats from MSW mock (2 complaints, 2 syndromes, 1 rule)
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(<AdminDashboard />)
    expect(screen.getAllByText('...')).toHaveLength(3)
  })
})
