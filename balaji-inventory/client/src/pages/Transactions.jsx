import { useEffect, useMemo, useState } from "react";
import { getTransactions } from "../api.js";

const TYPE_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "create", label: "Created" },
  { value: "add_qty", label: "Stock added" },
  { value: "reduce_qty", label: "Stock reduced" },
  { value: "update", label: "Updated" },
  { value: "delete", label: "Deleted" },
];

const TYPE_META = {
  create: { label: "Created", badge: "tx-badge--create" },
  add_qty: { label: "Stock +", badge: "tx-badge--add" },
  reduce_qty: { label: "Stock −", badge: "tx-badge--reduce" },
  update: { label: "Updated", badge: "tx-badge--update" },
  delete: { label: "Deleted", badge: "tx-badge--delete" },
};

function formatWhen(iso) {
  if (!iso) return { line: "", title: "" };
  const d = new Date(iso);
  return {
    line: d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    title: d.toISOString(),
  };
}

function formatInt(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString();
}

function formatDelta(t) {
  if (t.type === "delete" || t.type === "update") {
    if (t.delta == null || t.delta === 0) return "—";
  }
  if (t.delta == null || t.delta === 0) return "—";
  const sign = t.delta > 0 ? "+" : "";
  return `${sign}${Number(t.delta).toLocaleString()}`;
}

export default function Transactions() {
  const [list, setList] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getTransactions();
        if (!cancelled) setList(data);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load transactions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((t) => {
      if (typeFilter && t.type !== typeFilter) return false;
      if (q && !String(t.productName).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [list, query, typeFilter]);

  return (
    <section className="card card--transactions">
      <div className="tx-page-head">
        <div>
          <h2>Transactions</h2>
          <p className="muted tx-page-desc">
            Stock movements from creates, edits, adds, reduces, and deletes (last 200).
          </p>
        </div>
        {!loading && !err && list.length > 0 ? (
          <span className="tx-count-pill">{filtered.length} shown</span>
        ) : null}
      </div>

      {err ? <p className="error">{err}</p> : null}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : err ? null : list.length === 0 ? (
        <p className="muted">No transactions yet.</p>
      ) : (
        <>
          <div className="tx-toolbar">
            <label className="tx-search">
              <span className="visually-hidden">Search product</span>
              <input
                type="search"
                placeholder="Search by product name…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
            </label>
            <label className="tx-filter">
              <span className="visually-hidden">Filter by action</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {filtered.length === 0 ? (
            <p className="muted">No rows match your filters.</p>
          ) : (
            <div className="table-wrap tx-table-wrap">
              <table className="tx-table">
                <thead>
                  <tr>
                    <th scope="col">When</th>
                    <th scope="col">Action</th>
                    <th scope="col">Product</th>
                    <th scope="col" className="tx-col-num">
                      Change
                    </th>
                    <th scope="col" className="tx-col-num">
                      Qty after
                    </th>
                    <th scope="col" className="tx-col-note">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const meta = TYPE_META[t.type] || {
                      label: t.type,
                      badge: "tx-badge--update",
                    };
                    const when = formatWhen(t.createdAt);
                    return (
                      <tr key={t._id}>
                        <td className="tx-cell-time" title={when.title}>
                          {when.line}
                        </td>
                        <td>
                          <span className={`tx-badge ${meta.badge}`}>{meta.label}</span>
                        </td>
                        <td className="tx-cell-product">
                          <strong>{t.productName}</strong>
                        </td>
                        <td className="tx-col-num tx-num tx-num-delta">
                          <span
                            className={
                              t.delta > 0
                                ? "tx-delta-pos"
                                : t.delta < 0
                                  ? "tx-delta-neg"
                                  : ""
                            }
                          >
                            {formatDelta(t)}
                          </span>
                        </td>
                        <td className="tx-col-num tx-num">
                          {formatInt(t.quantityAfter)}
                        </td>
                        <td className="tx-col-note tx-cell-note muted">
                          {t.note || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
