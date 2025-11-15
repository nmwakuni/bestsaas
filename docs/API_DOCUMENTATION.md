# API Documentation

Complete API reference for the School Management System.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints require authentication via Better Auth. Include the session token in your requests.

---

## CBC Report Cards API

### Generate Report Card
**POST** `/cbc/report-cards/generate`

Generate a CBC (Competency-Based Curriculum) report card for a student.

**Request Body:**
```json
{
  "studentId": "string",
  "academicYear": "2024",
  "term": 1,
  "communication": "Meets",
  "collaboration": "Exceeds",
  "criticalThinking": "Meets",
  "creativity": "Approaches",
  "citizenship": "Meets",
  "learning": "Exceeds",
  "selfEfficacy": "Meets",
  "teacherComment": "Excellent progress this term",
  "principalComment": "Keep up the good work"
}
```

**Response:**
```json
{
  "success": true,
  "reportCard": {
    "id": "rc_123",
    "studentId": "student_1",
    "academicYear": "2024",
    "term": 1,
    ...
  }
}
```

### Create/Update Assessment
**POST** `/cbc/assessments`

Create or update a subject assessment for a student.

**Request Body:**
```json
{
  "studentId": "string",
  "subjectId": "string",
  "academicYear": "2024",
  "term": 1,
  "strand": "Numbers and Operations",
  "learningOutcome": "Count and write numbers",
  "competencyLevel": "Exceeds",
  "teacherComment": "Outstanding work"
}
```

### Get Student Assessments
**GET** `/cbc/assessments/:studentId?academicYear=2024&term=1`

Retrieve all assessments for a student.

### Bulk Create Assessments
**POST** `/cbc/assessments/bulk`

Create multiple assessments at once.

**Request Body:**
```json
{
  "assessments": [
    {
      "studentId": "student_1",
      "subjectId": "math",
      "academicYear": "2024",
      "term": 1,
      "competencyLevel": "Meets"
    },
    ...
  ]
}
```

### Download Report Card PDF
**GET** `/cbc/report-cards/:id/pdf`

Download report card as PDF. Returns a PDF file.

---

## Gradebook API

### Create Subject
**POST** `/gradebook/subjects`

**Request Body:**
```json
{
  "name": "Mathematics",
  "code": "MATH101",
  "description": "Core Mathematics",
  "schoolId": "school_1"
}
```

### Get All Subjects
**GET** `/gradebook/subjects?schoolId=school_1`

### Assign Teacher to Subject
**POST** `/gradebook/assign-teacher`

**Request Body:**
```json
{
  "subjectId": "subject_1",
  "teacherId": "teacher_1",
  "classId": "class_1"
}
```

### Create Grade
**POST** `/gradebook/grades`

**Request Body:**
```json
{
  "studentId": "student_1",
  "subjectId": "math",
  "assessmentType": "CAT",
  "score": 85,
  "maxScore": 100,
  "academicYear": "2024",
  "term": 1,
  "gradedBy": "teacher_1",
  "comment": "Good performance",
  "weight": 30
}
```

**Assessment Types:** `Assignment`, `CAT`, `MidTerm`, `EndTerm`, `Project`, `Homework`

### Bulk Create Grades
**POST** `/gradebook/grades/bulk`

Create multiple grades at once.

**Request Body:**
```json
{
  "grades": [
    {
      "studentId": "student_1",
      "subjectId": "math",
      "assessmentType": "CAT",
      "score": 85,
      "maxScore": 100,
      "academicYear": "2024",
      "term": 1,
      "gradedBy": "teacher_1"
    },
    ...
  ]
}
```

### Get Grades
**GET** `/gradebook/grades?studentId=student_1&subjectId=math&term=1`

Query parameters:
- `studentId` - Filter by student
- `subjectId` - Filter by subject
- `classId` - Filter by class
- `academicYear` - Filter by academic year
- `term` - Filter by term (1, 2, or 3)

### Get Student Report
**GET** `/gradebook/student-report/:studentId?academicYear=2024&term=1`

Get comprehensive grade report for a student with averages and statistics.

**Response:**
```json
{
  "success": true,
  "report": {
    "studentId": "student_1",
    "academicYear": "2024",
    "term": 1,
    "subjects": [
      {
        "subject": { "name": "Mathematics" },
        "grades": [...],
        "average": 85.5,
        "total": 5
      }
    ],
    "overallAverage": 82.3,
    "totalGrades": 20
  }
}
```

### Get Class Report
**GET** `/gradebook/class-report/:classId?subjectId=math&academicYear=2024&term=1`

Get class performance statistics.

---

## Events & Calendar API

### Create Event
**POST** `/events`

**Request Body:**
```json
{
  "title": "Mid Term Exams",
  "description": "Mathematics mid-term examination",
  "eventType": "Exam",
  "startDate": "2024-05-15",
  "endDate": "2024-05-20",
  "startTime": "08:00",
  "endTime": "12:00",
  "location": "Main Hall",
  "schoolId": "school_1",
  "organizer": "John Doe",
  "isAllDay": false,
  "classIds": ["class_1", "class_2"]
}
```

**Event Types:** `Academic`, `Sports`, `Meeting`, `Holiday`, `Extracurricular`, `Exam`, `Trip`, `Other`

### Get Events
**GET** `/events?schoolId=school_1&eventType=Exam&month=5&year=2024`

Query parameters:
- `schoolId` - Required
- `eventType` - Filter by event type
- `startDate` & `endDate` - Filter by date range
- `month` & `year` - Filter by month
- `classId` - Filter by class

### Get Calendar View
**GET** `/events/calendar/:schoolId/:year/:month`

Get all events for a specific month with grouping by date.

**Example:** `/events/calendar/school_1/2024/5`

### Get Upcoming Events
**GET** `/events/upcoming/:schoolId?limit=10`

Get upcoming events sorted by start date.

### Bulk Create Events
**POST** `/events/bulk`

Create multiple events at once (useful for term dates).

**Request Body:**
```json
{
  "events": [
    {
      "title": "Term 1 Opening",
      "eventType": "Academic",
      "startDate": "2024-01-15",
      "schoolId": "school_1"
    },
    ...
  ]
}
```

---

## Timetable API

### Create Timetable Slot
**POST** `/timetable/slots`

Create a timetable slot with automatic conflict detection.

**Request Body:**
```json
{
  "classId": "class_1",
  "subjectId": "math",
  "teacherId": "teacher_1",
  "dayOfWeek": "Monday",
  "startTime": "08:00",
  "endTime": "09:00",
  "room": "Room 101",
  "academicYear": "2024",
  "term": 1
}
```

**Days of Week:** `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`, `Sunday`

**Response (Success):**
```json
{
  "success": true,
  "slot": {...}
}
```

**Response (Conflict):**
```json
{
  "success": false,
  "error": "Scheduling conflicts detected",
  "conflicts": [
    {
      "type": "teacher",
      "message": "Teacher John Doe is already scheduled...",
      "slot": {...}
    }
  ]
}
```

### Check Conflicts
**POST** `/timetable/check-conflicts`

Check for conflicts without creating a slot.

**Request Body:** Same as create slot

### Get Class Timetable
**GET** `/timetable/class/:classId?academicYear=2024&term=1`

Get full timetable for a class grouped by day.

**Response:**
```json
{
  "success": true,
  "slots": [...],
  "timetableByDay": {
    "Monday": [...],
    "Tuesday": [...],
    ...
  },
  "total": 35
}
```

### Get Teacher Timetable
**GET** `/timetable/teacher/:teacherId?academicYear=2024&term=1`

Get teacher's teaching schedule.

### Bulk Create Slots
**POST** `/timetable/slots/bulk`

Create multiple timetable slots with conflict checking.

### Delete Class Timetable
**DELETE** `/timetable/class/:classId?academicYear=2024&term=1`

Delete all slots for a class (useful for resetting timetable).

---

## Admissions API

### Submit Application
**POST** `/admissions`

Submit a new admission application.

**Request Body:**
```json
{
  "schoolId": "school_1",
  "firstName": "Jane",
  "lastName": "Doe",
  "dateOfBirth": "2010-05-15",
  "gender": "Female",
  "parentFirstName": "John",
  "parentLastName": "Doe",
  "parentEmail": "john@example.com",
  "parentPhone": "254712345678",
  "applyingForClass": "Grade 7",
  "academicYear": "2024",
  "address": "123 Main St, Nairobi",
  "county": "Nairobi",
  "town": "Westlands",
  "previousSchool": "ABC Primary",
  "medicalConditions": "None",
  "specialNeeds": "None"
}
```

**Response:**
```json
{
  "success": true,
  "admission": {
    "id": "adm_123",
    "applicationNumber": "ADM-2024-0001",
    "status": "Pending",
    ...
  }
}
```

### Get Admissions
**GET** `/admissions?schoolId=school_1&status=Pending&academicYear=2024`

Query parameters:
- `schoolId` - Required
- `status` - Filter by status
- `academicYear` - Filter by year
- `applyingForClass` - Filter by class

**Statuses:** `Pending`, `UnderReview`, `Approved`, `Rejected`, `Waitlisted`

### Get Application by Number
**GET** `/admissions/number/:applicationNumber`

Track application by application number.

### Approve Application
**POST** `/admissions/:id/approve`

Approve application and create student record.

**Request Body:**
```json
{
  "classId": "class_1",
  "admissionFee": 5000,
  "reviewedBy": "admin_1"
}
```

**Response:**
```json
{
  "success": true,
  "admission": {...},
  "student": {
    "id": "student_123",
    "admissionNumber": "SCH/24/0123",
    ...
  },
  "message": "Admission approved and student record created"
}
```

### Reject Application
**POST** `/admissions/:id/reject`

**Request Body:**
```json
{
  "reviewNotes": "Currently at capacity",
  "reviewedBy": "admin_1"
}
```

### Schedule Interview
**POST** `/admissions/:id/schedule-interview`

**Request Body:**
```json
{
  "interviewDate": "2024-05-20",
  "interviewTime": "10:00 AM",
  "location": "Admin Block"
}
```

### Bulk Update Status
**POST** `/admissions/bulk-status`

Update status for multiple applications.

**Request Body:**
```json
{
  "admissionIds": ["adm_1", "adm_2", "adm_3"],
  "status": "Rejected",
  "reviewNotes": "Batch rejection for expired applications"
}
```

### Get Statistics
**GET** `/admissions/statistics/:schoolId?academicYear=2024`

Get admission statistics by status, class, and month.

---

## Meal Planning API

### Create Meal
**POST** `/meals`

**Request Body:**
```json
{
  "name": "Ugali and Beef Stew",
  "description": "Traditional Kenyan meal",
  "mealType": "Lunch",
  "ingredients": ["Maize flour", "Beef", "Tomatoes", "Onions"],
  "allergens": ["Gluten"],
  "nutritionInfo": {
    "calories": 650,
    "protein": 35,
    "carbs": 80,
    "fats": 15
  },
  "cost": 120,
  "servingSize": "1 plate",
  "prepTime": 45,
  "schoolId": "school_1"
}
```

**Meal Types:** `Breakfast`, `Lunch`, `Dinner`, `Snack`

### Get Meals
**GET** `/meals?schoolId=school_1&mealType=Lunch&search=ugali`

### Create Meal Plan
**POST** `/meals/plans`

Create a weekly meal plan.

**Request Body:**
```json
{
  "schoolId": "school_1",
  "name": "Week 1 - Term 1",
  "startDate": "2024-01-15",
  "endDate": "2024-01-21",
  "notes": "Standard boarding school menu",
  "meals": [
    {
      "mealId": "meal_1",
      "dayOfWeek": "Monday",
      "mealType": "Breakfast"
    },
    {
      "mealId": "meal_2",
      "dayOfWeek": "Monday",
      "mealType": "Lunch"
    },
    ...
  ]
}
```

### Get Current Meal Plan
**GET** `/meals/plans/current/:schoolId`

Get the active meal plan for the current week.

**Response:**
```json
{
  "success": true,
  "mealPlan": {
    "id": "plan_1",
    "name": "Week 1",
    "startDate": "2024-01-15",
    "endDate": "2024-01-21",
    "mealsByDay": {
      "Monday": [
        { "mealType": "Breakfast", "meal": {...} },
        { "mealType": "Lunch", "meal": {...} },
        { "mealType": "Dinner", "meal": {...} }
      ],
      ...
    }
  }
}
```

### Get Meal Statistics
**GET** `/meals/statistics/:schoolId`

Get statistics on meals (average cost, allergen counts, etc.).

---

## NEMIS Integration API

**NEMIS** = National Education Management Information System (Kenya Government)

### Generate Enrollment Report
**GET** `/nemis/enrollment/:schoolId?academicYear=2024`

Generate NEMIS-compliant enrollment report.

**Response:**
```json
{
  "success": true,
  "report": {
    "reportType": "NEMIS Enrollment Report",
    "school": {
      "name": "ABC Secondary School",
      "code": "01234567",
      "county": "Nairobi",
      "subCounty": "Westlands"
    },
    "academicYear": "2024",
    "summary": {
      "totalEnrollment": 450,
      "byGender": {
        "Male": 230,
        "Female": 220
      },
      "byClass": {
        "Form 1": { "total": 120, "male": 65, "female": 55 }
      }
    },
    "students": [...]
  }
}
```

### Generate Teachers Report
**GET** `/nemis/teachers/:schoolId`

Generate teacher staffing report.

### Generate Academic Performance Report
**GET** `/nemis/academic-performance/:schoolId?academicYear=2024&term=1`

Generate performance statistics by subject and class.

### Generate Infrastructure Report
**GET** `/nemis/infrastructure/:schoolId`

Generate report on school infrastructure and resources.

### Check NEMIS Compliance
**GET** `/nemis/compliance/:schoolId`

Check if school data is NEMIS-compliant.

**Response:**
```json
{
  "success": true,
  "compliance": {
    "hasSchoolCode": true,
    "hasCountyInfo": true,
    "hasSubCountyInfo": true,
    "hasEnrollmentData": true,
    "hasTeacherData": true,
    "studentTeacherRatio": 28.5,
    "isCompliant": true
  },
  "issues": [],
  "recommendations": ["School is NEMIS compliant"]
}
```

### Export Report as CSV
**GET** `/nemis/export/:schoolId/:reportType?academicYear=2024`

Export report as CSV file.

**Report Types:** `enrollment`, `teachers`

**Example:** `/nemis/export/school_1/enrollment?academicYear=2024`

Returns CSV file for download.

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

No rate limiting is currently implemented. Recommended for production:
- 100 requests per minute for authenticated users
- 10 requests per minute for unauthenticated endpoints

---

## Webhooks (Future)

Planned webhook events:
- `admission.approved` - When admission is approved
- `grade.created` - When new grade is added
- `report_card.generated` - When CBC report card is generated
- `payment.received` - When M-Pesa payment is received

---

## API Versioning

Current version: **v1** (implicit)

Future versions will use URL versioning: `/api/v2/...`

---

## Support

For API issues, please contact: tech@school.example.com

## Changelog

### v1.0.0 (2024-11-15)
- Initial release
- CBC Report Cards API
- Gradebook API
- Events & Calendar API
- Timetable API with conflict detection
- Admissions workflow API
- Meal Planning API
- NEMIS Integration API
