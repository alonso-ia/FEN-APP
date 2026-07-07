import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowUpRight, ArrowDownLeft, UserPlus, Shield,
  Copy, Check, LogOut, X, RefreshCw
} from "lucide-react";
import {
  getUser, getAllUsers, createUser, userExists,
  getInvite, createInvite, getMyInvites, markInviteUsed,
  getMyTransactions, getAllTransactions, sendFen
} from "./api";

const DEBT_LIMIT = -100000;
const CREDIT_LIMIT = 100000;
const ADMIN_KEY = "fenecocura";

const clp = (n) =>
  new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(n);

const codeGen = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

/* ---------- Primitivos UI ---------- */
function Brand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "#BD5B2E", color: "#FBF6EC",
        display: "grid", placeItems: "center",
        fontFamily: "Fraunces, serif", fontSize: 18
      }}>分</div>
      <span className="font-fen" style={{ fontSize: "1.35rem", letterSpacing: "-0.02em" }}>Fen</span>
    </div>
  );
}

function Gauge({ value }) {
  const clamped = Math.min(CREDIT_LIMIT, Math.max(DEBT_LIMIT, value));
  const t = (clamped - DEBT_LIMIT) / (CREDIT_LIMIT - DEBT_LIMIT);
  const deg = -120 + t * 240;
  const tone = value > 0 ? "#4F6B43" : value < 0 ? "#9C4632" : "#27221C";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox="0 0 220 140" style={{ width: "100%", maxWidth: 280 }}>
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#9C4632" />
            <stop offset="50%" stopColor="#D9CCB3" />
            <stop offset="100%" stopColor="#4F6B43" />
          </linearGradient>
        </defs>
        <path d="M20 120 A 90 90 0 0 1 200 120" fill="none" stroke="url(#g)" strokeWidth="12" strokeLinecap="round" />
        <g transform={`rotate(${deg} 110 120)`}>
          <line x1="110" y1="120" x2="110" y2="40" stroke="#27221C" strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx="110" cy="120" r="6" fill="#27221C" />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 280, marginTop: -4, padding: "0 8px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(39,34,28,0.45)" }}>
        <span>{clp(DEBT_LIMIT)}</span><span>0</span><span>+{clp(CREDIT_LIMIT)}</span>
      </div>
      <div className="font-fen" style={{ fontSize: "2.75rem", color: tone, lineHeight: 1, marginTop: 8 }}>
        {value > 0 ? "+" : ""}{clp(value)}
      </div>
      <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.25em", color: "rgba(39,34,28,0.45)", marginTop: 4 }}>Fen</span>
    </div>
  );
}

const S = {
  card: { background: "#FFFCF5", border: "1px solid rgba(39,34,28,0.1)", borderRadius: 16, padding: 20 },
  input: { width: "100%", borderRadius: 10, border: "1px solid rgba(39,34,28,0.15)", background: "#FFFCF5", padding: "10px 14px", fontSize: 15, color: "#27221C", outline: "none" },
  label: { display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(39,34,28,0.55)", marginBottom: 6 },
  btnPrimary: { width: "100%", background: "#BD5B2E", color: "#FBF6EC", border: "none", borderRadius: 10, padding: "11px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnOutline: { width: "100%", background: "transparent", color: "#27221C", border: "1px solid rgba(39,34,28,0.2)", borderRadius: 10, padding: "11px 16px", fontSize: 14, fontWeight: 500, cursor: "pointer" },
  err: { color: "#9C4632", fontSize: 14, marginTop: 4 },
  link: { width: "100%", background: "none", border: "none", color: "rgba(39,34,28,0.6)", fontSize: 14, cursor: "pointer", padding: "8px 0", textAlign: "center" },
};

function Field({ label, ...rest }) {
  return (
    <label style={{ display: "block" }}>
      <span style={S.label}>{label}</span>
      <input {...rest} style={S.input} />
    </label>
  );
}

function Screen({ children, subtitle }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", background: "#FBF6EC" }}>
      <Brand />
      {subtitle && <p style={{ color: "rgba(39,34,28,0.6)", fontSize: 14, textAlign: "center", maxWidth: 300, margin: "8px 0 28px" }}>{subtitle}</p>}
      <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

/* ---------- Pantalla: Fundar grupo ---------- */
function FoundGroup({ onDone }) {
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!u.trim()) return setErr("Elige un nombre de usuario");
    if (!/^\d{4,6}$/.test(p)) return setErr("PIN numérico de 4 a 6 dígitos");
    setLoading(true);
    try {
      const exists = await userExists();
      if (exists) return setErr("Alguien ya fundó el grupo. Vuelve al login.");
      await createUser(u.trim(), p);
      onDone(u.trim());
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };
  return (
    <Screen subtitle="Todavía no hay miembros. Crea la primera cuenta para fundar el grupo.">
      <Field label="Usuario" value={u} onChange={e => { setU(e.target.value); setErr(""); }} placeholder="tu_nombre" />
      <Field label="PIN (4 a 6 dígitos)" type="password" inputMode="numeric" value={p} onChange={e => { setP(e.target.value); setErr(""); }} placeholder="••••" />
      {err && <p style={S.err}>{err}</p>}
      <button style={S.btnPrimary} onClick={submit} disabled={loading}>{loading ? "Creando..." : "Fundar grupo"}</button>
    </Screen>
  );
}

/* ---------- Pantalla: Login ---------- */
function Login({ onLogin, onRegister, onAdmin }) {
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true); setErr("");
    try {
      const user = await getUser(u.trim());
      if (!user || user.pin !== p) return setErr("Usuario o PIN incorrecto");
      onLogin(user);
    } catch { setErr("Error de conexión. Intenta de nuevo."); } finally { setLoading(false); }
  };
  return (
    <Screen subtitle="Crédito mutuo entre personas. Lo que das y recibes define tu saldo.">
      <Field label="Usuario" value={u} onChange={e => { setU(e.target.value); setErr(""); }} placeholder="tu_nombre" />
      <Field label="PIN" type="password" inputMode="numeric" value={p} onChange={e => { setP(e.target.value); setErr(""); }} placeholder="••••" />
      {err && <p style={S.err}>{err}</p>}
      <button style={S.btnPrimary} onClick={submit} disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
      <button style={S.link} onClick={onRegister}>Tengo un código de invitación →</button>
      <button style={{ ...S.link, fontSize: 12, color: "rgba(39,34,28,0.35)" }} onClick={onAdmin}>Panel admin</button>
    </Screen>
  );
}

/* ---------- Pantalla: Registro ---------- */
function Register({ onDone, onBack }) {
  const [code, setCode] = useState(""); const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!code.trim()) return setErr("Ingresa el código de invitación");
    if (!u.trim()) return setErr("Elige un nombre de usuario");
    if (!/^\d{4,6}$/.test(p)) return setErr("PIN numérico de 4 a 6 dígitos");
    setLoading(true); setErr("");
    try {
      const inv = await getInvite(code.trim().toUpperCase());
      if (!inv) return setErr("Código inválido");
      if (inv.used_by) return setErr("Ese código ya fue usado");
      const existing = await getUser(u.trim());
      if (existing) return setErr("Ese usuario ya existe");
      await createUser(u.trim(), p, inv.created_by);
      await markInviteUsed(code.trim().toUpperCase(), u.trim());
      const user = await getUser(u.trim());
      onDone(user);
    } catch (e) { setErr(e.message || "Error de conexión"); } finally { setLoading(false); }
  };
  return (
    <Screen subtitle="Ingresa el código de invitación que te compartieron.">
      <Field label="Código de invitación" value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setErr(""); }} placeholder="AB12CD" />
      <Field label="Usuario" value={u} onChange={e => { setU(e.target.value); setErr(""); }} placeholder="tu_nombre" />
      <Field label="PIN (4 a 6 dígitos)" type="password" inputMode="numeric" value={p} onChange={e => { setP(e.target.value); setErr(""); }} placeholder="••••" />
      {err && <p style={S.err}>{err}</p>}
      <button style={S.btnPrimary} onClick={submit} disabled={loading}>{loading ? "Creando cuenta..." : "Unirme"}</button>
      <button style={S.link} onClick={onBack}>← Volver</button>
    </Screen>
  );
}

/* ---------- Panel admin ---------- */
function AdminGate({ onUnlock, onBack }) {
  const [k, setK] = useState(""); const [err, setErr] = useState("");
  return (
    <Screen>
      <div style={{ textAlign: "center" }}><Shield size={28} style={{ color: "rgba(39,34,28,0.4)" }} /></div>
      <Field label="Clave de administrador" type="password" value={k} onChange={e => { setK(e.target.value); setErr(""); }} />
      {err && <p style={S.err}>{err}</p>}
      <button style={S.btnPrimary} onClick={() => k === ADMIN_KEY ? onUnlock() : setErr("Clave incorrecta")}>Entrar</button>
      <button style={S.link} onClick={onBack}>← Volver</button>
    </Screen>
  );
}

function AdminPanel({ onBack }) {
  const [users, setUsers] = useState([]);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const [u, t] = await Promise.all([getAllUsers(), getAllTransactions()]);
    setUsers(u); setTxs(t); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  const total = users.reduce((a, u) => a + u.balance, 0);
  return (
    <div style={{ minHeight: "100dvh", background: "#FBF6EC" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(39,34,28,0.1)" }}>
        <span className="font-fen" style={{ fontSize: "1.15rem", display: "flex", alignItems: "center", gap: 8 }}><Shield size={18} /> Panel admin</span>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={load} style={{ color: "rgba(39,34,28,0.5)", background: "none", border: "none", cursor: "pointer" }}><RefreshCw size={18} /></button>
          <button style={{ ...S.link, width: "auto", padding: 0 }} onClick={onBack}>Salir</button>
        </div>
      </header>
      <div style={{ padding: "24px 20px", maxWidth: 680, margin: "0 auto" }}>
        {loading ? <p style={{ textAlign: "center", color: "rgba(39,34,28,0.4)" }}>Cargando...</p> : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[["Miembros", users.length, false], ["Transacciones", txs.length, false], ["Suma saldos", clp(total), total !== 0]].map(([l, v, alert]) => (
                <div key={l} style={{ ...S.card }}>
                  <div className="font-fen" style={{ fontSize: "1.75rem", color: alert ? "#9C4632" : "#27221C" }}>{v}</div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(39,34,28,0.5)" }}>{l}</div>
                </div>
              ))}
            </div>
            {total !== 0 && <p style={{ ...S.err, marginBottom: 16 }}>La suma de saldos debería ser 0 — revisa la integridad de los datos.</p>}
            <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(39,34,28,0.5)", marginBottom: 8 }}>Saldos por miembro</h3>
            <div style={{ ...S.card, padding: "0 16px", marginBottom: 32 }}>
              {users.map((u, i) => (
                <div key={u.username} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < users.length - 1 ? "1px solid rgba(39,34,28,0.08)" : "none" }}>
                  <div>
                    <div style={{ fontSize: 14 }}>{u.username}</div>
                    <div style={{ fontSize: 10, color: "rgba(39,34,28,0.4)" }}>invitado por {u.invited_by ?? "— (fundador)"}</div>
                  </div>
                  <div className="font-fen" style={{ fontSize: "1.25rem", color: u.balance < 0 ? "#9C4632" : u.balance > 0 ? "#4F6B43" : "#27221C" }}>
                    {u.balance > 0 ? "+" : ""}{clp(u.balance)}
                  </div>
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(39,34,28,0.5)", marginBottom: 8 }}>Todas las transacciones</h3>
            <div style={{ ...S.card, padding: "0 16px" }}>
              {txs.length === 0 ? <p style={{ textAlign: "center", color: "rgba(39,34,28,0.4)", padding: "24px 0" }}>Sin movimientos todavía.</p> : txs.map((t, i) => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < txs.length - 1 ? "1px solid rgba(39,34,28,0.08)" : "none", fontSize: 14 }}>
                  <span>{t.from} → {t.to}{t.note ? ` · ${t.note}` : ""}</span>
                  <span className="font-fen">{clp(t.amount)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Modal enviar ---------- */
function SendModal({ me, myBalance, users, onClose, onSend }) {
  const [to, setTo] = useState(""); const [amt, setAmt] = useState(""); const [note, setNote] = useState(""); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const value = Math.max(0, parseFloat(amt) || 0);
  const others = users.filter(u => u.username !== me);
  const recipientBal = to ? (users.find(u => u.username === to)?.balance ?? 0) : 0;
  const senderBreaks = value > 0 && myBalance - value < DEBT_LIMIT;
  const recipientBreaks = value > 0 && !!to && recipientBal + value > CREDIT_LIMIT;
  const blocked = senderBreaks || recipientBreaks;
  const submit = async () => {
    if (!to) return setErr("Elige un destinatario");
    if (value <= 0) return setErr("Ingresa un monto válido");
    setLoading(true); setErr("");
    try { await sendFen(me, to, value, note.trim()); onSend(); }
    catch (e) { setErr(e.message); } finally { setLoading(false); }
  };
  return (
    <Overlay title="Enviar Fen" onClose={onClose}>
      <label style={{ display: "block" }}>
        <span style={S.label}>Destinatario</span>
        <select value={to} onChange={e => setTo(e.target.value)} style={S.input}>
          <option value="">Elige a quién enviar</option>
          {others.map(u => <option key={u.username} value={u.username}>{u.username}</option>)}
        </select>
      </label>
      <Field label="Monto (Fen)" type="number" min="0" step="1" inputMode="decimal" value={amt} onChange={e => { setAmt(e.target.value); setErr(""); }} placeholder="0" />
      <Field label="Nota (opcional)" value={note} onChange={e => setNote(e.target.value)} placeholder="¿Por qué?" />
      <p style={{ fontSize: 12, color: "rgba(39,34,28,0.55)" }}>
        Tu saldo quedaría en <strong style={{ color: senderBreaks ? "#9C4632" : "#27221C" }}>{clp(myBalance - value)} Fen</strong>
      </p>
      {senderBreaks && <p style={S.err}>Superarías tu límite de deuda ({clp(DEBT_LIMIT)} Fen)</p>}
      {recipientBreaks && <p style={S.err}>{to} superaría el límite de crédito (+{clp(CREDIT_LIMIT)} Fen)</p>}
      {err && <p style={S.err}>{err}</p>}
      <button style={{ ...S.btnPrimary, opacity: (!to || value <= 0 || blocked || loading) ? 0.4 : 1 }} onClick={submit} disabled={!to || value <= 0 || blocked || loading}>
        {loading ? "Enviando..." : "Confirmar envío"}
      </button>
    </Overlay>
  );
}

/* ---------- Modal invitar ---------- */
function InviteModal({ me, onClose }) {
  const [invites, setInvites] = useState([]); const [loading, setLoading] = useState(true); const [copied, setCopied] = useState(""); const [genLoading, setGenLoading] = useState(false);
  const load = useCallback(async () => { setLoading(true); setInvites(await getMyInvites(me)); setLoading(false); }, [me]);
  useEffect(() => { load(); }, [load]);
  const generate = async () => {
    setGenLoading(true);
    try { await createInvite(codeGen(), me); await load(); }
    catch (e) { alert(e.message); } finally { setGenLoading(false); }
  };
  const copy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopied(code); setTimeout(() => setCopied(""), 1400);
  };
  return (
    <Overlay title="Invitar al grupo" onClose={onClose}>
      <p style={{ fontSize: 14, color: "rgba(39,34,28,0.6)" }}>El código solo da acceso al grupo, no afecta tu saldo.</p>
      <button style={S.btnPrimary} onClick={generate} disabled={genLoading}>{genLoading ? "Generando..." : "＋ Generar código"}</button>
      {loading ? <p style={{ textAlign: "center", fontSize: 13, color: "rgba(39,34,28,0.4)" }}>Cargando...</p> : invites.map(inv => (
        <div key={inv.code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", ...S.card, padding: "12px 16px" }}>
          <span style={{ fontFamily: "monospace", letterSpacing: "0.15em", fontSize: 16 }}>{inv.code}</span>
          {inv.used_by
            ? <span style={{ fontSize: 12, color: "#4F6B43" }}>usado por {inv.used_by}</span>
            : <button onClick={() => copy(inv.code)} style={{ color: "rgba(39,34,28,0.5)", cursor: "pointer" }}>{copied === inv.code ? <Check size={16} /> : <Copy size={16} />}</button>
          }
        </div>
      ))}
    </Overlay>
  );
}

function Overlay({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(39,34,28,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}>
      <div style={{ width: "100%", maxWidth: 480, background: "#FBF6EC", borderRadius: "20px 20px 0 0", padding: 20, maxHeight: "90dvh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="font-fen" style={{ fontSize: "1.25rem" }}>{title}</span>
          <button onClick={onClose}><X size={20} style={{ color: "rgba(39,34,28,0.5)" }} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Home ---------- */
function Home({ user, onLogout }) {
  const [balance, setBalance] = useState(user.balance);
  const [txs, setTxs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showSend, setShowSend] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [fresh, myTxs, users] = await Promise.all([
      getUser(user.username),
      getMyTransactions(user.username),
      getAllUsers(),
    ]);
    setBalance(fresh.balance);
    setTxs(myTxs);
    setAllUsers(users);
    setLoading(false);
  }, [user.username]);

  useEffect(() => { load(); }, [load]);

  const handleSent = async () => { setShowSend(false); await load(); };

  return (
    <div style={{ minHeight: "100dvh", background: "#FBF6EC", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(39,34,28,0.1)" }}>
        <Brand />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "rgba(39,34,28,0.55)" }}>{user.username}</span>
          <button onClick={load} style={{ color: "rgba(39,34,28,0.5)", cursor: "pointer" }}><RefreshCw size={18} /></button>
          <button onClick={onLogout} style={{ color: "rgba(39,34,28,0.5)", cursor: "pointer" }}><LogOut size={18} /></button>
        </div>
      </header>

      <main style={{ flex: 1, padding: "24px 20px", maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <div style={{ ...S.card, marginBottom: 16 }}>
          <Gauge value={balance} />
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
          <button style={{ ...S.btnPrimary, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setShowSend(true)}>
            <ArrowUpRight size={16} /> Enviar
          </button>
          <button style={{ ...S.btnOutline, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setShowInvite(true)}>
            <UserPlus size={16} /> Invitar
          </button>
        </div>

        <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(39,34,28,0.5)", marginBottom: 8 }}>Movimientos</h3>
        {loading ? (
          <p style={{ textAlign: "center", color: "rgba(39,34,28,0.4)", paddingTop: 32 }}>Cargando...</p>
        ) : txs.length === 0 ? (
          <p style={{ textAlign: "center", color: "rgba(39,34,28,0.4)", paddingTop: 32 }}>Aún no tienes movimientos.</p>
        ) : (
          <div style={{ ...S.card, padding: "0 16px" }}>
            {txs.map((t, i) => {
              const out = t.from === user.username;
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < txs.length - 1 ? "1px solid rgba(39,34,28,0.08)" : "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: out ? "rgba(156,70,50,0.1)" : "rgba(79,107,67,0.1)", color: out ? "#9C4632" : "#4F6B43", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    {out ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14 }}>{out ? `Para ${t.to}` : `De ${t.from}`}</div>
                    {t.note && <div style={{ fontSize: 12, color: "rgba(39,34,28,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.note}</div>}
                  </div>
                  <div className="font-fen" style={{ fontSize: "1.15rem", color: out ? "#9C4632" : "#4F6B43" }}>{out ? "−" : "+"}{clp(t.amount)}</div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showSend && <SendModal me={user.username} myBalance={balance} users={allUsers} onClose={() => setShowSend(false)} onSend={handleSent} />}
      {showInvite && <InviteModal me={user.username} onClose={() => setShowInvite(false)} />}
    </div>
  );
}

/* ---------- Root ---------- */
export default function App() {
  const [route, setRoute] = useState("boot");
  const [me, setMe] = useState(null);

  useEffect(() => {
    userExists().then(exists => setRoute(exists ? "login" : "found"));
  }, []);

  if (route === "boot") return <div style={{ minHeight: "100dvh", background: "#FBF6EC", display: "grid", placeItems: "center" }}><Brand /></div>;
  if (route === "found") return <FoundGroup onDone={async (u) => { const user = await getUser(u); setMe(user); setRoute("home"); }} />;
  if (route === "login") return <Login onLogin={(u) => { setMe(u); setRoute("home"); }} onRegister={() => setRoute("register")} onAdmin={() => setRoute("adminGate")} />;
  if (route === "register") return <Register onDone={(u) => { setMe(u); setRoute("home"); }} onBack={() => setRoute("login")} />;
  if (route === "adminGate") return <AdminGate onUnlock={() => setRoute("admin")} onBack={() => setRoute("login")} />;
  if (route === "admin") return <AdminPanel onBack={() => setRoute("login")} />;
  if (route === "home" && me) return <Home user={me} onLogout={() => { setMe(null); setRoute("login"); }} />;
  return null;
}
