import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Check, X, Loader2 } from "lucide-react";
import { loadMenuGroups, createCategory, updateCategory, deleteCategory, clearMenuCache } from "../services/api.js";

export default function AdminCategoriesPage({ navigate }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editMl, setEditMl] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({});
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      clearMenuCache();
      const groups = await loadMenuGroups();
      setCategories(groups.filter(g => g.slug !== "home"));
      window.dispatchEvent(new CustomEvent("mm-data-updated", { detail: { type: "categories" } }));
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const toggleGroup = (slug) => {
    setExpandedGroups(prev => ({ ...prev, [slug]: !prev[slug] }));
  };

  function startEdit(id, label, ml) {
    setEditingId(id);
    setEditLabel(label);
    setEditMl(ml || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditLabel("");
    setEditMl("");
  }

  async function saveEdit() {
    if (!editLabel.trim()) return;
    setSaving(true);
    try {
      if (editingId.startsWith("group-")) {
        const slug = editingId.replace("group-", "");
        await updateCategory(slug, { label: editLabel.trim() });
      } else if (editingId.startsWith("child-")) {
        const raw = editingId.replace("child-", "");
        const sepIdx = raw.indexOf("-");
        const groupSlug = raw.substring(0, sepIdx);
        const childSlug = raw.substring(sepIdx + 1);
        await updateCategory(childSlug, { label: editLabel.trim(), titleMl: editMl.trim() });
      }
      await refresh();
    } catch (err) {
      alert("Error saving: " + err.message);
    }
    setSaving(false);
    cancelEdit();
  }

  const handleEditGroup = (slug) => {
    const g = categories.find(c => c.slug === slug);
    startEdit(`group-${slug}`, g?.label || "", "");
  };

  const handleEditChild = (groupSlug, childSlug) => {
    const g = categories.find(c => c.slug === groupSlug);
    const c = g?.children?.find(ch => ch.slug === childSlug);
    startEdit(`child-${groupSlug}-${childSlug}`, c?.label || "", c?.titleMl || "");
  };

  const handleDeleteGroup = async (slug) => {
    if (!confirm("Are you sure you want to delete this category group and all its subcategories?")) return;
    setSaving(true);
    try {
      await deleteCategory(slug);
      await refresh();
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
    setSaving(false);
  };

  const handleDeleteChild = async (groupSlug, childSlug) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) return;
    setSaving(true);
    try {
      await deleteCategory(childSlug);
      await refresh();
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
    setSaving(false);
  };

  const handleAddSubcategory = async (groupSlug) => {
    const slug = `new-${Date.now()}`;
    const id = slug;
    setSaving(true);
    try {
      await createCategory({ id, label: "New Category", slug, titleMl: "New", parent: groupSlug });
      await refresh();
      setEditingId(`child-${groupSlug}-${slug}`);
      setEditLabel("New Category");
      setEditMl("New");
      setExpandedGroups(prev => ({ ...prev, [groupSlug]: true }));
    } catch (err) {
      alert("Error adding subcategory: " + err.message);
    }
    setSaving(false);
  };

  const handleAddGroup = async () => {
    const slug = `new-group-${Date.now()}`;
    const id = slug;
    setSaving(true);
    try {
      await createCategory({ id, label: "New Group", slug });
      await refresh();
      setEditingId(`group-${slug}`);
      setEditLabel("New Group");
    } catch (err) {
      alert("Error adding group: " + err.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="admin-categories-page" style={{ textAlign: "center", padding: 40 }}>
        <Loader2 size={32} className="spin" /> <p>Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="admin-categories-page">
      <div className="admin-toolbar">
        <button className="admin-btn primary" onClick={handleAddGroup} disabled={saving}>
          <Plus size={18} /> Add Category Group
        </button>
        {saving && <span style={{ marginLeft: 8, color: "#888" }}><Loader2 size={16} className="spin" /> Saving...</span>}
      </div>

      <div className="categories-tree">
        {categories.map((group) => (
          <div key={group.slug} className="category-group">
            <div className="category-group-header">
              {editingId === `group-${group.slug}` ? (
                <div className="crud-edit-row" style={{ flex: 1 }}>
                  <input value={editLabel} onChange={e => setEditLabel(e.target.value)} autoFocus />
                  <button className="admin-btn-icon edit" onClick={saveEdit} disabled={saving}><Check size={16} /></button>
                  <button className="admin-btn-icon delete" onClick={cancelEdit}><X size={16} /></button>
                </div>
              ) : (
                <>
                  <div className="category-group-info">
                    {group.children && group.children.length > 0 && (
                      <button className="expand-btn" onClick={() => toggleGroup(group.slug)}>
                        {expandedGroups[group.slug] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    )}
                    <span className="category-label">{group.label}</span>
                    <span className="category-slug">/{group.slug}</span>
                  </div>
                  <div className="category-actions">
                    <button className="admin-btn-icon" onClick={() => handleAddSubcategory(group.slug)} title="Add Subcategory" disabled={saving}>
                      <Plus size={16} />
                    </button>
                    <button className="admin-btn-icon edit" onClick={() => handleEditGroup(group.slug)} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button className="admin-btn-icon delete" onClick={() => handleDeleteGroup(group.slug)} title="Delete" disabled={saving}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {group.children && expandedGroups[group.slug] && (
              <div className="category-children">
                {group.children.map((child) => (
                  <div key={child.slug} className="category-child">
                    {editingId === `child-${group.slug}-${child.slug}` ? (
                      <div className="crud-edit-row" style={{ flex: 1, paddingLeft: 32 }}>
                        <input value={editLabel} onChange={e => setEditLabel(e.target.value)} placeholder="English" autoFocus />
                        <input value={editMl} onChange={e => setEditMl(e.target.value)} placeholder="Malayalam" />
                        <button className="admin-btn-icon edit" onClick={saveEdit} disabled={saving}><Check size={16} /></button>
                        <button className="admin-btn-icon delete" onClick={cancelEdit}><X size={16} /></button>
                      </div>
                    ) : (
                      <>
                        <div className="category-child-info">
                          <span className="category-label">{child.label}</span>
                          <span className="category-ml">{child.titleMl}</span>
                          <span className="category-slug">/{child.slug}</span>
                        </div>
                        <div className="category-actions">
                          <button className="admin-btn-icon edit" onClick={() => handleEditChild(group.slug, child.slug)} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button className="admin-btn-icon delete" onClick={() => handleDeleteChild(group.slug, child.slug)} title="Delete" disabled={saving}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <strong>{categories.length}</strong>
          <span>Category Groups</span>
        </div>
        <div className="stat-card">
          <strong>{categories.reduce((acc, g) => acc + (g.children?.length || 0), 0)}</strong>
          <span>Subcategories</span>
        </div>
      </div>
    </div>
  );
}
