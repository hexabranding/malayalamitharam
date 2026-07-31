import { useState, useEffect } from "react";
import { fetchTags, createTag, updateTag, deleteTag } from "../services/api.js";
import { Plus, Edit2, Trash2, Tag, Shuffle, Sparkles } from "lucide-react";

const SAMPLE_TAGS = [
  "കേരളം", "മഴ", "പ്രവാസി", "എഐ", "ഫുട്ബോൾ", "സിനിമ", "വീട്",
  "കോവിഡ്", "ആരോഗ്യം", "വിദ്യാഭ്യാസം", "ടെക്", "ക്രിക്കറ്റ്",
  "യുഎഇ", "ഖത്തർ", "സൗദി", "ബിസിനസ്", "നിക്ഷേപം", "സ്റ്റാർട്ടപ്പ്",
  "യാത്ര", "ഭക്ഷണം", "സംഗീതം", "ടെലിവിഷൻ", "ഓഡിയോ", "വീഡിയോ",
  "പ്രോപ്പർട്ടി", "തോട്ടം", "അഭിപ്രായം", "എഡിറ്റോറിയൽ", "വായനക്കാർ",
  "ലോകം", "രാഷ്ട്രീയം", "കായികം", "ഫോട്ടോ", "പരിസ്ഥിതി", "സാങ്കേതികം",
];

export default function AdminTagsPage({ navigate }) {
  const [tags, setTags] = useState([]);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => { fetchTags().then(setTags).catch(() => {}); }, []);

  function slugify(t) { return t.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-"); }

  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getRandomTags(count = 5) {
    const shuffled = shuffleArray(SAMPLE_TAGS);
    return shuffled.slice(0, count);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    const slug = slugify(newName);
    await createTag({ name: newName.trim(), slug });
    setNewName("");
    const updated = await fetchTags();
    setTags(updated);
  }

  async function handleSave(id) {
    if (!editName.trim()) return;
    await updateTag(id, { name: editName.trim(), slug: slugify(editName) });
    setEditing(null);
    const updated = await fetchTags();
    setTags(updated);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this tag?")) return;
    await deleteTag(id);
    const updated = await fetchTags();
    setTags(updated);
  }

  async function handleSuggestRandom() {
    const existingNames = new Set(tags.map(t => t.name));
    const randomTags = getRandomTags(5);
    for (const name of randomTags) {
      if (existingNames.has(name)) continue;
      await createTag({ name, slug: slugify(name) });
      existingNames.add(name);
    }
    const updated = await fetchTags();
    setTags(updated);
  }

  function handleShuffle() {
    setTags(prev => shuffleArray(prev));
  }

  return (
    <div className="admin-page-crud">
      <div className="crud-section">
        <h3><Tag size={20} /> Add New Tag</h3>
        <form className="crud-inline-form" onSubmit={handleAdd}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Tag name" required />
          <button className="admin-btn primary" type="submit"><Plus size={16} /> Add Tag</button>
          <button className="admin-btn secondary" type="button" onClick={handleSuggestRandom} title="Suggest 5 random tags">
            <Sparkles size={16} /> Random
          </button>
        </form>
      </div>

      <div className="crud-section">
        <div className="crud-header" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>All Tags ({tags.length})</h3>
          <button className="admin-btn secondary" onClick={handleShuffle} title="Shuffle order">
            <Shuffle size={16} /> Shuffle
          </button>
        </div>
        <div className="crud-list">
          {tags.map(tag => (
            <div key={tag._id} className="crud-item">
              {editing === tag._id ? (
                <div className="crud-edit-row">
                  <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                  <button className="admin-btn primary" onClick={() => handleSave(tag._id)}>Save</button>
                  <button className="admin-btn secondary" onClick={() => setEditing(null)}>Cancel</button>
                </div>
              ) : (
                <>
                  <div className="crud-info">
                    <strong>{tag.name}</strong>
                    <small>/{tag.slug}</small>
                  </div>
                  <div className="crud-actions">
                    <button className="admin-btn-icon edit" onClick={() => { setEditing(tag._id); setEditName(tag.name); }}>
                      <Edit2 size={16} />
                    </button>
                    <button className="admin-btn-icon delete" onClick={() => handleDelete(tag._id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {tags.length === 0 && <p className="crud-empty">No tags yet. Add one above.</p>}
        </div>
      </div>
    </div>
  );
}
