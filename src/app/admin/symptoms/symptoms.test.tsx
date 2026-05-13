import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@/test/utils'
import SymptomsAdmin from './page'

// Mock window.confirm
window.confirm = vi.fn(() => true)

describe('SymptomsAdmin', () => {
  it('renders symptoms categories', async () => {
    render(<SymptomsAdmin />)

    expect(screen.getByText('Symptoms Registry')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Pain Location')).toBeInTheDocument()
    })
  })

  it('adds a new category', async () => {
    render(<SymptomsAdmin />)

    await waitFor(() => {
      expect(screen.getByText('Category')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Category'))

    const nameInput = screen.getByPlaceholderText('e.g. Tongue Coating')
    fireEvent.change(nameInput, { target: { value: 'New Test Category' } })

    fireEvent.click(screen.getByText('Commit to Registry'))

    await waitFor(() => {
      expect(screen.queryByText('Add Clinical Category')).not.toBeInTheDocument()
    })
  })

  it('selects a category and adds an option', async () => {
    render(<SymptomsAdmin />)

    await waitFor(() => {
      expect(screen.getByText('Pain Location')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Pain Location'))

    await waitFor(() => {
      expect(screen.getByText('Symptom Details')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Register Point'))

    const nameInput = screen.getByPlaceholderText('e.g. Thick Yellow Coat')
    fireEvent.change(nameInput, { target: { value: 'New Test Option' } })

    fireEvent.click(screen.getByText('Commit to Registry'))

    await waitFor(() => {
      expect(screen.queryByText('Add Observation to Pain Location')).not.toBeInTheDocument()
    })
  })

  it('deletes an option', async () => {
    render(<SymptomsAdmin />)

    await waitFor(() => {
      expect(screen.getByText('Pain Location')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Pain Location'))

    await waitFor(() => {
      expect(screen.getByText('Distending pain in hypochondrium')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Delete Distending pain in hypochondrium'))

    expect(window.confirm).toHaveBeenCalled()
  })
})
