import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@/test/utils'
import SyndromesAdmin from './page'

describe('SyndromesAdmin', () => {
  it('renders syndromes list', async () => {
    render(<SyndromesAdmin />)

    expect(screen.getAllByText('Syndrome Catalog').length).toBeGreaterThan(0)

    await waitFor(() => {
      expect(screen.getByText('Liver Qi Stagnation')).toBeInTheDocument()
      expect(screen.getByText('Spleen Deficiency')).toBeInTheDocument()
    })
  })

  it('filters syndromes by search', async () => {
    render(<SyndromesAdmin />)

    await waitFor(() => {
      expect(screen.getByText('Liver Qi Stagnation')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search syndrome catalog...')
    fireEvent.change(searchInput, { target: { value: 'Liver' } })

    expect(screen.getByText('Liver Qi Stagnation')).toBeInTheDocument()
    expect(screen.queryByText('Spleen Deficiency')).not.toBeInTheDocument()
  })

  it('selects a syndrome and shows details', async () => {
    render(<SyndromesAdmin />)

    await waitFor(() => {
      expect(screen.getByText('Liver Qi Stagnation')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Liver Qi Stagnation'))

    await waitFor(() => {
      expect(screen.getByText('Clinical Profile')).toBeInTheDocument()
      // Check that it's rendered in the details section (which has specific styling)
      expect(screen.getAllByText('Soothe Liver').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('switches to rule editing mode', async () => {
    render(<SyndromesAdmin />)

    await waitFor(() => {
      expect(screen.getByText('Liver Qi Stagnation')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Liver Qi Stagnation'))

    await waitFor(() => {
      expect(screen.getByText('Edit Matrix')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Edit Matrix'))

    await waitFor(() => {
      expect(screen.getByText('Weight Calibration Matrix')).toBeInTheDocument()
      expect(screen.getByText('Pain Location')).toBeInTheDocument()
    })
  })

  it('adds a new syndrome', async () => {
    render(<SyndromesAdmin />)

    await waitFor(() => {
      expect(screen.getByText('Register Syndrome')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Register Syndrome'))

    const nameInput = screen.getByPlaceholderText('e.g. Spleen Qi Deficiency')
    const therapyInput = screen.getByPlaceholderText('e.g. Tonify Spleen and Qi')
    const acupointsInput = screen.getByPlaceholderText('e.g. ST36, SP3, SP6')

    fireEvent.change(nameInput, { target: { value: 'New Test Syndrome' } })
    fireEvent.change(therapyInput, { target: { value: 'Test Therapy' } })
    fireEvent.change(acupointsInput, { target: { value: 'A1, A2' } })

    fireEvent.click(screen.getByText('Commit to Catalog'))

    await waitFor(() => {
      expect(screen.queryByText('Register Syndrome')).not.toBeInTheDocument()
    })
  })

  it('deletes a syndrome', async () => {
    // Mock confirm
    window.confirm = vi.fn(() => true)
    
    render(<SyndromesAdmin />)

    await waitFor(() => {
      expect(screen.getByText('Liver Qi Stagnation')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Liver Qi Stagnation'))

    await waitFor(() => {
      fireEvent.click(screen.getByLabelText('Delete Liver Qi Stagnation'))
    })

    expect(window.confirm).toHaveBeenCalled()
  })
})
