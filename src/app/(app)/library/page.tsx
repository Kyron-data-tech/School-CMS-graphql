import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import {
  InteractiveLibraryClient,
  type LibraryBookItem,
  type LibraryBorrowItem,
} from "@/components/library/InteractiveLibraryClient";

export default async function LibraryPage() {
  const ctx = (await getAuthContext())!;

  const canManage = Boolean(
    ctx.roleKeys.includes("headmaster") ||
      ctx.roleKeys.includes("admin") ||
      ctx.roleKeys.includes("librarian") ||
      ctx.roleKeys.includes("HEADMASTER") ||
      ctx.roleKeys.includes("ADMIN")
  );

  let booksData: LibraryBookItem[] = [];
  let borrowsData: LibraryBorrowItem[] = [];
  let myBorrowsData: LibraryBorrowItem[] = [];

  try {
    const [books, borrows] = await Promise.all([
      db.libraryBook.findMany({
        where: { schoolId: ctx.schoolId },
        orderBy: { title: "asc" },
      }),
      db.libraryBorrowRecord.findMany({
        where: { book: { schoolId: ctx.schoolId } },
        include: {
          book: true,
          student: true,
        },
        orderBy: { borrowedAt: "desc" },
      }),
    ]);

    booksData = books.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      isbn: b.isbn,
      category: b.category,
      shelfLocation: b.shelfLocation,
      totalCopies: b.totalCopies,
      availableCopies: b.availableCopies,
    }));

    borrowsData = borrows.map((br) => ({
      id: br.id,
      bookId: br.bookId,
      bookTitle: br.book.title,
      studentId: br.studentId,
      studentName: `${br.student.firstName} ${br.student.lastName}`,
      borrowedAt: br.borrowedAt.toISOString().split("T")[0],
      dueDate: br.dueDate.toISOString().split("T")[0],
      returnedAt: br.returnedAt ? br.returnedAt.toISOString().split("T")[0] : null,
      fineAmount: br.fineAmount ? Number(br.fineAmount) : null,
      status: br.status,
      remarks: br.remarks,
    }));

    // Target student if viewing as student or guardian
    const targetStudentId =
      ctx.studentId || (ctx.childStudentIds.length > 0 ? ctx.childStudentIds[0] : null);

    if (targetStudentId) {
      myBorrowsData = borrowsData.filter((b) => b.studentId === targetStudentId);
    }
  } catch (err) {
    // Offline / Demo Fallback
    booksData = [
      {
        id: "bk-01",
        title: "Concepts of Physics - Vol 1",
        author: "H.C. Verma",
        isbn: "978-8177091878",
        category: "Science",
        shelfLocation: "Rack S-04",
        totalCopies: 5,
        availableCopies: 4,
      },
      {
        id: "bk-02",
        title: "Higher Algebra",
        author: "Hall & Knight",
        isbn: "978-9351441311",
        category: "Mathematics",
        shelfLocation: "Rack M-02",
        totalCopies: 4,
        availableCopies: 3,
      },
      {
        id: "bk-03",
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        isbn: "978-0061120084",
        category: "Literature",
        shelfLocation: "Rack L-11",
        totalCopies: 3,
        availableCopies: 3,
      },
      {
        id: "bk-04",
        title: "A Brief History of Time",
        author: "Stephen Hawking",
        isbn: "978-0553380163",
        category: "Science",
        shelfLocation: "Rack S-09",
        totalCopies: 4,
        availableCopies: 4,
      },
      {
        id: "bk-05",
        title: "Computer Organization and Design",
        author: "Patterson & Hennessy",
        isbn: "978-0128122754",
        category: "Computer Science",
        shelfLocation: "Rack CS-01",
        totalCopies: 3,
        availableCopies: 2,
      },
      {
        id: "bk-06",
        title: "India: After Gandhi",
        author: "Ramachandra Guha",
        isbn: "978-9382618959",
        category: "History",
        shelfLocation: "Rack H-07",
        totalCopies: 3,
        availableCopies: 3,
      },
    ];

    borrowsData = [
      {
        id: "bor-01",
        bookId: "bk-01",
        bookTitle: "Concepts of Physics - Vol 1",
        studentId: "std-01",
        studentName: "Arjun Mehta",
        borrowedAt: "2026-09-24",
        dueDate: "2026-10-08",
        status: "BORROWED",
        remarks: "Class 8 physics project reference",
      },
      {
        id: "bor-02",
        bookId: "bk-02",
        bookTitle: "Higher Algebra",
        studentId: "std-02",
        studentName: "Sara Kapoor",
        borrowedAt: "2026-09-20",
        dueDate: "2026-10-04",
        status: "BORROWED",
      },
      {
        id: "bor-03",
        bookId: "bk-05",
        bookTitle: "Computer Organization and Design",
        studentId: "std-03",
        studentName: "Kabir Shah",
        borrowedAt: "2026-09-10",
        dueDate: "2026-09-24",
        returnedAt: "2026-09-23",
        status: "RETURNED",
      },
      {
        id: "bor-04",
        bookId: "bk-04",
        bookTitle: "A Brief History of Time",
        studentId: "std-04",
        studentName: "Anaya Verma",
        borrowedAt: "2026-09-01",
        dueDate: "2026-09-15",
        status: "OVERDUE",
        fineAmount: 85,
      },
    ];

    if (ctx.studentId || ctx.roleKeys.includes("student")) {
      myBorrowsData = [
        {
          id: "bor-01",
          bookId: "bk-01",
          bookTitle: "Concepts of Physics - Vol 1",
          studentId: "std-01",
          studentName: ctx.name || "Arjun Mehta",
          borrowedAt: "2026-09-24",
          dueDate: "2026-10-08",
          status: "BORROWED",
          remarks: "Class 8 physics project reference",
        },
      ];
    }
  }

  const primaryRole = ctx.roleKeys[0] || "student";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library & Knowledge Repository"
        subtitle="Catalog discovery, shelf rack locators, student lending circulation, and book returns"
      />

      <InteractiveLibraryClient
        books={booksData}
        borrows={borrowsData}
        myBorrows={myBorrowsData}
        userRole={primaryRole}
        canManage={canManage}
      />
    </div>
  );
}
