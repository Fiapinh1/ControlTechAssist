import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabase = Boolean(url && anon)
export const supabase = hasSupabase ? createClient(url, anon) : null

const localKey = (table) => `controltech:${table}`
const readLocal = (table) => JSON.parse(localStorage.getItem(localKey(table)) || '[]')
const writeLocal = (table, rows) => localStorage.setItem(localKey(table), JSON.stringify(rows))

export async function getSession() {
  if (!supabase) return { user: { id: 'local-user', email: 'modo-local@controltech.app' } }
  const { data } = await supabase.auth.getSession()
  return { user: data.session?.user || null }
}

export async function signIn(email, password) {
  if (!supabase) return { error: null }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error }
}

export async function signUp(email, password) {
  if (!supabase) return { error: null }
  const { error } = await supabase.auth.signUp({ email, password })
  return { error }
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut()
}

export async function listRows(table, userId, order = 'created_at') {
  if (!supabase) {
    return readLocal(table).filter(row => row.user_id === userId || userId === 'local-user')
      .sort((a, b) => String(b[order] || '').localeCompare(String(a[order] || '')))
  }
  const { data, error } = await supabase.from(table).select('*').order(order, { ascending: false })
  if (error) throw error
  return data || []
}

export async function insertRow(table, payload) {
  if (!supabase) {
    const rows = readLocal(table)
    const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...payload }
    rows.push(row); writeLocal(table, rows); return row
  }
  const { data, error } = await supabase.from(table).insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateRow(table, id, payload) {
  if (!supabase) {
    const rows = readLocal(table)
    const idx = rows.findIndex(row => row.id === id)
    if (idx >= 0) rows[idx] = { ...rows[idx], ...payload, updated_at: new Date().toISOString() }
    writeLocal(table, rows); return rows[idx]
  }
  const { data, error } = await supabase.from(table).update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteRow(table, id) {
  if (!supabase) {
    writeLocal(table, readLocal(table).filter(row => row.id !== id)); return
  }
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}
