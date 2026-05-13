import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@/test/utils'
import ContributorsAdmin from './page'

// Mock window.confirm
window.confirm = vi.fn(() => true)

describe('ContributorsAdmin', () => {
  it('renders contributors list', async () => {
    render(<ContributorsAdmin />)

    expect(screen.getByText('Expert Council')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Dr. Li')).toBeInTheDocument()
      expect(screen.getByText('TCM Expert')).toBeInTheDocument()
    })
  })

  it('adds a new contributor', async () => {
    render(<ContributorsAdmin />)

    await waitFor(() => {
      expect(screen.getByText('Appoint Expert')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Appoint Expert'))

    const nameInput = screen.getByPlaceholderText('e.g. Dr. Li Wei')
    const titleInput = screen.getByPlaceholderText('e.g. TCM Specialist')
    
    fireEvent.change(nameInput, { target: { value: 'Dr. Test' } })
    fireEvent.change(titleInput, { target: { value: 'Researcher' } })

    fireEvent.click(screen.getByText('Register Expert'))

    await waitFor(() => {
      expect(screen.queryByText('New Practitioner')).not.toBeInTheDocument()
    })
  })

  it('deletes a contributor', async () => {
    render(<ContributorsAdmin />)

    await waitFor(() => {
      expect(screen.getByText('Dr. Li')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Delete Dr. Li'))

    expect(window.confirm).toHaveBeenCalled()
  })
})
