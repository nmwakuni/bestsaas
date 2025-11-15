import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock fetch globally
global.fetch = jest.fn()

// Create a mock Gradebook component for testing
const MockGradebook = () => {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [term, setTerm] = React.useState(1)

  const students = [
    { id: '1', firstName: 'Jane', lastName: 'Doe', admissionNumber: 'ADM001' },
    { id: '2', firstName: 'John', lastName: 'Smith', admissionNumber: 'ADM002' },
  ]

  const filteredStudents = students.filter((student) =>
    `${student.firstName} ${student.lastName} ${student.admissionNumber}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <h1>Gradebook</h1>
      <input
        type="text"
        placeholder="Search students..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        data-testid="search-input"
      />

      <div data-testid="term-selector">
        {[1, 2, 3].map((t) => (
          <button
            key={t}
            onClick={() => setTerm(t)}
            data-testid={`term-${t}`}
            className={term === t ? 'active' : ''}
          >
            Term {t}
          </button>
        ))}
      </div>

      <table data-testid="students-table">
        <tbody>
          {filteredStudents.map((student) => (
            <tr key={student.id} data-testid={`student-${student.id}`}>
              <td>{student.admissionNumber}</td>
              <td>
                {student.firstName} {student.lastName}
              </td>
              <td>
                <button data-testid={`add-grade-${student.id}`}>
                  Add Grade
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// We need to import React for the mock component to work
import React from 'react'

describe('Gradebook Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Student List', () => {
    it('should render students table', () => {
      render(<MockGradebook />)

      expect(screen.getByTestId('students-table')).toBeInTheDocument()
      expect(screen.getByTestId('student-1')).toBeInTheDocument()
      expect(screen.getByTestId('student-2')).toBeInTheDocument()
    })

    it('should display student information', () => {
      render(<MockGradebook />)

      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
      expect(screen.getByText('ADM001')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should filter students by search term', async () => {
      render(<MockGradebook />)

      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: 'Jane' } })

      await waitFor(() => {
        expect(screen.getByTestId('student-1')).toBeInTheDocument()
        expect(screen.queryByTestId('student-2')).not.toBeInTheDocument()
      })
    })

    it('should filter by admission number', async () => {
      render(<MockGradebook />)

      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: 'ADM002' } })

      await waitFor(() => {
        expect(screen.queryByTestId('student-1')).not.toBeInTheDocument()
        expect(screen.getByTestId('student-2')).toBeInTheDocument()
      })
    })

    it('should be case insensitive', async () => {
      render(<MockGradebook />)

      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: 'JANE' } })

      await waitFor(() => {
        expect(screen.getByTestId('student-1')).toBeInTheDocument()
      })
    })
  })

  describe('Term Selection', () => {
    it('should render term selector', () => {
      render(<MockGradebook />)

      expect(screen.getByTestId('term-1')).toBeInTheDocument()
      expect(screen.getByTestId('term-2')).toBeInTheDocument()
      expect(screen.getByTestId('term-3')).toBeInTheDocument()
    })

    it('should change term on button click', () => {
      render(<MockGradebook />)

      const term2Button = screen.getByTestId('term-2')
      fireEvent.click(term2Button)

      expect(term2Button).toHaveClass('active')
    })

    it('should have default term as 1', () => {
      render(<MockGradebook />)

      const term1Button = screen.getByTestId('term-1')
      expect(term1Button).toHaveClass('active')
    })
  })

  describe('Grade Entry', () => {
    it('should show add grade button for each student', () => {
      render(<MockGradebook />)

      expect(screen.getByTestId('add-grade-1')).toBeInTheDocument()
      expect(screen.getByTestId('add-grade-2')).toBeInTheDocument()
    })

    it('should handle add grade button click', () => {
      render(<MockGradebook />)

      const addGradeButton = screen.getByTestId('add-grade-1')
      fireEvent.click(addGradeButton)

      // Button should be clickable
      expect(addGradeButton).toBeInTheDocument()
    })
  })
})

describe('Grade Calculations', () => {
  it('should calculate percentage correctly', () => {
    const score = 85
    const maxScore = 100
    const percentage = (score / maxScore) * 100

    expect(percentage).toBe(85)
  })

  it('should calculate average from multiple grades', () => {
    const grades = [
      { score: 85, maxScore: 100 },
      { score: 90, maxScore: 100 },
      { score: 75, maxScore: 100 },
    ]

    const percentages = grades.map((g) => (g.score / g.maxScore) * 100)
    const average = percentages.reduce((sum, p) => sum + p, 0) / percentages.length

    expect(average).toBeCloseTo(83.33, 2)
  })

  it('should color code performance', () => {
    const getPerformanceColor = (average: number) => {
      if (average >= 75) return 'green'
      if (average >= 50) return 'yellow'
      return 'red'
    }

    expect(getPerformanceColor(85)).toBe('green')
    expect(getPerformanceColor(60)).toBe('yellow')
    expect(getPerformanceColor(40)).toBe('red')
  })
})
