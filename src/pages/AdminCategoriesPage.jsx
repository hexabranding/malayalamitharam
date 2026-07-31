import { useState } from "react";
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { menuGroups } from "../services/api.js";

export default function AdminCategoriesPage({ navigate }) {
  const [categories, setCategories] = useState(menuGroups);
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editMl, setEditMl] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({});

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

  function saveEdit() {
    if (!editLabel.trim()) return;
    setCategories(prev => prev.map(g => {
      if (editingId === `group-${g.slug}`) {
        return { ...g, label: editLabel.trim() };
      }
      if (g.children) {
        return {
          ...g,
          children: g.children.map(c =>
            editingId === `child-${g.slug}-${c.slug}`
              ? { ...c, label: editLabel.trim(), titleMl: editMl.trim() || c.titleMl }
              : c
          )
        };
      }
      return g;
    }));
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

  const handleDeleteGroup = (slug) => {
    if (confirm("Are you sure you want to delete this category group?")) {
      setCategories(categories.filter(g => g.slug !== slug));
    }
  };

  const handleDeleteChild = (groupSlug, childSlug) => {
    if (confirm("Are you sure you want to delete this subcategory?")) {
      setCategories(categories.map(g => {
        if (g.slug === groupSlug && g.children) {
          return { ...g, children: g.children.filter(c => c.slug !== childSlug) };
        }
        return g;
      }));
    }
  };

  const handleAddSubcategory = (groupSlug) => {
    const newChild = { label: "New Category", slug: `new-${Date.now()}`, titleMl: "New" };
    setCategories(categories.map(g => {
      if (g.slug === groupSlug) return { ...g, children: [...(g.children || []), newChild] };
      return g;
    }));
    setEditingId(`child-${groupSlug}-${newChild.slug}`);
    setEditLabel("New Category");
    setEditMl("New");
    setExpandedGroups(prev => ({ ...prev, [groupSlug]: true }));
  };

  const handleAddGroup = () => {
    const newGroup = { label: "New Group", slug: `new-group-${Date.now()}`, children: [] };
    setCategories([...categories, newGroup]);
    setEditingId(`group-${newGroup.slug}`);
    setEditLabel("New Group");
  };

  return (
    <div className="admin-categories-page">
      <div className="admin-toolbar">
        <button className="admin-btn primary" onClick={handleAddGroup}>
          <Plus size={18} /> Add Category Group
        </button>
      </div>

      <div className="categories-tree">
        {categories.map((group) => (
          <div key={group.slug} className="category-group">
            <div className="category-group-header">
              {editingId === `group-${group.slug}` ? (
                <div className="crud-edit-row" style={{ flex: 1 }}>
                  <input value={editLabel} onChange={e => setEditLabel(e.target.value)} autoFocus />
                  <button className="admin-btn-icon edit" onClick={saveEdit}><Check size={16} /></button>
                  <button className="admin-btn-icon delete" onClick={cancelEdit}><X size={16} /></button>
                </div>
              ) : (
                <>
                  <div className="category-group-info">
                    {group.children && (
                      <button className="expand-btn" onClick={() => toggleGroup(group.slug)}>
                        {expandedGroups[group.slug] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    )}
                    <span className="category-label">{group.label}</span>
                    <span className="category-slug">/{group.slug}</span>
                  </div>
                  <div className="category-actions">
                    {group.children && (
                      <button className="admin-btn-icon" onClick={() => handleAddSubcategory(group.slug)} title="Add Subcategory">
                        <Plus size={16} />
                      </button>
                    )}
                    <button className="admin-btn-icon edit" onClick={() => handleEditGroup(group.slug)} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button className="admin-btn-icon delete" onClick={() => handleDeleteGroup(group.slug)} title="Delete">
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
                        <button className="admin-btn-icon edit" onClick={saveEdit}><Check size={16} /></button>
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
                          <button className="admin-btn-icon delete" onClick={() => handleDeleteChild(group.slug, child.slug)} title="Delete">
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
