export const typeDefs = /* GraphQL */ `
  enum Gender {
    MALE
    FEMALE
    OTHER
    UNSPECIFIED
  }

  enum AttendanceStatus {
    PRESENT
    ABSENT
    LATE
    EXCUSED
    HALF_DAY
    LEAVE
  }

  enum ResultStatus {
    DRAFT
    TEACHER_ENTRY
    SUBMITTED
    REVIEWED
    APPROVED
    PUBLISHED
  }

  enum SubmissionStatus {
    ASSIGNED
    SUBMITTED
    LATE
    REVIEWED
    MISSING
  }

  enum Audience {
    PUBLIC
    ALL_USERS
    TEACHERS
    STAFF
    STUDENTS
    PARENTS
    ROLE
    SECTION
    ADMIN_ONLY
  }

  # ── Organization & Academic Structure ──

  type School {
    id: ID!
    name: String!
    shortName: String
    email: String
    phone: String
    address: String
    timezone: String!
    brandColor: String
    academicYears: [AcademicYear!]
    grades: [Grade!]
    subjects: [Subject!]
  }

  type AcademicYear {
    id: ID!
    name: String!
    startDate: String!
    endDate: String!
    isCurrent: Boolean!
    archived: Boolean!
  }

  type Grade {
    id: ID!
    name: String!
    level: Int!
    sections: [Section!]
  }

  type Section {
    id: ID!
    name: String!
    gradeId: String!
    academicYearId: String!
    grade: Grade
    academicYear: AcademicYear
    enrollments: [Enrollment!]
    offerings: [SubjectOffering!]
  }

  type Subject {
    id: ID!
    name: String!
    code: String
  }

  type SubjectOffering {
    id: ID!
    sectionId: String!
    subjectId: String!
    subject: Subject!
    section: Section!
    teacherAssignments: [TeacherAssignment!]
  }

  type Room {
    id: ID!
    name: String!
    capacity: Int
  }

  # ── People & Governance ──

  type Teacher {
    id: ID!
    employeeId: String!
    firstName: String!
    lastName: String!
    fullName: String!
    designation: String
    phone: String
    isActive: Boolean!
    userEmail: String
    assignments: [TeacherAssignment!]
    classTeacherOf: [ClassTeacherAssignment!]
  }

  type TeacherAssignment {
    id: ID!
    teacherId: String!
    offeringId: String!
    startDate: String!
    endDate: String
    teacher: Teacher
    offering: SubjectOffering
  }

  type ClassTeacherAssignment {
    id: ID!
    teacherId: String!
    sectionId: String!
    startDate: String!
    endDate: String
    section: Section
  }

  type GuardianInfo {
    id: ID!
    name: String!
    relationship: String
    phone: String
    email: String
  }

  type Enrollment {
    id: ID!
    rollNumber: Int
    status: String!
    startDate: String!
    endDate: String
    section: Section
    academicYear: AcademicYear
  }

  type Student {
    id: ID!
    schoolId: String!
    admissionNo: String!
    studentCode: String
    firstName: String!
    lastName: String!
    fullName: String!
    gender: String!
    photoUrl: String
    dateOfBirth: String
    admissionDate: String
    archived: Boolean!
    createdAt: String!
    currentClass: String
    enrollments: [Enrollment!]!
    guardians: [GuardianInfo!]!
    attendanceSummary: AttendanceSummary
  }

  type AttendanceSummary {
    totalDays: Int!
    presentDays: Int!
    percentage: Float!
  }

  # ── Academic Operations ──

  type StudentAttendance {
    id: ID!
    studentId: String!
    sectionId: String!
    date: String!
    status: AttendanceStatus!
    note: String
    student: Student
  }

  type Homework {
    id: ID!
    title: String!
    description: String
    maxMarks: Int
    dueAt: String!
    publishAt: String!
    offering: SubjectOffering!
    submissions: [HomeworkSubmission!]
  }

  type HomeworkSubmission {
    id: ID!
    homeworkId: String!
    studentId: String!
    status: SubmissionStatus!
    submittedAt: String
    comment: String
    marks: Int
    feedback: String
    student: Student
    homework: Homework
  }

  type Exam {
    id: ID!
    name: String!
    academicYearId: String!
    examSubjects: [ExamSubject!]
  }

  type ExamSubject {
    id: ID!
    examId: String!
    offeringId: String!
    maxMarks: Int!
    passingMarks: Int!
    date: String
    exam: Exam!
    offering: SubjectOffering!
    results: [AssessmentResult!]
  }

  type AssessmentResult {
    id: ID!
    studentId: String!
    examSubjectId: String!
    marks: Float
    grade: String
    remarks: String
    status: ResultStatus!
    student: Student
    examSubject: ExamSubject
  }

  type TimetablePeriod {
    id: ID!
    name: String!
    sequence: Int!
    startTime: String!
    endTime: String!
  }

  type TimetableEntry {
    id: ID!
    sectionId: String!
    offeringId: String!
    periodId: String!
    dayOfWeek: Int!
    room: Room
    period: TimetablePeriod!
    offering: SubjectOffering!
    section: Section!
  }

  type Announcement {
    id: ID!
    title: String!
    body: String!
    audience: Audience!
    publishAt: String!
  }

  type AuditLog {
    id: ID!
    actorName: String!
    actorEmail: String!
    action: String!
    summary: String!
    createdAt: String!
  }

  # ── AI Copilot Types ──

  type AiResponse {
    success: Boolean!
    mode: String!
    text: String!
    provider: String!
    model: String
    timestamp: String!
  }

  type AiModelTestResponse {
    success: Boolean!
    message: String!
    latencyMs: Int!
    provider: String!
    model: String!
  }

  # ── Inputs ──

  input CreateStudentInput {
    firstName: String!
    lastName: String!
    admissionNo: String!
    studentCode: String
    gender: String
    dateOfBirth: String
    admissionDate: String
    sectionId: String
    rollNumber: Int
  }

  input UpdateStudentInput {
    firstName: String
    lastName: String
    gender: String
    dateOfBirth: String
    archived: Boolean
  }

  input CreateTeacherInput {
    firstName: String!
    lastName: String!
    employeeId: String!
    designation: String
    phone: String
    email: String!
  }

  input MarkAttendanceInput {
    studentId: String!
    sectionId: String!
    date: String!
    status: AttendanceStatus!
    note: String
  }

  input BulkAttendanceInput {
    sectionId: String!
    date: String!
    records: [StudentStatusInput!]!
  }

  input StudentStatusInput {
    studentId: String!
    status: AttendanceStatus!
    note: String
  }

  input CreateHomeworkInput {
    offeringId: String!
    title: String!
    description: String
    maxMarks: Int
    dueAt: String!
  }

  input SubmitHomeworkInput {
    homeworkId: String!
    studentId: String!
    comment: String
    fileUrl: String
  }

  input GradeHomeworkInput {
    submissionId: String!
    marks: Int!
    feedback: String
  }

  input RecordResultInput {
    examSubjectId: String!
    studentId: String!
    marks: Float!
    grade: String
    remarks: String
  }

  input CreateAnnouncementInput {
    title: String!
    body: String!
    audience: Audience!
  }

  input ResetPasswordInput {
    email: String!
    newPassword: String
  }

  type ResetPasswordPayload {
    success: Boolean!
    message: String!
    email: String!
    role: String
  }

  input AiRemarksInput {
    studentName: String!
    gradeLevel: String
    attendanceRate: String
    strengths: String
    areasToImprove: String
    tone: String
  }

  input AiQuizInput {
    subject: String!
    topic: String!
    gradeLevel: String
    questionCount: Int
  }

  input AiNoticeInput {
    topic: String!
    audience: String
    eventDate: String
    keyDetails: String
  }

  # ── ROOT QUERIES ──

  type Query {
    # Organization
    school: School
    academicYears: [AcademicYear!]!
    grades: [Grade!]!
    sections(gradeId: String, academicYearId: String): [Section!]!
    subjects: [Subject!]!
    subjectOfferings(sectionId: String): [SubjectOffering!]!

    # Students
    students(search: String, limit: Int, offset: Int, includeArchived: Boolean): [Student!]!
    student(id: ID!): Student
    totalStudents(search: String, includeArchived: Boolean): Int!

    # Faculty
    teachers(isActive: Boolean): [Teacher!]!
    teacher(id: ID!): Teacher
    totalTeachers: Int!

    # Operations
    studentAttendance(sectionId: String, date: String, studentId: String): [StudentAttendance!]!
    homeworks(offeringId: String, sectionId: String): [Homework!]!
    homework(id: ID!): Homework
    exams(academicYearId: String): [Exam!]!
    results(examSubjectId: String, studentId: String): [AssessmentResult!]!
    timetable(sectionId: String, dayOfWeek: Int): [TimetableEntry!]!
    announcements(audience: Audience, limit: Int): [Announcement!]!
    auditLogs(limit: Int): [AuditLog!]!

    # AI Diagnostics
    aiTestConnection(provider: String, modelName: String, baseUrl: String, apiKey: String): AiModelTestResponse!
  }

  # ── ROOT MUTATIONS ──

  type Mutation {
    # Students
    createStudent(input: CreateStudentInput!): Student!
    updateStudent(id: ID!, input: UpdateStudentInput!): Student!
    deleteStudent(id: ID!, permanent: Boolean): Boolean!

    # Faculty
    createTeacher(input: CreateTeacherInput!): Teacher!

    # Attendance
    markAttendance(input: MarkAttendanceInput!): StudentAttendance!
    markBulkAttendance(input: BulkAttendanceInput!): Int!

    # Homework
    createHomework(input: CreateHomeworkInput!): Homework!
    submitHomework(input: SubmitHomeworkInput!): HomeworkSubmission!
    gradeHomework(input: GradeHomeworkInput!): HomeworkSubmission!

    # Results & Marks
    recordAssessmentResult(input: RecordResultInput!): AssessmentResult!
    publishExamResults(examId: ID!): Int!

    # Announcements
    createAnnouncement(input: CreateAnnouncementInput!): Announcement!

    # Security
    resetPassword(input: ResetPasswordInput!): ResetPasswordPayload!

    # AI Copilot
    aiGenerateRemarks(input: AiRemarksInput!): AiResponse!
    aiGenerateQuiz(input: AiQuizInput!): AiResponse!
    aiGenerateNotice(input: AiNoticeInput!): AiResponse!
  }
`;
