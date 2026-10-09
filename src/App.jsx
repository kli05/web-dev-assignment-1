import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

const startingBooks = [
  { id: 1, title: "Things Fall Apart", author: "Chinua Achebe", genre: "Fiction", isbn: "9780435905255", quantity: 4 },
  { id: 2, title: "Long Walk to Freedom", author: "Nelson Mandela", genre: "Biography", isbn: "9780316548182", quantity: 1 },
  { id: 3, title: "Animal Farm", author: "George Orwell", genre: "Political Fiction", isbn: "9780451526342", quantity: 2 }
];

function readData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function Layout({ children, onLogout }) {
  const location = useLocation();
  const links = [
    { path: "/", label: "Dashboard" },
    { path: "/books", label: "Book Management" },
    { path: "/transactions", label: "Transactions" },
    { path: "/users", label: "User Management" }
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <span>COMMUNITY LIBRARY</span>
          <h2>Maluti Library</h2>
        </div>
        <nav>
          {links.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? "nav-link active" : "nav-link"}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button className="logout-button" onClick={onLogout}>Log out</button>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}

function PageHeading({ title, description }) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}

function Status({ quantity }) {
  return (
    <span className={quantity < 2 ? "status low" : "status"}>
      {quantity < 2 ? "Low stock" : "In stock"}
    </span>
  );
}

function BookTable({ books, showActions = false, onEdit, onDelete }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Genre</th>
            <th>ISBN</th>
            <th>Quantity</th>
            <th>Status</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {books.length === 0 ? (
            <tr><td colSpan={showActions ? 7 : 6} className="empty">No books found.</td></tr>
          ) : (
            books.map((book) => (
              <tr key={book.id}>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>{book.genre}</td>
                <td>{book.isbn}</td>
                <td>{book.quantity}</td>
                <td><Status quantity={book.quantity} /></td>
                {showActions && (
                  <td className="table-actions">
                    <button className="button button-green button-small" onClick={() => onEdit(book)}>Edit</button>
                    <button className="button button-red button-small" onClick={() => onDelete(book.id)}>Delete</button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function TransactionTable({ transactions }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr><th>Date</th><th>Book</th><th>Type</th><th>Quantity</th><th>Note</th></tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr><td colSpan="5" className="empty">No transactions recorded yet.</td></tr>
          ) : (
            transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.date}</td>
                <td>{transaction.bookTitle}</td>
                <td>{transaction.type}</td>
                <td>{transaction.quantity}</td>
                <td>{transaction.note || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function Dashboard({ books, users, transactions }) {
  const copies = books.reduce((total, book) => total + Number(book.quantity), 0);
  const lowStock = books.filter((book) => book.quantity < 2).length;

  return (
    <>
      <PageHeading title="Dashboard" description="An overview of your library collection." />
      <section className="stat-grid">
        <div className="stat-card"><strong>{books.length}</strong><span>Book titles</span></div>
        <div className="stat-card"><strong>{copies}</strong><span>Copies in stock</span></div>
        <div className="stat-card"><strong>{users.length}</strong><span>Registered users</span></div>
        <div className={lowStock ? "stat-card stat-warning" : "stat-card"}><strong>{lowStock}</strong><span>Low-stock titles</span></div>
      </section>
      <section className="panel">
        <div className="panel-heading"><h2>Book Availability</h2><span className="muted">Low stock means fewer than 2 copies</span></div>
        <BookTable books={books} />
      </section>
      <section className="panel">
        <h2>Recent Transactions</h2>
        <TransactionTable transactions={transactions.slice(0, 5)} />
      </section>
    </>
  );
}

function BooksPage({ books, setBooks }) {
  const emptyForm = { title: "", author: "", genre: "", isbn: "", quantity: "1" };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function submitBook(event) {
    event.preventDefault();
    setError("");
    const quantity = Number(form.quantity);

    if (!Number.isInteger(quantity) || quantity < 0) {
      setError("Quantity must be a whole number of 0 or more.");
      return;
    }

    if (books.some((book) => book.isbn === form.isbn.trim() && book.id !== editingId)) {
      setError("A book with this ISBN already exists.");
      return;
    }

    const newBook = {
      id: editingId || Date.now(),
      title: form.title.trim(),
      author: form.author.trim(),
      genre: form.genre.trim(),
      isbn: form.isbn.trim(),
      quantity
    };

    setBooks(editingId
      ? books.map((book) => book.id === editingId ? newBook : book)
      : [...books, newBook]
    );
    setForm(emptyForm);
    setEditingId(null);
  }

  function editBook(book) {
    setForm({ ...book, quantity: String(book.quantity) });
    setEditingId(book.id);
    setError("");
    window.scrollTo(0, 0);
  }

  function deleteBook(id) {
    if (window.confirm("Delete this book?")) {
      setBooks(books.filter((book) => book.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
    }
  }

  const filteredBooks = books.filter((book) =>
    `${book.title} ${book.author} ${book.isbn}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeading title="Book Management" description="Add, update, search and remove books." />
      <section className="panel">
        <h2>{editingId ? "Update Book" : "Add a Book"}</h2>
        <form onSubmit={submitBook}>
          <div className="form-grid">
            <label>Title<input name="title" value={form.title} onChange={updateField} required /></label>
            <label>Author<input name="author" value={form.author} onChange={updateField} required /></label>
            <label>Genre<input name="genre" value={form.genre} onChange={updateField} required /></label>
            <label>ISBN<input name="isbn" value={form.isbn} onChange={updateField} required /></label>
            <label>Quantity<input name="quantity" type="number" min="0" step="1" value={form.quantity} onChange={updateField} required /></label>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="button-row">
            <button className="button" type="submit">{editingId ? "Save Changes" : "Add Book"}</button>
            {editingId && <button className="button button-light" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); setError(""); }}>Cancel</button>}
          </div>
        </form>
      </section>
      <section className="panel">
        <div className="panel-heading panel-heading-wrap">
          <h2>Books in the Library</h2>
          <input className="search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, author or ISBN" />
        </div>
        <BookTable books={filteredBooks} showActions onEdit={editBook} onDelete={deleteBook} />
      </section>
    </>
  );
}

function TransactionsPage({ books, setBooks, transactions, setTransactions }) {
  const [form, setForm] = useState({ bookId: books[0]?.id || "", type: "Borrow", quantity: "1", note: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!books.some((book) => book.id === Number(form.bookId))) {
      setForm((old) => ({ ...old, bookId: books[0]?.id || "" }));
    }
  }, [books, form.bookId]);

  function submitTransaction(event) {
    event.preventDefault();
    setError("");
    const book = books.find((item) => item.id === Number(form.bookId));
    const quantity = Number(form.quantity);

    if (!book) {
      setError("Add a book before recording a transaction.");
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      setError("Quantity must be at least 1.");
      return;
    }
    if (form.type === "Borrow" && quantity > book.quantity) {
      setError("There are not enough copies in stock.");
      return;
    }

    setBooks(books.map((item) => item.id === book.id
      ? { ...item, quantity: form.type === "Borrow" ? item.quantity - quantity : item.quantity + quantity }
      : item
    ));
    setTransactions([{
      id: Date.now(),
      date: new Date().toLocaleString(),
      bookTitle: book.title,
      type: form.type,
      quantity,
      note: form.note.trim()
    }, ...transactions]);
    setForm({ bookId: book.id, type: "Borrow", quantity: "1", note: "" });
  }

  return (
    <>
      <PageHeading title="Transactions" description="Record borrowed books and new stock arrivals." />
      <section className="panel">
        <h2>Record a Transaction</h2>
        {books.length === 0 && <p className="notice">Add a book first on the Book Management page.</p>}
        <form onSubmit={submitTransaction}>
          <div className="form-grid">
            <label>Book
              <select value={form.bookId} onChange={(event) => setForm({ ...form, bookId: event.target.value })} required>
                {books.map((book) => <option key={book.id} value={book.id}>{book.title} — {book.quantity} in stock</option>)}
              </select>
            </label>
            <label>Transaction type
              <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                <option>Borrow</option><option>Stock added</option>
              </select>
            </label>
            <label>Quantity<input type="number" min="1" step="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required /></label>
            <label>Note<input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Optional note" /></label>
          </div>
          {error && <p className="error">{error}</p>}
          <button className="button" type="submit" disabled={books.length === 0}>Save Transaction</button>
        </form>
      </section>
      <section className="panel"><h2>Transaction History</h2><TransactionTable transactions={transactions} /></section>
    </>
  );
}

function UsersPage({ users, setUsers }) {
  const emptyForm = { name: "", membershipId: "", role: "Member" };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  function submitUser(event) {
    event.preventDefault();
    setError("");
    const membershipId = form.membershipId.trim();

    if (users.some((user) => user.membershipId.toLowerCase() === membershipId.toLowerCase() && user.id !== editingId)) {
      setError("That membership ID is already in use.");
      return;
    }

    const newUser = { id: editingId || Date.now(), name: form.name.trim(), membershipId, role: form.role };
    setUsers(editingId
      ? users.map((user) => user.id === editingId ? newUser : user)
      : [...users, newUser]
    );
    setForm(emptyForm);
    setEditingId(null);
  }

  function editUser(user) {
    setForm({ name: user.name, membershipId: user.membershipId, role: user.role });
    setEditingId(user.id);
    setError("");
  }

  function deleteUser(id) {
    if (window.confirm("Delete this user?")) {
      setUsers(users.filter((user) => user.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
    }
  }

  return (
    <>
      <PageHeading title="User Management" description="Manage library members and their roles." />
      <section className="panel">
        <h2>{editingId ? "Update User" : "Add a User"}</h2>
        <form onSubmit={submitUser}>
          <div className="form-grid">
            <label>Full name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
            <label>Membership ID<input value={form.membershipId} onChange={(event) => setForm({ ...form, membershipId: event.target.value })} required /></label>
            <label>Role
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                <option>Member</option><option>Librarian</option><option>Admin</option>
              </select>
            </label>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="button-row">
            <button className="button" type="submit">{editingId ? "Save Changes" : "Add User"}</button>
            {editingId && <button className="button button-light" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); setError(""); }}>Cancel</button>}
          </div>
        </form>
      </section>
      <section className="panel">
        <h2>Registered Users</h2>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Name</th><th>Membership ID</th><th>Role</th><th>Actions</th></tr></thead>
            <tbody>
              {users.length === 0 ? <tr><td colSpan="4" className="empty">No users registered.</td></tr> : users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td><td>{user.membershipId}</td><td>{user.role}</td>
                  <td className="table-actions">
                    <button className="button button-green button-small" onClick={() => editUser(user)}>Edit</button>
                    <button className="button button-red button-small" onClick={() => deleteUser(user.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    if (username === "admin" && password === "admin123") {
      onLogin();
    } else {
      setError("Incorrect username or password.");
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <span className="eyebrow">COMMUNITY LIBRARY</span>
        <h1>Maluti Library</h1>
        <p>Sign in to manage books, stock and library members.</p>
        <label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {error && <p className="error">{error}</p>}
        <button className="button button-green login-submit">Sign in</button>
        <p className="muted">Demo login: admin / admin123</p>
      </form>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(sessionStorage.getItem("maluti_logged_in") === "yes");
  const [books, setBooks] = useState(() => readData("maluti_books", startingBooks));
  const [users, setUsers] = useState(() => readData("maluti_users", [
    { id: 1, name: "Library Administrator", membershipId: "LIB001", role: "Admin" }
  ]));
  const [transactions, setTransactions] = useState(() => readData("maluti_transactions", []));
  const navigate = useNavigate();

  useEffect(() => localStorage.setItem("maluti_books", JSON.stringify(books)), [books]);
  useEffect(() => localStorage.setItem("maluti_users", JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem("maluti_transactions", JSON.stringify(transactions)), [transactions]);

  function login() {
    sessionStorage.setItem("maluti_logged_in", "yes");
    setLoggedIn(true);
    navigate("/");
  }

  function logout() {
    sessionStorage.removeItem("maluti_logged_in");
    setLoggedIn(false);
    navigate("/");
  }

  if (!loggedIn) return <Login onLogin={login} />;

  return (
    <Layout onLogout={logout}>
      <Routes>
        <Route path="/" element={<Dashboard books={books} users={users} transactions={transactions} />} />
        <Route path="/books" element={<BooksPage books={books} setBooks={setBooks} />} />
        <Route path="/transactions" element={<TransactionsPage books={books} setBooks={setBooks} transactions={transactions} setTransactions={setTransactions} />} />
        <Route path="/users" element={<UsersPage users={users} setUsers={setUsers} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
