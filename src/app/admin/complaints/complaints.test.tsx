import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@/test/utils'
import ComplaintsAdmin from './page'

// Mock window.confirm
window.confirm = vi.fn(() => true)

describe('ComplaintsAdmin', () => {
  it('renders complaints list', async () => {
    render(<ComplaintsAdmin />)

    expect(screen.getByText('Main Complaints')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Headache')).toBeInTheDocument()
      expect(screen.getByText('Nausea')).toBeInTheDocument()
    })
  })

  it('adds a new complaint', async () => {
    render(<ComplaintsAdmin />)

    await waitFor(() => {
      expect(screen.getByText('Register Complaint')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Register Complaint'))

    const nameInput = screen.getByPlaceholderText('e.g. Chronic Headache')
    const descInput = screen.getByPlaceholderText('Brief clinical context')
    
    fireEvent.change(nameInput, { target: { value: 'New Test Complaint' } })
    fireEvent.change(descInput, { target: { value: 'Test Description' } })

    fireEvent.click(screen.getByText('Commit to Registry'))

    await waitFor(() => {
      expect(screen.queryByText('Register New Category')).not.toBeInTheDocument()
    })
  })

  it('edits a complaint', async () => {
    render(<ComplaintsAdmin />)

    await waitFor(() => {
      expect(screen.getByText('Headache')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Edit Headache'))

    await waitFor(() => {
      expect(screen.getByText('Modify Complaint: Headache')).toBeInTheDocument()
    })

    const nameInput = screen.getByDisplayValue('Headache')
    fireEvent.change(nameInput, { target: { value: 'Updated Headache' } })

    fireEvent.click(screen.getByText('Update Record'))

    await waitFor(() => {
      expect(screen.queryByText('Modify Category: Headache')).not.toBeInTheDocument()
    })
  })

  it('deletes a complaint', async () => {
    render(<ComplaintsAdmin />)

    await waitFor(() => {
      expect(screen.getByText('Headache')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Delete Headache'))

    expect(window.confirm).toHaveBeenCalled()
  })
})
