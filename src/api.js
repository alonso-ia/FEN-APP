import { supabase } from "./supabase";

const DEBT_LIMIT = -100000;
const CREDIT_LIMIT = 100000;

// ---------- USUARIOS ----------

export async function getUser(username) {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();
  return data;
}

export async function getAllUsers() {
  const { data } = await supabase
    .from("users")
    .select("username, balance, invited_by, created_at")
    .order("balance", { ascending: false });
  return data || [];
}

export async function createUser(username, pin, invitedBy = null) {
  const { error } = await supabase
    .from("users")
    .insert({ username, pin, balance: 0, invited_by: invitedBy });
  if (error) throw new Error(error.message);
}

export async function userExists() {
  const { count } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });
  return count > 0;
}

// ---------- INVITACIONES ----------

export async function getInvite(code) {
  const { data } = await supabase
    .from("invites")
    .select("*")
    .eq("code", code)
    .single();
  return data;
}

export async function createInvite(code, createdBy) {
  const { error } = await supabase
    .from("invites")
    .insert({ code, created_by: createdBy });
  if (error) throw new Error(error.message);
}

export async function getMyInvites(username) {
  const { data } = await supabase
    .from("invites")
    .select("*")
    .eq("created_by", username)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function markInviteUsed(code, usedBy) {
  const { error } = await supabase
    .from("invites")
    .update({ used_by: usedBy })
    .eq("code", code);
  if (error) throw new Error(error.message);
}

// ---------- TRANSACCIONES ----------

export async function getMyTransactions(username) {
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .or(`from.eq.${username},to.eq.${username}`)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getAllTransactions() {
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function sendFen(fromUser, toUser, amount, note) {
  // Leer saldos frescos de la base de datos para evitar condiciones de carrera
  const [sender, receiver] = await Promise.all([
    getUser(fromUser),
    getUser(toUser),
  ]);

  if (!sender || !receiver) throw new Error("Usuario no encontrado");

  const newFromBalance = sender.balance - amount;
  const newToBalance = receiver.balance + amount;

  if (newFromBalance < DEBT_LIMIT)
    throw new Error(`Superarías tu límite de deuda (${DEBT_LIMIT.toLocaleString("es-CL")} Fen)`);
  if (newToBalance > CREDIT_LIMIT)
    throw new Error(`${toUser} superaría el límite de crédito (+${CREDIT_LIMIT.toLocaleString("es-CL")} Fen)`);

  // Actualizar saldo del emisor
  const { error: e1 } = await supabase
    .from("users")
    .update({ balance: newFromBalance })
    .eq("username", fromUser);
  if (e1) throw new Error(e1.message);

  // Actualizar saldo del receptor
  const { error: e2 } = await supabase
    .from("users")
    .update({ balance: newToBalance })
    .eq("username", toUser);
  if (e2) throw new Error(e2.message);

  // Registrar la transacción
  const { error: e3 } = await supabase
    .from("transactions")
    .insert({ from: fromUser, to: toUser, amount, note: note || null });
  if (e3) throw new Error(e3.message);
}
