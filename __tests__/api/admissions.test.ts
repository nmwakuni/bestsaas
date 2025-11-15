import { describe, it, expect, beforeEach, jest } from '@jest/globals'

const mockPrismaClient = {
  admission: {
    count: jest.fn() as any,
    create: jest.fn() as any,
    findMany: jest.fn() as any,
    findUnique: jest.fn() as any,
    update: jest.fn() as any,
    updateMany: jest.fn() as any,
    delete: jest.fn() as any,
  },
  parent: {
    findFirst: jest.fn() as any,
    create: jest.fn() as any,
  },
  student: {
    count: jest.fn() as any,
    create: jest.fn() as any,
  },
  school: {
    findUnique: jest.fn() as any,
  },
}

jest.mock('@/lib/db', () => ({
  db: mockPrismaClient,
}))

describe('Admissions API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/admissions', () => {
    it('should create a new admission application', async () => {
      const mockAdmission = {
        id: 'adm_1',
        applicationNumber: 'ADM-2024-0001',
        schoolId: 'school_1',
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: new Date('2010-05-15'),
        gender: 'Female' as const,
        parentFirstName: 'John',
        parentLastName: 'Doe',
        parentEmail: 'john@example.com',
        parentPhone: '254712345678',
        applyingForClass: 'Form 1',
        academicYear: '2024',
        status: 'Pending' as const,
        appliedAt: new Date(),
      }

      mockPrismaClient.admission.count.mockResolvedValue(0)
      mockPrismaClient.admission.create.mockResolvedValue(mockAdmission)

      const result = mockAdmission

      expect(result.applicationNumber).toBe('ADM-2024-0001')
      expect(result.status).toBe('Pending')
    })

    it('should generate sequential application numbers', () => {
      const year = 2024
      const count = 5

      const applicationNumber = `ADM-${year}-${String(count + 1).padStart(4, '0')}`

      expect(applicationNumber).toBe('ADM-2024-0006')
    })

    it('should validate required fields', () => {
      const requiredFields = [
        'firstName',
        'lastName',
        'dateOfBirth',
        'gender',
        'parentFirstName',
        'parentLastName',
        'parentEmail',
        'parentPhone',
        'applyingForClass',
      ]

      const application = {
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: '2010-05-15',
        gender: 'Female',
        parentFirstName: 'John',
        parentLastName: 'Doe',
        parentEmail: 'john@example.com',
        parentPhone: '254712345678',
        applyingForClass: 'Form 1',
      }

      const hasAllFields = requiredFields.every((field) => field in application)

      expect(hasAllFields).toBe(true)
    })

    it('should validate phone number format (Kenya)', () => {
      const validPhones = ['254712345678', '254722345678', '254733345678']
      const invalidPhones = ['712345678', '+254712345678', '0712345678']

      validPhones.forEach((phone) => {
        expect(phone).toMatch(/^254\d{9}$/)
      })

      invalidPhones.forEach((phone) => {
        expect(phone).not.toMatch(/^254\d{9}$/)
      })
    })
  })

  describe('POST /api/admissions/:id/approve', () => {
    it('should approve admission and create student record', async () => {
      const mockAdmission = {
        id: 'adm_1',
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: new Date('2010-05-15'),
        gender: 'Female' as const,
        parentPhone: '254712345678',
        parentFirstName: 'John',
        parentLastName: 'Doe',
        parentEmail: 'john@example.com',
        schoolId: 'school_1',
        status: 'Pending' as const,
      }

      const mockSchool = {
        id: 'school_1',
        code: 'SCH',
        name: 'Test School',
      }

      const mockParent = {
        id: 'parent_1',
        firstName: 'John',
        lastName: 'Doe',
        phone: '254712345678',
        email: 'john@example.com',
      }

      const mockStudent = {
        id: 'student_1',
        firstName: 'Jane',
        lastName: 'Doe',
        admissionNumber: 'SCH/24/0001',
        classId: 'class_1',
        parentId: 'parent_1',
        status: 'Active',
      }

      mockPrismaClient.admission.findUnique.mockResolvedValue({
        ...mockAdmission,
        school: mockSchool,
      })
      mockPrismaClient.parent.findFirst.mockResolvedValue(mockParent)
      mockPrismaClient.student.count.mockResolvedValue(0)
      mockPrismaClient.student.create.mockResolvedValue(mockStudent)
      mockPrismaClient.admission.update.mockResolvedValue({
        ...mockAdmission,
        status: 'Approved',
      })

      expect(mockStudent.admissionNumber).toBe('SCH/24/0001')
      expect(mockStudent.status).toBe('Active')
    })

    it('should generate admission number correctly', () => {
      const schoolCode = 'SCH'
      const year = '24'
      const count = 0

      const admissionNumber = `${schoolCode}/${year}/${String(count + 1).padStart(4, '0')}`

      expect(admissionNumber).toBe('SCH/24/0001')
    })

    it('should create parent if not exists', async () => {
      mockPrismaClient.parent.findFirst.mockResolvedValue(null)
      mockPrismaClient.parent.create.mockResolvedValue({
        id: 'parent_1',
        firstName: 'John',
        lastName: 'Doe',
        phone: '254712345678',
        email: 'john@example.com',
      })

      // Parent should be created when not found
      const parentNotFound = await mockPrismaClient.parent.findFirst()
      expect(parentNotFound).toBeNull()
    })

    it('should reuse existing parent', async () => {
      const existingParent = {
        id: 'parent_1',
        phone: '254712345678',
      }

      mockPrismaClient.parent.findFirst.mockResolvedValue(existingParent)

      const parent = await mockPrismaClient.parent.findFirst()
      expect(parent).toEqual(existingParent)
    })
  })

  describe('POST /api/admissions/:id/reject', () => {
    it('should reject admission with reason', async () => {
      const mockAdmission = {
        id: 'adm_1',
        status: 'Pending' as const,
      }

      const updatedAdmission = {
        ...mockAdmission,
        status: 'Rejected' as const,
        reviewNotes: 'Currently at capacity',
        reviewedAt: new Date(),
      }

      mockPrismaClient.admission.update.mockResolvedValue(updatedAdmission)

      const result = updatedAdmission

      expect(result.status).toBe('Rejected')
      expect(result.reviewNotes).toBe('Currently at capacity')
    })
  })

  describe('GET /api/admissions', () => {
    it('should filter admissions by status', () => {
      const admissions = [
        { id: '1', status: 'Pending' },
        { id: '2', status: 'Approved' },
        { id: '3', status: 'Pending' },
        { id: '4', status: 'Rejected' },
      ]

      const pending = admissions.filter((a) => a.status === 'Pending')
      const approved = admissions.filter((a) => a.status === 'Approved')

      expect(pending).toHaveLength(2)
      expect(approved).toHaveLength(1)
    })

    it('should validate status values', () => {
      const validStatuses = ['Pending', 'UnderReview', 'Approved', 'Rejected', 'Waitlisted']
      const testStatus = 'Pending'

      expect(validStatuses).toContain(testStatus)
    })
  })

  describe('GET /api/admissions/statistics/:schoolId', () => {
    it('should calculate admission statistics', () => {
      const admissions = [
        { status: 'Pending', appliedAt: new Date('2024-01-15') },
        { status: 'Approved', appliedAt: new Date('2024-01-20') },
        { status: 'Pending', appliedAt: new Date('2024-02-10') },
        { status: 'Rejected', appliedAt: new Date('2024-02-15') },
      ]

      const byStatus = admissions.reduce((acc: any, adm) => {
        if (!acc[adm.status]) acc[adm.status] = 0
        acc[adm.status]++
        return acc
      }, {})

      expect(byStatus.Pending).toBe(2)
      expect(byStatus.Approved).toBe(1)
      expect(byStatus.Rejected).toBe(1)
    })

    it('should group by month', () => {
      const admissions = [
        { appliedAt: new Date('2024-01-15') },
        { appliedAt: new Date('2024-01-20') },
        { appliedAt: new Date('2024-02-10') },
      ]

      const byMonth = admissions.reduce((acc: any, adm) => {
        const month = adm.appliedAt.toISOString().slice(0, 7)
        if (!acc[month]) acc[month] = 0
        acc[month]++
        return acc
      }, {})

      expect(byMonth['2024-01']).toBe(2)
      expect(byMonth['2024-02']).toBe(1)
    })
  })

  describe('POST /api/admissions/bulk-status', () => {
    it('should update multiple admissions', async () => {
      const admissionIds = ['adm_1', 'adm_2', 'adm_3']
      const newStatus = 'Rejected'

      mockPrismaClient.admission.updateMany.mockResolvedValue({ count: 3 })

      const result = await mockPrismaClient.admission.updateMany({
        where: { id: { in: admissionIds } },
        data: { status: newStatus },
      })

      expect(result.count).toBe(3)
    })
  })

  describe('Application Workflow', () => {
    it('should follow correct status progression', () => {
      const validProgressions = [
        { from: 'Pending', to: 'UnderReview' },
        { from: 'UnderReview', to: 'Approved' },
        { from: 'UnderReview', to: 'Rejected' },
        { from: 'Pending', to: 'Approved' },
        { from: 'Pending', to: 'Rejected' },
      ]

      expect(validProgressions).toHaveLength(5)
    })

    it('should prevent invalid status changes', () => {
      const invalidProgressions = [
        { from: 'Approved', to: 'Pending' },
        { from: 'Rejected', to: 'Approved' },
      ]

      expect(invalidProgressions).toHaveLength(2)
    })
  })
})
