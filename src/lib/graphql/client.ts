/**
 * Greenfield School CMS — Universal GraphQL Client
 * Handles client-side & server-side GraphQL execution with error handling and typing.
 */

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; locations?: any[]; path?: string[] }>;
}

export async function gqlRequest<T = any>(
  query: string,
  variables?: Record<string, any>,
  headers?: Record<string, string>
): Promise<T> {
  const endpoint =
    typeof window !== "undefined"
      ? "/api/graphql"
      : process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/graphql`
      : "http://localhost:3005/api/graphql";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GraphQL Network error (${res.status}): ${errorText}`);
  }

  const json: GraphQLResponse<T> = await res.json();

  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message || "GraphQL execution error");
  }

  return json.data as T;
}

// ── COMMON GRAPHQL QUERY STRINGS ──────────────────────────────────────────

export const GQL_QUERIES = {
  // Students
  GET_STUDENTS: /* GraphQL */ `
    query GetStudents($search: String, $limit: Int, $offset: Int) {
      students(search: $search, limit: $limit, offset: $offset) {
        id
        admissionNo
        firstName
        lastName
        fullName
        gender
        currentClass
        enrollments {
          id
          rollNumber
          status
          startDate
          section {
            id
            name
            grade {
              id
              name
            }
          }
        }
        guardians {
          id
          name
          relationship
          phone
          email
        }
        attendanceSummary {
          totalDays
          presentDays
          percentage
        }
      }
      totalStudents(search: $search)
    }
  `,

  GET_STUDENT_BY_ID: /* GraphQL */ `
    query GetStudentById($id: ID!) {
      student(id: $id) {
        id
        admissionNo
        firstName
        lastName
        fullName
        gender
        dateOfBirth
        admissionDate
        currentClass
        enrollments {
          id
          rollNumber
          status
          startDate
          section {
            id
            name
            grade {
              name
            }
          }
        }
        guardians {
          id
          name
          relationship
          phone
          email
        }
        attendanceSummary {
          totalDays
          presentDays
          percentage
        }
      }
    }
  `,

  // Academics & Sections
  GET_ACADEMIC_HIERARCHY: /* GraphQL */ `
    query GetAcademicHierarchy {
      school {
        name
        brandColor
      }
      grades {
        id
        name
        level
        sections {
          id
          name
        }
      }
      subjects {
        id
        name
        code
      }
    }
  `,

  // Faculty
  GET_TEACHERS: /* GraphQL */ `
    query GetTeachers($isActive: Boolean) {
      teachers(isActive: $isActive) {
        id
        employeeId
        firstName
        lastName
        fullName
        designation
        phone
        userEmail
        assignments {
          id
          offering {
            subject {
              name
            }
            section {
              name
              grade {
                name
              }
            }
          }
        }
      }
      totalTeachers
    }
  `,

  // Attendance
  GET_ATTENDANCE_REGISTER: /* GraphQL */ `
    query GetAttendanceRegister($sectionId: String, $date: String) {
      studentAttendance(sectionId: $sectionId, date: $date) {
        id
        studentId
        sectionId
        date
        status
        note
        student {
          id
          firstName
          lastName
          fullName
          admissionNo
        }
      }
    }
  `,

  // Homework
  GET_HOMEWORKS: /* GraphQL */ `
    query GetHomeworks($offeringId: String, $sectionId: String) {
      homeworks(offeringId: $offeringId, sectionId: $sectionId) {
        id
        title
        description
        maxMarks
        dueAt
        publishAt
        offering {
          id
          subject {
            name
          }
          section {
            name
            grade {
              name
            }
          }
        }
        submissions {
          id
          status
          submittedAt
          marks
          student {
            id
            fullName
          }
        }
      }
    }
  `,

  // Exams
  GET_EXAMS: /* GraphQL */ `
    query GetExams($academicYearId: String) {
      exams(academicYearId: $academicYearId) {
        id
        name
        examSubjects {
          id
          maxMarks
          passingMarks
          date
          offering {
            subject {
              name
            }
            section {
              name
              grade {
                name
              }
            }
          }
          results {
            id
            marks
            grade
            status
            student {
              id
              fullName
            }
          }
        }
      }
    }
  `,

  // Timetable
  GET_TIMETABLE: /* GraphQL */ `
    query GetTimetable($sectionId: String, $dayOfWeek: Int) {
      timetable(sectionId: $sectionId, dayOfWeek: $dayOfWeek) {
        id
        dayOfWeek
        period {
          sequence
          startTime
          endTime
        }
        offering {
          subject {
            name
          }
        }
        room {
          name
        }
      }
    }
  `,

  // Announcements
  GET_ANNOUNCEMENTS: /* GraphQL */ `
    query GetAnnouncements($limit: Int) {
      announcements(limit: $limit) {
        id
        title
        body
        audience
        publishAt
      }
    }
  `,
};

export const GQL_MUTATIONS = {
  CREATE_STUDENT: /* GraphQL */ `
    mutation CreateStudent($input: CreateStudentInput!) {
      createStudent(input: $input) {
        id
        admissionNo
        fullName
        currentClass
      }
    }
  `,

  MARK_ATTENDANCE: /* GraphQL */ `
    mutation MarkAttendance($input: MarkAttendanceInput!) {
      markAttendance(input: $input) {
        id
        status
        date
      }
    }
  `,

  MARK_BULK_ATTENDANCE: /* GraphQL */ `
    mutation MarkBulkAttendance($input: BulkAttendanceInput!) {
      markBulkAttendance(input: $input)
    }
  `,

  CREATE_HOMEWORK: /* GraphQL */ `
    mutation CreateHomework($input: CreateHomeworkInput!) {
      createHomework(input: $input) {
        id
        title
        dueAt
      }
    }
  `,

  SUBMIT_HOMEWORK: /* GraphQL */ `
    mutation SubmitHomework($input: SubmitHomeworkInput!) {
      submitHomework(input: $input) {
        id
        status
        submittedAt
      }
    }
  `,

  CREATE_ANNOUNCEMENT: /* GraphQL */ `
    mutation CreateAnnouncement($input: CreateAnnouncementInput!) {
      createAnnouncement(input: $input) {
        id
        title
        body
        audience
        publishAt
      }
    }
  `,

  RECORD_ASSESSMENT_RESULT: /* GraphQL */ `
    mutation RecordAssessmentResult($input: RecordResultInput!) {
      recordAssessmentResult(input: $input) {
        id
        marks
        grade
        remarks
        status
      }
    }
  `,

  PUBLISH_EXAM_RESULTS: /* GraphQL */ `
    mutation PublishExamResults($examId: ID!) {
      publishExamResults(examId: $examId)
    }
  `,

  AI_GENERATE_REMARKS: /* GraphQL */ `
    mutation AiGenerateRemarks($input: AiRemarksInput!) {
      aiGenerateRemarks(input: $input) {
        success
        text
        provider
        model
        timestamp
      }
    }
  `,

  AI_GENERATE_QUIZ: /* GraphQL */ `
    mutation AiGenerateQuiz($input: AiQuizInput!) {
      aiGenerateQuiz(input: $input) {
        success
        text
        provider
        model
        timestamp
      }
    }
  `,

  AI_GENERATE_NOTICE: /* GraphQL */ `
    mutation AiGenerateNotice($input: AiNoticeInput!) {
      aiGenerateNotice(input: $input) {
        success
        text
        provider
        model
        timestamp
      }
    }
  `,
};

