import { useState, useEffect } from "react";
import { fetchPages, createPage, updatePage, deletePage } from "../services/api.js";
import { Plus, Edit2, Trash2, FileText, Eye } from "lucide-react";

export default function AdminPagesPage({ navigate }) {
  const [pages, setPages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", titleMl: "", content: "", contentMl: "" });

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await fetchPages();
    setPages(data);
  }

  function resetForm() { setForm({ title: "", titleMl: "", content: "", contentMl: "" }); setEditing(null); setShowForm(false); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editing) {
      await updatePage(editing, form);
    } else {
      await createPage(form);
    }
    resetForm();
    await load();
  }

  function handleEdit(page) {
    setForm({ title: page.title, titleMl: page.titleMl || "", content: page.content || "", contentMl: page.contentMl || "" });
    setEditing(page._id);
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this page?")) return;
    await deletePage(id);
    await load();
  }

  return (
    <div className="admin-page-crud">
      <div className="crud-header">
        <h3><FileText size={20} /> Static Pages</h3>
        <button className="admin-btn primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={16} /> New Page
        </button>
      </div>

      {showForm && (
        <div className="crud-section">
          <h3>{editing ? "Edit Page" : "Create Page"}</h3>
          <form className="crud-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Title (English)</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Title (Malayalam)</label>
                <input value={form.titleMl} onChange={e => setForm({ ...form, titleMl: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Content (English)</label>
              <textarea rows={6} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Content (Malayalam)</label>
              <textarea rows={6} value={form.contentMl} onChange={e => setForm({ ...form, contentMl: e.target.value })} />
            </div>
            <div className="crud-form-actions">
              <button className="admin-btn primary" type="submit">{editing ? "Update" : "Create"} Page</button>
              <button className="admin-btn secondary" type="button" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="crud-section">
        <h3>All Pages ({pages.length})</h3>
        <div className="crud-list">
          {pages.map(page => (
            <div key={page._id} className="crud-item">
              <div className="crud-info">
                <strong>{page.title}</strong>
                <small>/{page.slug}</small>
              </div>
              <div className="crud-actions">
                <button className="admin-btn-icon view" onClick={() => navigate("/page/" + encodeURIComponent(page.slug))}>
                  <Eye size={16} />
                </button>
                <button className="admin-btn-icon edit" onClick={() => handleEdit(page)}>
                  <Edit2 size={16} />
                </button>
                <button className="admin-btn-icon delete" onClick={() => handleDelete(page._id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {pages.length === 0 && <p className="crud-empty">No pages yet.</p>}
        </div>
      </div>
    </div>
  );
}
