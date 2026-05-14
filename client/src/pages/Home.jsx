import { useCallback, useEffect, useState } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  adjustProduct,
  deleteProduct,
} from "../api.js";
import { useToast } from "../hooks/useToast.js";
import ToastStack from "../components/ToastStack.jsx";

const UNITS = ["kg", "meter", "Pcs", "Bundle"];

const emptyForm = {
  name: "",
  size: "",
  unit: "Pcs",
  quantity: "",
  lowStockThreshold: "",
};

function ProductFormFields({ values, setValues }) {
  const patch = (partial) => setValues((f) => ({ ...f, ...partial }));
  return (
    <>
      <label>
        Name
        <input
          required
          value={values.name}
          onChange={(e) => patch({ name: e.target.value })}
        />
      </label>
      <label>
        Product size
        <input
          required
          value={values.size}
          onChange={(e) => patch({ size: e.target.value })}
        />
      </label>
      <label>
        Product unit
        <select value={values.unit} onChange={(e) => patch({ unit: e.target.value })}>
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </label>
      <label>
        Quantity
        <input
          type="number"
          min="0"
          value={values.quantity}
          onChange={(e) => patch({ quantity: e.target.value })}
        />
      </label>
      <label>
        Low stock
        <input
          type="number"
          min="0"
          value={values.lowStockThreshold}
          onChange={(e) => patch({ lowStockThreshold: e.target.value })}
        />
      </label>
    </>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [adjustAmount, setAdjustAmount] = useState({});
  const { toasts, toast, dismiss } = useToast();

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editErr, setEditErr] = useState("");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setErr("");
    try {
      const list = await getProducts();
      setProducts(list);
    } catch (e) {
      const msg = e.message || "Failed to load products. Is the API running?";
      setErr(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const modalOpen = Boolean(editId || addModalOpen || deleteConfirm);
  useEffect(() => {
    if (!modalOpen) return;
    function onKey(e) {
      if (e.key !== "Escape") return;
      if (deleteConfirm && !deleteBusy) {
        setDeleteConfirm(null);
        return;
      }
      if (addModalOpen) {
        setAddModalOpen(false);
        setForm(emptyForm);
        return;
      }
      if (editId) {
        setEditId(null);
        setEditForm(emptyForm);
        setEditErr("");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, editId, addModalOpen, deleteConfirm, deleteBusy]);

  function openAddModal() {
    setErr("");
    setForm(emptyForm);
    setAddModalOpen(true);
  }

  function closeAddModal() {
    setAddModalOpen(false);
    setForm(emptyForm);
  }

  async function onAddSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const payload = {
        name: form.name.trim(),
        size: form.size.trim(),
        unit: form.unit,
        quantity: Number(form.quantity) || 0,
        lowStockThreshold: Number(form.lowStockThreshold) || 0,
      };
      await createProduct(payload);
      closeAddModal();
      await load();
      toast(`Added “${payload.name}” to inventory.`);
    } catch (e) {
      const msg = e.message || "Could not add product.";
      setErr(msg);
      toast(msg, "error");
    }
  }

  function openEditModal(p) {
    setEditErr("");
    setEditId(p._id);
    setEditForm({
      name: p.name,
      size: p.size,
      unit: p.unit,
      quantity: String(p.quantity),
      lowStockThreshold: String(p.lowStockThreshold),
    });
  }

  function closeEditModal() {
    setEditId(null);
    setEditForm(emptyForm);
    setEditErr("");
  }

  async function onEditSubmit(e) {
    e.preventDefault();
    setEditErr("");
    try {
      const payload = {
        name: editForm.name.trim(),
        size: editForm.size.trim(),
        unit: editForm.unit,
        quantity: Number(editForm.quantity) || 0,
        lowStockThreshold: Number(editForm.lowStockThreshold) || 0,
      };
      await updateProduct(editId, payload);
      closeEditModal();
      await load();
      toast("Product updated.");
    } catch (e) {
      const msg = e.message || "Could not save changes.";
      setEditErr(msg);
      toast(msg, "error");
    }
  }

  async function doAdjust(id, sign) {
    const raw = adjustAmount[id];
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) {
      const msg = "Enter a positive number for add/reduce.";
      setErr(msg);
      toast(msg, "error");
      return;
    }
    setErr("");
    try {
      await adjustProduct(id, sign * n);
      setAdjustAmount((a) => ({ ...a, [id]: "" }));
      await load();
      toast(sign > 0 ? "Stock increased." : "Stock reduced.");
    } catch (e) {
      const msg = e.message || "Could not adjust stock.";
      setErr(msg);
      toast(msg, "error");
    }
  }

  function openDeleteModal(p) {
    setDeleteConfirm({ _id: p._id, name: p.name });
  }

  function closeDeleteModal() {
    setDeleteConfirm(null);
    setDeleteBusy(false);
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    setDeleteBusy(true);
    setErr("");
    const { _id, name } = deleteConfirm;
    try {
      await deleteProduct(_id);
      closeDeleteModal();
      if (editId === _id) closeEditModal();
      await load();
      toast(`Deleted “${name}” from inventory.`);
    } catch (e) {
      const msg = e.message || "Could not delete.";
      setErr(msg);
      toast(msg, "error");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      {editId ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditModal();
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-product-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal__head">
              <h2 id="edit-product-title">Edit product</h2>
              <button
                type="button"
                className="modal__close"
                onClick={closeEditModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {editErr ? <p className="error">{editErr}</p> : null}
            <form className="form-grid" onSubmit={onEditSubmit}>
              <ProductFormFields values={editForm} setValues={setEditForm} />
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button type="submit" className="btn btn-primary">
                  Save changes
                </button>
                <button type="button" className="btn btn-ghost" onClick={closeEditModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {addModalOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddModal();
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-product-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal__head">
              <h2 id="add-product-title">Add product</h2>
              <button
                type="button"
                className="modal__close"
                onClick={closeAddModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {err ? <p className="error">{err}</p> : null}
            <form className="form-grid" onSubmit={onAddSubmit}>
              <ProductFormFields values={form} setValues={setForm} />
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button type="submit" className="btn btn-primary">
                  Save product
                </button>
                <button type="button" className="btn btn-ghost" onClick={closeAddModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteConfirm ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleteBusy) closeDeleteModal();
          }}
        >
          <div
            className="modal modal--confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal__head">
              <h2 id="delete-product-title">Delete product?</h2>
              <button
                type="button"
                className="modal__close"
                onClick={closeDeleteModal}
                disabled={deleteBusy}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="modal__confirm-text">
              Remove <strong>{deleteConfirm.name}</strong> from inventory? This cannot be undone.
            </p>
            <div className="modal__actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeDeleteModal}
                disabled={deleteBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={deleteBusy}
              >
                {deleteBusy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="card">
        <div className="add-product-bar">
          <div>
            <h2 style={{ margin: "0 0 0.35rem" }}>Add Product +</h2>
            <p className="muted" style={{ margin: 0 }}>
              Opens the same form as edit, in a dialog.
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={openAddModal}>
            Add product
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Inventory</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : products.length === 0 ? (
          <p className="muted">No products yet. Use Add product to create one.</p>
        ) : (
          <div className="table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Product size</th>
                  <th>Product unit</th>
                  <th>Qty</th>
                  <th>Low stock</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const low = p.quantity <= p.lowStockThreshold;
                  return (
                    <tr key={p._id} className={low ? "low" : ""}>
                      <td>{p.name}</td>
                      <td>{p.size}</td>
                      <td>{p.unit}</td>
                      <td>{p.quantity}</td>
                      <td>{p.lowStockThreshold}</td>
                      <td className="actions-cell">
                        <input
                          type="number"
                          min="1"
                          placeholder="±"
                          style={{ width: "4rem", marginRight: "0.25rem" }}
                          value={adjustAmount[p._id] ?? ""}
                          onChange={(e) =>
                            setAdjustAmount((a) => ({ ...a, [p._id]: e.target.value }))
                          }
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => doAdjust(p._id, -1)}
                        >
                          Reduce
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => doAdjust(p._id, 1)}
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEditModal(p)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => openDeleteModal(p)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
