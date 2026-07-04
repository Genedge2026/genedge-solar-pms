import React, { useState } from 'react';
import { useInventory } from '../../lib/hooks';

const EMPTY_ITEM = { name: '', unit: 'nos', site: 'Devkigalol', ordered: 0, received: 0, consumed: 0, remarks: '' };

function InventoryModal({ item, onClose, onSave, mode }) {
  const [form, setForm] = useState(item ? { ...item } : { ...EMPTY_ITEM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    if (!form.name.trim()) { setError('Item name is required.'); return; }
    setSaving(true);
    setError('');
    const err = await onSave(form);
    setSaving(false);
    if (err) setError(err.message || 'Save failed.');
    else onClose();
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
      }}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius2)', padding: 28, width: '100%', maxWidth: 480
      }}>
        <div className="flex-between" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 17 }}>{mode === 'edit' ? 'Edit Item' : 'Add Inventory Item'}</h2>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label>Item Name *</label>
          <input type="text" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Solar Module 545W" />
        </div>
        <div className="form-row" style={{ marginTop: 14 }}>
          <div className="form-group">
            <label>Unit</label>
            <select value={form.unit} onChange={e => setF('unit', e.target.value)}>
              <option value="nos">nos.</option>
              <option value="m">metres (m)</option>
              <option value="kg">kg</option>
              <option value="set">set</option>
              <option value="roll">roll</option>
              <option value="box">box</option>
              <option value="lot">lot</option>
            </select>
          </div>
          <div className="form-group">
            <label>Site</label>
            <select value={form.site} onChange={e => setF('site', e.target.value)}>
              <option value="Devkigalol">Devkigalol</option>
              <option value="Kanja">Kanja</option>
              <option value="Mendapara">Mendapara</option>
              <option value="Mandodara">Mandodara</option>
            </select>
          </div>
        </div>
        <div className="form-row-3" style={{ marginTop: 14 }}>
          <div className="form-group">
            <label>Ordered Qty</label>
            <input type="number" min="0" value={form.ordered} onChange={e => setF('ordered', parseInt(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label>Received Qty</label>
            <input type="number" min="0" value={form.received} onChange={e => setF('received', parseInt(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label>Consumed Qty</label>
            <input type="number" min="0" value={form.consumed} onChange={e => setF('consumed', parseInt(e.target.value) || 0)} />
          </div>
        </div>
        <div className="form-group" style={{ marginTop: 14 }}>
          <label>Remarks</label>
          <input type="text" value={form.remarks || ''} onChange={e => setF('remarks', e.target.value)} placeholder="Optional notes" />
        </div>

        {error && <div className="alert-error" style={{ marginTop: 12 }}>{error}</div>}

        <button className="btn btn-primary btn-full" style={{ marginTop: 18 }} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : mode === 'edit' ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </div>
  );
}

export default function InventoryPage({ isOffice, siteFilter }) {
  const [localFilter, setLocalFilter] = useState(siteFilter || 'all');
  const [modal, setModal] = useState(null); // null | { mode:'add'|'edit', item }
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { items, loading, addItem, updateItem, deleteItem } = useInventory(localFilter);

  if (!isOffice) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔒</div>
        <h3>Access Restricted</h3>
        <div>Inventory module is available to office admin only.</div>
      </div>
    );
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  const totalItems  = items.length;
  const outOfStock  = items.filter(i => (i.received - i.consumed) <= 0).length;
  const lowStock    = items.filter(i => { const bal = i.received - i.consumed; return bal > 0 && (i.received / Math.max(i.ordered, 1)) < 0.7; }).length;

  function statusInfo(item) {
    const bal = item.received - item.consumed;
    if (bal <= 0) return { cls: 'tag-red', label: 'Out of Stock' };
    const pct = item.received / Math.max(item.ordered, 1);
    if (pct < 0.7) return { cls: 'tag-amber', label: 'Low' };
    return { cls: 'tag-green', label: 'OK' };
  }

  async function handleSave(form) {
    if (modal.mode === 'add') return addItem(form);
    return updateItem(form.id, form);
  }

  async function handleDelete(id) {
    await deleteItem(id);
    setDeleteConfirm(null);
  }

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h1>Inventory & Materials</h1>
          <div className="text-muted mt-4">Stock tracking across Junagadh cluster sites</div>
        </div>
        <div className="flex gap-12">
          <select value={localFilter} onChange={e => setLocalFilter(e.target.value)} style={{ width: 160 }}>
            <option value="all">All Sites</option>
            <option value="Devkigalol">Devkigalol</option>
            <option value="Kanja">Kanja</option>
            <option value="Mendapara">Mendapara</option>
            <option value="Mandodara">Mandodara</option>
          </select>
          <button className="btn btn-primary" onClick={() => setModal({ mode: 'add', item: null })}>
            + Add Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Items Tracked</div>
          <div className="stat-value">{totalItems}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Out of Stock</div>
          <div className={`stat-value ${outOfStock > 0 ? 'val-red' : 'val-green'}`}>{outOfStock}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Low Stock Items</div>
          <div className={`stat-value ${lowStock > 0 ? 'val-accent' : 'val-green'}`}>{lowStock}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sites Covered</div>
          <div className="stat-value">{[...new Set(items.map(i => i.site))].length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No inventory items</h3>
            <div>Add items using the "+ Add Item" button above.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Site</th>
                  <th>Unit</th>
                  <th>Ordered</th>
                  <th>Received</th>
                  <th>Consumed</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const bal = item.received - item.consumed;
                  const { cls, label } = statusInfo(item);
                  const pctRecv = Math.round((item.received / Math.max(item.ordered, 1)) * 100);
                  return (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong></td>
                      <td>{item.site}</td>
                      <td className="text-muted">{item.unit}</td>
                      <td>{item.ordered}</td>
                      <td>
                        {item.received}
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>{pctRecv}% of order</div>
                      </td>
                      <td>{item.consumed}</td>
                      <td>
                        <strong style={{ color: bal <= 0 ? 'var(--red)' : bal < 100 ? 'var(--accent)' : 'var(--green)' }}>
                          {bal}
                        </strong>
                      </td>
                      <td><span className={`tag ${cls}`}>{label}</span></td>
                      <td className="text-muted text-sm">{item.remarks || '—'}</td>
                      <td>
                        <div className="flex gap-8">
                          <button className="btn btn-outline btn-sm" onClick={() => setModal({ mode: 'edit', item })}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(item.id)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <InventoryModal
          item={modal.item}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
        >
          <div className="card" style={{ maxWidth: 380, padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ marginBottom: 8 }}>Delete Item?</h3>
            <div className="text-muted text-sm" style={{ marginBottom: 20 }}>This action cannot be undone.</div>
            <div className="flex gap-12" style={{ justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
