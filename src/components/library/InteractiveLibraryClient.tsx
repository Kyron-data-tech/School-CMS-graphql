"use client";

import { useState } from "react";
import { StatCard, Empty } from "@/components/ui";

export interface LibraryBookItem {
  id: string;
  title: string;
  author: string;
  isbn?: string | null;
  category: string;
  shelfLocation?: string | null;
  totalCopies: number;
  availableCopies: number;
}

export interface LibraryBorrowItem {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  fineAmount?: number | null;
  status: string; // "BORROWED" | "RETURNED" | "OVERDUE"
  remarks?: string | null;
}

interface InteractiveLibraryClientProps {
  books: LibraryBookItem[];
  borrows: LibraryBorrowItem[];
  myBorrows: LibraryBorrowItem[];
  userRole: string;
  canManage: boolean;
}

export function InteractiveLibraryClient({
  books: initialBooks,
  borrows: initialBorrows,
  myBorrows: initialMyBorrows,
  userRole,
  canManage,
}: InteractiveLibraryClientProps) {
  const [books, setBooks] = useState<LibraryBookItem[]>(initialBooks);
  const [borrows, setBorrows] = useState<LibraryBorrowItem[]>(initialBorrows);
  const [myBorrows, setMyBorrows] = useState<LibraryBorrowItem[]>(initialMyBorrows);

  const [activeTab, setActiveTab] = useState<"catalog" | "circulation" | "myBorrows">(
    myBorrows.length > 0 ? "myBorrows" : "catalog"
  );
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);

  // New book state
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "Science",
    shelfLocation: "Rack A-01",
    totalCopies: 3,
  });

  // New borrow issue state
  const [issueData, setIssueData] = useState({
    bookId: initialBooks[0]?.id || "",
    studentName: "",
    studentAdm: "",
    days: 14,
  });

  const categories = [
    "ALL",
    ...Array.from(new Set(books.map((b) => b.category))),
  ];

  const filteredBooks = books.filter((b) => {
    const q = search.toLowerCase();
    const matchesSearch =
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      (b.isbn && b.isbn.toLowerCase().includes(q)) ||
      (b.shelfLocation && b.shelfLocation.toLowerCase().includes(q));
    const matchesCategory =
      selectedCategory === "ALL" || b.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalTitles = books.length;
  const totalCopies = books.reduce((s, b) => s + b.totalCopies, 0);
  const availableCopies = books.reduce((s, b) => s + b.availableCopies, 0);
  const issuedCopies = totalCopies - availableCopies;
  const overdueCount = borrows.filter((b) => b.status === "OVERDUE").length;

  const handleReturnBook = (borrowId: string, bookId: string) => {
    setBorrows(
      borrows.map((b) =>
        b.id === borrowId
          ? { ...b, status: "RETURNED", returnedAt: new Date().toISOString().split("T")[0] }
          : b
      )
    );
    setMyBorrows(
      myBorrows.map((b) =>
        b.id === borrowId
          ? { ...b, status: "RETURNED", returnedAt: new Date().toISOString().split("T")[0] }
          : b
      )
    );
    // increment available copies for the book
    setBooks(
      books.map((b) =>
        b.id === bookId
          ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) }
          : b
      )
    );
  };

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author) return;

    const created: LibraryBookItem = {
      id: `bk-${Date.now()}`,
      title: newBook.title,
      author: newBook.author,
      isbn: newBook.isbn || `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      category: newBook.category,
      shelfLocation: newBook.shelfLocation || "Rack A-01",
      totalCopies: Number(newBook.totalCopies) || 1,
      availableCopies: Number(newBook.totalCopies) || 1,
    };

    setBooks([created, ...books]);
    setShowAddBookModal(false);
    setNewBook({
      title: "",
      author: "",
      isbn: "",
      category: "Science",
      shelfLocation: "Rack A-01",
      totalCopies: 3,
    });
  };

  const handleIssueBook = (e: React.FormEvent) => {
    e.preventDefault();
    const book = books.find((b) => b.id === issueData.bookId);
    if (!book || book.availableCopies <= 0) return;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(issueData.days || 14));

    const newBorrow: LibraryBorrowItem = {
      id: `bor-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      studentId: `std-${Date.now()}`,
      studentName: issueData.studentName || "Student",
      borrowedAt: new Date().toISOString().split("T")[0],
      dueDate: dueDate.toISOString().split("T")[0],
      status: "BORROWED",
    };

    setBorrows([newBorrow, ...borrows]);
    setBooks(
      books.map((b) =>
        b.id === book.id
          ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) }
          : b
      )
    );
    setShowIssueModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Catalog Titles"
          value={totalTitles}
          hint={`${totalCopies} physical copies`}
          icon="📚"
        />
        <StatCard
          label="Available on Shelf"
          value={availableCopies}
          hint={`${issuedCopies} currently issued`}
          icon="✅"
        />
        <StatCard
          label="Active Circulations"
          value={issuedCopies}
          hint="Checked out by students"
          icon="📖"
        />
        <StatCard
          label="Overdue Returns"
          value={overdueCount}
          hint={overdueCount > 0 ? "Requires recall notice" : "No overdue items"}
          icon="⚠️"
          trend={overdueCount > 0 ? { value: `${overdueCount} Overdue`, positive: false } : undefined}
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          {myBorrows.length > 0 && (
            <button
              onClick={() => setActiveTab("myBorrows")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === "myBorrows"
                  ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              My Borrowed Books ({myBorrows.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab("catalog")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "catalog"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Library Catalog ({books.length})
          </button>
          <button
            onClick={() => setActiveTab("circulation")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "circulation"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Circulation Ledger ({borrows.length})
          </button>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowIssueModal(true)}
              className="rounded-xl border border-brand-700/60 bg-brand-950/80 hover:bg-brand-900/80 text-brand-300 px-3.5 py-2 text-xs font-bold shadow-subtle transition-all"
            >
              📖 Issue Book
            </button>
            <button
              onClick={() => setShowAddBookModal(true)}
              className="rounded-xl bg-brand-600 hover:bg-brand-500 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition-all"
            >
              + Add New Book
            </button>
          </div>
        )}
      </div>

      {/* MY BORROWS TAB */}
      {activeTab === "myBorrows" && (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-brand-800/60 bg-brand-950/40 p-5">
            <h3 className="text-sm font-black text-white font-display">
              Your Active Book Borrowings
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Keep track of return due dates to prevent library overdue fines (₹5/day).
            </p>
          </div>

          {myBorrows.length === 0 ? (
            <Empty title="You have no borrowed books currently">
              Browse the catalog to find reference texts and issue them from the campus library desk.
            </Empty>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myBorrows.map((rec) => {
                const isOverdue = rec.status === "OVERDUE";
                const isReturned = rec.status === "RETURNED";
                return (
                  <div
                    key={rec.id}
                    className="card p-5 flex flex-col justify-between hover:border-slate-700 transition-all bg-slate-900/90 border border-slate-800"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-mono text-[11px] font-bold text-slate-400">
                          ID: {rec.id}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                            isReturned
                              ? "bg-slate-800 text-slate-400 border border-slate-700"
                              : isOverdue
                              ? "bg-rose-950/80 text-rose-400 border border-rose-800/60"
                              : "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>

                      <h4 className="mt-2 text-base font-bold text-white font-display">
                        {rec.bookTitle}
                      </h4>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Borrowed On
                          </p>
                          <p className="font-semibold text-slate-200">
                            {rec.borrowedAt}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Due Date
                          </p>
                          <p
                            className={`font-black ${
                              isOverdue ? "text-rose-400" : "text-white"
                            }`}
                          >
                            {rec.dueDate}
                          </p>
                        </div>
                      </div>
                    </div>

                    {!isReturned && (
                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {isOverdue ? "⚠️ Overdue Notice" : "Standard 14-day lending period"}
                        </span>
                        <button
                          onClick={() => handleReturnBook(rec.id, rec.bookId)}
                          className="rounded-lg bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition-all"
                        >
                          Mark as Returned
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CATALOG TAB */}
      {activeTab === "catalog" && (
        <div className="space-y-4">
          {/* Search & Category Pills */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by book title, author, ISBN, or rack..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs font-medium text-white placeholder-slate-500 shadow-sm focus:border-brand-500 focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                    selectedCategory === cat
                      ? "bg-brand-600 text-white"
                      : "bg-slate-900/70 text-slate-300 hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Book Cards Grid */}
          {filteredBooks.length === 0 ? (
            <Empty title="No books found in this category">
              Try changing the search query or category filter.
            </Empty>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBooks.map((book) => {
                const isOutOfStock = book.availableCopies === 0;
                return (
                  <div
                    key={book.id}
                    className="card p-5 flex flex-col justify-between hover:border-slate-700 hover:shadow-card-hover transition-all bg-slate-900/90 border border-slate-800"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="rounded-lg bg-indigo-950/80 px-2 py-0.5 text-[10px] font-black uppercase text-indigo-300 border border-indigo-800/60">
                          {book.category}
                        </span>
                        {book.shelfLocation && (
                          <span className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-300">
                            📍 {book.shelfLocation}
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-white font-display line-clamp-2">
                        {book.title}
                      </h4>
                      <p className="mt-1 text-xs text-slate-300 font-medium">
                        by <span className="font-bold text-white">{book.author}</span>
                      </p>

                      {book.isbn && (
                        <p className="mt-2 font-mono text-[10px] text-slate-400">
                          ISBN: {book.isbn}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-slate-400 font-medium">Availability:</span>
                        <span
                          className={`font-black ${
                            isOutOfStock ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {book.availableCopies} of {book.totalCopies} Available
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isOutOfStock
                              ? "bg-rose-500"
                              : book.availableCopies === 1
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${(book.availableCopies / book.totalCopies) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CIRCULATION TAB */}
      {activeTab === "circulation" && (
        <div className="card overflow-hidden border border-slate-800 bg-slate-900/90">
          <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 font-display">
              School-wide Circulation Ledger
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              {borrows.length} total records logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Book Title</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Borrow Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {borrows.map((b) => {
                  const isReturned = b.status === "RETURNED";
                  const isOverdue = b.status === "OVERDUE";
                  return (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-white">
                        {b.bookTitle}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-200">
                        {b.studentName}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{b.borrowedAt}</td>
                      <td className="px-4 py-3 font-semibold text-slate-200">
                        {b.dueDate}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                            isReturned
                              ? "bg-slate-800 text-slate-400 border border-slate-700"
                              : isOverdue
                              ? "bg-rose-950/80 text-rose-400 border border-rose-800/60"
                              : "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isReturned ? (
                          <button
                            onClick={() => handleReturnBook(b.id, b.bookId)}
                            className="rounded-lg bg-brand-600 hover:bg-brand-500 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm transition-all"
                          >
                            Mark Returned
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">
                            Returned on {b.returnedAt || "Record"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      {showAddBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-display">
                Add Book to Catalog
              </h3>
              <button
                onClick={() => setShowAddBookModal(false)}
                className="text-slate-400 hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fundamentals of Physics"
                  value={newBook.title}
                  onChange={(e) =>
                    setNewBook({ ...newBook, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Author *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Halliday & Resnick"
                  value={newBook.author}
                  onChange={(e) =>
                    setNewBook({ ...newBook, author: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newBook.category}
                    onChange={(e) =>
                      setNewBook({ ...newBook, category: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  >
                    <option value="Science">Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Literature">Literature</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="History">History</option>
                    <option value="General Reference">General Reference</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Shelf Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rack S-05"
                    value={newBook.shelfLocation}
                    onChange={(e) =>
                      setNewBook({ ...newBook, shelfLocation: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    ISBN
                  </label>
                  <input
                    type="text"
                    placeholder="978-..."
                    value={newBook.isbn}
                    onChange={(e) =>
                      setNewBook({ ...newBook, isbn: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Total Copies
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newBook.totalCopies}
                    onChange={(e) =>
                      setNewBook({
                        ...newBook,
                        totalCopies: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddBookModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 text-xs font-bold shadow-sm"
                >
                  Save to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Book Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-display">
                Issue Book to Student
              </h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueBook} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Select Book *
                </label>
                <select
                  value={issueData.bookId}
                  onChange={(e) =>
                    setIssueData({ ...issueData, bookId: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                >
                  {books
                    .filter((b) => b.availableCopies > 0)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.availableCopies} available)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun Mehta"
                  value={issueData.studentName}
                  onChange={(e) =>
                    setIssueData({ ...issueData, studentName: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Admission No
                  </label>
                  <input
                    type="text"
                    placeholder="ADM-8001"
                    value={issueData.studentAdm}
                    onChange={(e) =>
                      setIssueData({ ...issueData, studentAdm: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Loan Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={issueData.days}
                    onChange={(e) =>
                      setIssueData({ ...issueData, days: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 text-xs font-bold shadow-sm"
                >
                  Confirm Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
