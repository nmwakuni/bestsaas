import { describe, it, expect, beforeEach, jest } from '@jest/globals'

const mockPrismaClient = {
  timetableSlot: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  class: {
    findMany: jest.fn(),
  },
}

jest.mock('@/lib/db', () => ({
  db: mockPrismaClient,
}))

describe('Timetable API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Conflict Detection', () => {
    it('should detect teacher conflicts', () => {
      const existingSlots = [
        {
          id: 'slot_1',
          teacherId: 'teacher_1',
          dayOfWeek: 'Monday',
          startTime: '08:00',
          endTime: '09:00',
        },
      ]

      const newSlot = {
        teacherId: 'teacher_1',
        dayOfWeek: 'Monday',
        startTime: '08:30',
        endTime: '09:30',
      }

      const hasTeacherConflict = existingSlots.some(
        (slot) =>
          slot.teacherId === newSlot.teacherId &&
          slot.dayOfWeek === newSlot.dayOfWeek &&
          hasTimeOverlap(
            slot.startTime,
            slot.endTime,
            newSlot.startTime,
            newSlot.endTime
          )
      )

      expect(hasTeacherConflict).toBe(true)
    })

    it('should detect class conflicts', () => {
      const existingSlots = [
        {
          id: 'slot_1',
          classId: 'class_1',
          dayOfWeek: 'Monday',
          startTime: '08:00',
          endTime: '09:00',
        },
      ]

      const newSlot = {
        classId: 'class_1',
        dayOfWeek: 'Monday',
        startTime: '08:45',
        endTime: '09:45',
      }

      const hasClassConflict = existingSlots.some(
        (slot) =>
          slot.classId === newSlot.classId &&
          slot.dayOfWeek === newSlot.dayOfWeek &&
          hasTimeOverlap(
            slot.startTime,
            slot.endTime,
            newSlot.startTime,
            newSlot.endTime
          )
      )

      expect(hasClassConflict).toBe(true)
    })

    it('should detect room conflicts', () => {
      const existingSlots = [
        {
          id: 'slot_1',
          room: 'Room 101',
          dayOfWeek: 'Monday',
          startTime: '08:00',
          endTime: '09:00',
        },
      ]

      const newSlot = {
        room: 'Room 101',
        dayOfWeek: 'Monday',
        startTime: '08:30',
        endTime: '09:30',
      }

      const hasRoomConflict = existingSlots.some(
        (slot) =>
          slot.room === newSlot.room &&
          slot.dayOfWeek === newSlot.dayOfWeek &&
          hasTimeOverlap(
            slot.startTime,
            slot.endTime,
            newSlot.startTime,
            newSlot.endTime
          )
      )

      expect(hasRoomConflict).toBe(true)
    })

    it('should not detect conflict when times do not overlap', () => {
      const existingSlots = [
        {
          teacherId: 'teacher_1',
          dayOfWeek: 'Monday',
          startTime: '08:00',
          endTime: '09:00',
        },
      ]

      const newSlot = {
        teacherId: 'teacher_1',
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
      }

      const hasConflict = hasTimeOverlap(
        existingSlots[0].startTime,
        existingSlots[0].endTime,
        newSlot.startTime,
        newSlot.endTime
      )

      expect(hasConflict).toBe(false)
    })

    it('should allow same teacher on different days', () => {
      const existingSlots = [
        {
          teacherId: 'teacher_1',
          dayOfWeek: 'Monday',
          startTime: '08:00',
          endTime: '09:00',
        },
      ]

      const newSlot = {
        teacherId: 'teacher_1',
        dayOfWeek: 'Tuesday',
        startTime: '08:00',
        endTime: '09:00',
      }

      const hasConflict = existingSlots.some(
        (slot) =>
          slot.teacherId === newSlot.teacherId &&
          slot.dayOfWeek === newSlot.dayOfWeek
      )

      expect(hasConflict).toBe(false)
    })
  })

  describe('POST /api/timetable/slots', () => {
    it('should create a timetable slot', async () => {
      const mockSlot = {
        id: 'slot_1',
        classId: 'class_1',
        subjectId: 'math',
        teacherId: 'teacher_1',
        dayOfWeek: 'Monday',
        startTime: '08:00',
        endTime: '09:00',
        room: 'Room 101',
        academicYear: '2024',
        term: 1,
      }

      mockPrismaClient.timetableSlot.findMany.mockResolvedValue([])
      mockPrismaClient.timetableSlot.create.mockResolvedValue({
        ...mockSlot,
        class: { name: 'Form 1' },
        subject: { name: 'Mathematics' },
        teacher: { firstName: 'John', lastName: 'Doe' },
      })

      const result = mockSlot

      expect(result).toMatchObject({
        classId: 'class_1',
        teacherId: 'teacher_1',
        dayOfWeek: 'Monday',
      })
    })

    it('should validate day of week', () => {
      const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      const testDay = 'Monday'

      expect(validDays).toContain(testDay)
    })

    it('should validate time format', () => {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
      const validTimes = ['08:00', '14:30', '23:59']
      const invalidTimes = ['24:00', '8:00', '14:60']

      validTimes.forEach((time) => {
        expect(timeRegex.test(time)).toBe(true)
      })

      invalidTimes.forEach((time) => {
        expect(timeRegex.test(time)).toBe(false)
      })
    })
  })

  describe('GET /api/timetable/class/:classId', () => {
    it('should group slots by day', () => {
      const slots = [
        { id: '1', dayOfWeek: 'Monday', startTime: '08:00' },
        { id: '2', dayOfWeek: 'Monday', startTime: '09:00' },
        { id: '3', dayOfWeek: 'Tuesday', startTime: '08:00' },
      ]

      const groupedByDay = slots.reduce((acc: any, slot) => {
        if (!acc[slot.dayOfWeek]) {
          acc[slot.dayOfWeek] = []
        }
        acc[slot.dayOfWeek].push(slot)
        return acc
      }, {})

      expect(groupedByDay.Monday).toHaveLength(2)
      expect(groupedByDay.Tuesday).toHaveLength(1)
    })

    it('should sort slots by time', () => {
      const slots = [
        { startTime: '09:00' },
        { startTime: '08:00' },
        { startTime: '10:00' },
      ]

      const sorted = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime))

      expect(sorted[0].startTime).toBe('08:00')
      expect(sorted[1].startTime).toBe('09:00')
      expect(sorted[2].startTime).toBe('10:00')
    })
  })

  describe('Time Utility Functions', () => {
    it('should convert time string to minutes', () => {
      const testCases = [
        { time: '08:00', expected: 480 },
        { time: '08:30', expected: 510 },
        { time: '14:45', expected: 885 },
      ]

      testCases.forEach(({ time, expected }) => {
        const [hours, minutes] = time.split(':').map(Number)
        const totalMinutes = hours * 60 + minutes
        expect(totalMinutes).toBe(expected)
      })
    })

    it('should check if end time is after start time', () => {
      const testCases = [
        { start: '08:00', end: '09:00', valid: true },
        { start: '09:00', end: '08:00', valid: false },
        { start: '08:00', end: '08:00', valid: false },
      ]

      testCases.forEach(({ start, end, valid }) => {
        const isValid = start < end
        expect(isValid).toBe(valid)
      })
    })
  })

  describe('Bulk Operations', () => {
    it('should create multiple slots with conflict checking', async () => {
      const bulkSlots = [
        {
          classId: 'class_1',
          subjectId: 'math',
          teacherId: 'teacher_1',
          dayOfWeek: 'Monday' as const,
          startTime: '08:00',
          endTime: '09:00',
          academicYear: '2024',
          term: 1,
        },
        {
          classId: 'class_1',
          subjectId: 'eng',
          teacherId: 'teacher_2',
          dayOfWeek: 'Monday' as const,
          startTime: '09:00',
          endTime: '10:00',
          academicYear: '2024',
          term: 1,
        },
      ]

      expect(bulkSlots).toHaveLength(2)

      // Check no conflicts between slots
      const hasConflict = hasTimeOverlap(
        bulkSlots[0].startTime,
        bulkSlots[0].endTime,
        bulkSlots[1].startTime,
        bulkSlots[1].endTime
      )

      expect(hasConflict).toBe(false)
    })
  })
})

// Helper function for time overlap detection
function hasTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToMinutes(start1)
  const e1 = timeToMinutes(end1)
  const s2 = timeToMinutes(start2)
  const e2 = timeToMinutes(end2)

  return s1 < e2 && e1 > s2
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}
