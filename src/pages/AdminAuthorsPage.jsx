import { useState, useEffect } from "react";
import { fetchAuthors, createAuthor, updateAuthor, deleteAuthor } from "../services/api.js";
import { Plus, Edit2, Trash2, Users } from "lucide-react";

export default function AdminAuthorsPage({ navigate }) {
  const [authors, setAuthors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", nameMl: "", role: "", roleMl: "", bio: "", photo: "", email: "" });

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await fetchAuthors();
    setAuthors(Array.isArray(data) ? data : []);
  }

  function resetForm() { setForm({ name: "", nameMl: "", role: "", roleMl: "", bio: "", photo: "", email: "" }); setEditing(null); setShowForm(false); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing) { await updateAuthor(editing, form); }
    else { await createAuthor(form); }
    resetForm(); await load();
  }

  function handleEdit(a) {
    setForm({ name: a.name, nameMl: a.nameMl || "", role: a.role || "", roleMl: a.roleMl || "", bio: a.bio || "", photo: a.photo || "", email: a.email || "" });
    setEditing(a._id); setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this author?")) return;
    await deleteAuthor(id); await load();
  }

  return (
    <div className="admin-page-crud">
      <div className="crud-header">
        <h3><Users size={20} /> Authors</h3>
        <button className="admin-btn primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={16} /> Add Author
        </button>
      </div>

      {showForm && (
        <div className="crud-section">
          <h3>{editing ? "Edit Author" : "Add Author"}</h3>
          <form className="crud-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name (English)</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Name (Malayalam)</label>
                <input value={form.nameMl} onChange={e => setForm({ ...form, nameMl: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Role (English)</label>
                <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Role (Malayalam)</label>
                <input value={form.roleMl} onChange={e => setForm({ ...form, roleMl: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Photo URL</label>
              <input value={form.photo} onChange={e => setForm({ ...form, photo: e.target.value })} placeholder="/images/authors/photo.jpg" />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea rows={4} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
            </div>
            <div className="crud-form-actions">
              <button className="admin-btn primary" type="submit">{editing ? "Update" : "Create"} Author</button>
              <button className="admin-btn secondary" type="button" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="crud-section">
        <div className="crud-list">
          {authors.map(a => (
            <div key={a._id} className="crud-item">
              <div className="crud-info">
                <strong>{a.name}</strong>
                {a.nameMl && <small>{a.nameMl}</small>}
                <span className="crud-meta">{a.role || a.roleMl}</span>
              </div>
              <div className="crud-actions">
                <button className="admin-btn-icon edit" onClick={() => handleEdit(a)}><Edit2 size={16} /></button>
                <button className="admin-btn-icon delete" onClick={() => handleDelete(a._id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {authors.length === 0 && <p className="crud-empty">No authors yet.</p>}
        </div>
      </div>
    </div>
  );
}
