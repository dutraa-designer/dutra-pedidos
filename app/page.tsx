"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CircleHelp, Edit3, Image as ImageIcon, Package, Plus, RefreshCw, Search, Send, Trash2, WandSparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Piece = {
  id: number; code: number; description: string; quantity: number; productionStatus: string; productionValue: number;
  bathStatus: string | null; bathValue: number | null; shippingStatus: string | null; transportValue: number | null;
  mailStatus: string | null; billingStatus: string | null; photoKey?: string | null; paidValue?: number | null; notes: string | null;
};
type FormState = Omit<Piece, "id">;

const initialPieces: Piece[] = [
  { id: 1, code: 1, description: "PINGENTE LETRA M", quantity: 1, productionStatus: "FINALIZADO", productionValue: 35, bathStatus: "FINALIZADO", bathValue: 554.1, shippingStatus: "ENVIO", transportValue: 15, mailStatus: "ENVIADO", billingStatus: "OK", notes: "VALORES REF. AOS BANHOS DE CORRENTES E ARGOLAS INCLUSAS" },
  { id: 2, code: 2, description: "PINGENTE MULHER FLORES", quantity: 1, productionStatus: "FINALIZADO", productionValue: 35, bathStatus: "FINALIZADO", bathValue: 0, shippingStatus: "ENVIO", transportValue: 15, mailStatus: "ENVIADO", billingStatus: "OK", notes: "VALORES REF. AOS BANHOS DE CORRENTES E ARGOLAS INCLUSAS" },
  { id: 3, code: 3, description: "PINGENTE CACHORRO", quantity: 1, productionStatus: "FINALIZADO", productionValue: 35, bathStatus: "FINALIZADO", bathValue: 25.94, shippingStatus: "ENVIO", transportValue: 0, mailStatus: "ENVIADO", billingStatus: null, notes: null },
  { id: 4, code: 4, description: "PINGENTE MULHER MARAVILHA (20 MILESIMOS)", quantity: 1, productionStatus: "FINALIZADO", productionValue: 35, bathStatus: "FINALIZADO", bathValue: 29.66, shippingStatus: "ENVIO", transportValue: 15, mailStatus: "NÃO ENVIADO", billingStatus: null, notes: null },
  { id: 5, code: 5, description: "PINGENTE MULHER MARAVILHA + CORRENTE (RODIO)", quantity: 1, productionStatus: "EM PRODUÇÃO", productionValue: 35, bathStatus: null, bathValue: null, shippingStatus: null, transportValue: null, mailStatus: null, billingStatus: null, notes: null },
  { id: 6, code: 6, description: "PINGENTE KS (15 MILESIMOS)", quantity: 1, productionStatus: "FINALIZADO", productionValue: 35, bathStatus: "FINALIZADO", bathValue: null, shippingStatus: null, transportValue: null, mailStatus: null, billingStatus: null, notes: null },
  { id: 7, code: 7, description: "PINGENTE CONTABILIDADE", quantity: 1, productionStatus: "FINALIZADO", productionValue: 35, bathStatus: "FINALIZADO", bathValue: null, shippingStatus: null, transportValue: null, mailStatus: null, billingStatus: null, notes: null },
  { id: 8, code: 8, description: "PINGENTE FLOR DOS DESBRAVADORES", quantity: 1, productionStatus: "EM PRODUÇÃO", productionValue: 35, bathStatus: null, bathValue: null, shippingStatus: null, transportValue: null, mailStatus: null, billingStatus: null, notes: null },
  { id: 9, code: 9, description: "PINGENTE U.B (20 MILESIMOS)", quantity: 1, productionStatus: "EM PRODUÇÃO", productionValue: 35, bathStatus: null, bathValue: null, shippingStatus: null, transportValue: null, mailStatus: null, billingStatus: null, notes: null },
];
const emptyForm: FormState = { code: 10, description: "", quantity: 1, productionStatus: "EM PRODUÇÃO", productionValue: 35, bathStatus: null, bathValue: null, shippingStatus: null, transportValue: null, mailStatus: null, billingStatus: null, photoKey: null, paidValue: 0, notes: null };
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const totalCost = (piece: Piece) => (piece.productionValue || 0) + (piece.bathValue || 0) + (piece.transportValue || 0);
const paymentState = (piece: Piece) => {
  const total = totalCost(piece); const paid = Math.max(0, piece.paidValue || 0); const open = Math.max(0, total - paid);
  if (total > 0 && paid >= total) return { label: "Já pagou", tone: "green", open: 0 };
  if (paid > 0) return { label: "Pagamento parcial", tone: "amber", open };
  return { label: "Falta pagar", tone: "red", open };
};
const statusClass = (status: string | null) => {
  if (!status) return "status status-muted";
  if (["FINALIZADO", "ENVIADO", "OK"].includes(status)) return "status status-green";
  if (["EM PRODUÇÃO", "EM BANHO", "AGUARDANDO"].includes(status)) return "status status-amber";
  if (["NÃO ENVIADO", "PENDENTE"].includes(status)) return "status status-red";
  return "status status-blue";
};
const nextAction = (piece: Piece) => {
  if (piece.productionStatus !== "FINALIZADO") return { label: "Acompanhar produção", tone: "amber" };
  if (piece.bathStatus !== "FINALIZADO") return { label: "Definir banho", tone: "blue" };
  if (piece.mailStatus !== "ENVIADO") return { label: "Enviar peça", tone: "red" };
  if (piece.billingStatus !== "OK") return { label: "Conferir faturamento", tone: "purple" };
  return { label: "Tudo em dia", tone: "green" };
};
const toForm = (piece: Piece): FormState => {
  const copy = { ...piece } as Partial<Piece>;
  delete copy.id;
  return copy as FormState;
};

export default function Home() {
  const [pieces, setPieces] = useState<Piece[]>([]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false); const [editingId, setEditingId] = useState<number | null>(null); const [form, setForm] = useState<FormState>(emptyForm);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null); const [uploadingPhoto, setUploadingPhoto] = useState(false); const photoInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(""); const [filter, setFilter] = useState("TODOS"); const [notice, setNotice] = useState("");
  const loadPieces = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/pieces", { cache: "no-store" }); const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar as peças.");
      if (data.pieces?.length) setPieces(data.pieces);
      else { await fetch("/api/pieces/seed", { method: "POST" }); const seeded = await fetch("/api/pieces", { cache: "no-store" }); const seededData = await seeded.json(); setPieces(seededData.pieces?.length ? seededData.pieces : initialPieces); }
    } catch { setPieces(initialPieces); setNotice("Modo de demonstração: os dados iniciais estão visíveis, mas o banco ainda não respondeu."); }
    finally { setLoading(false); }
  };
  // The initial fetch synchronizes the view with the shared database.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadPieces(); }, []);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(""), 5500); return () => window.clearTimeout(timer); }, [notice]);
  const stats = useMemo(() => ({
    total: pieces.length, production: pieces.filter((p) => p.productionStatus !== "FINALIZADO").length,
    bath: pieces.filter((p) => p.productionStatus === "FINALIZADO" && p.bathStatus !== "FINALIZADO").length,
    shipping: pieces.filter((p) => p.mailStatus !== "ENVIADO").length, cost: pieces.reduce((sum, p) => sum + totalCost(p), 0), open: pieces.reduce((sum, p) => sum + paymentState(p).open, 0),
  }), [pieces]);
  const visiblePieces = useMemo(() => pieces.filter((piece) => {
    const normalized = query.toLowerCase().trim(); const matchesText = !normalized || `${piece.code} ${piece.description} ${piece.notes || ""}`.toLowerCase().includes(normalized);
    const matchesFilter = filter === "TODOS" || (filter === "PRODUÇÃO" && piece.productionStatus !== "FINALIZADO") || (filter === "BANHO" && piece.productionStatus === "FINALIZADO" && piece.bathStatus !== "FINALIZADO") || (filter === "ENVIO" && piece.mailStatus !== "ENVIADO") || (filter === "FATURAMENTO" && piece.billingStatus !== "OK") || (filter === "PAGAMENTO" && paymentState(piece).open > 0);
    return matchesText && matchesFilter;
  }).sort((a, b) => a.code - b.code), [pieces, query, filter]);
  const openNew = () => { setEditingId(null); setForm({ ...emptyForm, code: Math.max(0, ...pieces.map((p) => p.code)) + 1 }); setPhotoPreview(null); setFormOpen(true); };
  const openEdit = (piece: Piece) => { setEditingId(piece.id); setForm(toForm(piece)); setPhotoPreview(piece.photoKey ? `/api/pieces/photo?key=${encodeURIComponent(piece.photoKey)}` : null); setFormOpen(true); };
  const updateForm = (key: keyof FormState, value: string | number | null) => setForm((current) => ({ ...current, [key]: value }));
  const uploadPhoto = async (file: File) => {
    if (!file.type.startsWith("image/")) return setNotice("Escolha uma imagem JPG, PNG, WEBP ou GIF.");
    if (file.size > 5 * 1024 * 1024) return setNotice("A imagem deve ter no máximo 5 MB.");
    setPhotoPreview(URL.createObjectURL(file)); setUploadingPhoto(true);
    try { const body = new FormData(); body.append("file", file); const response = await fetch("/api/pieces/photo", { method: "POST", body }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Não foi possível enviar a foto."); updateForm("photoKey", data.key); setNotice("Foto adicionada. Salve a peça para concluir."); }
    catch (error) { setPhotoPreview(null); setNotice(error instanceof Error ? error.message : "Não foi possível enviar a foto."); }
    finally { setUploadingPhoto(false); }
  };
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) void uploadPhoto(file); event.target.value = ""; };
  const savePayment = async (piece: Piece, rawValue: string) => {
    const paidValue = Math.max(0, Number(rawValue) || 0);
    try {
      const response = await fetch("/api/pieces", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: piece.id, paidValue }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível atualizar o pagamento.");
      setPieces((current) => current.map((item) => item.id === piece.id ? data.piece : item));
      setNotice("Pagamento atualizado.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível atualizar o pagamento."); }
  };
  const savePiece = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!form.description.trim()) return setNotice("Informe a descrição da peça."); setSaving(true);
    try {
      if (uploadingPhoto) return setNotice("Aguarde o envio da foto terminar.");
      const response = await fetch("/api/pieces", { method: editingId ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(editingId ? { id: editingId, ...form } : form) }); const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar."); setPieces((current) => editingId ? current.map((piece) => piece.id === editingId ? data.piece : piece) : [...current, data.piece]); setFormOpen(false); setNotice(editingId ? "Peça atualizada." : "Peça adicionada ao controle.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível salvar."); } finally { setSaving(false); }
  };
  const deletePiece = async (piece: Piece) => {
    if (!window.confirm(`Excluir “${piece.description}”?`)) return;
    try { const response = await fetch("/api/pieces", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: piece.id }) }); if (!response.ok) throw new Error("Não foi possível excluir."); setPieces((current) => current.filter((item) => item.id !== piece.id)); setNotice("Peça removida."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível excluir."); }
  };
  return <main className="app-shell"><div className="app-orb orb-one" /><div className="app-orb orb-two" /><div className="app-container">
    <header className="topbar"><div className="brand-lockup"><div className="brand-mark"><WandSparkles size={19} /></div><div><p className="eyebrow">DUTRAA DESIGNER</p><h1>Controle de pingentes</h1></div></div><div className="top-actions"><span className="sync-pill"><span className="live-dot" /> Compartilhado</span><Button onClick={openNew}><Plus size={17} /> Nova peça</Button></div></header>
    <section className="intro-row"><div><p className="eyebrow accent-eyebrow">PAINEL DE PRODUÇÃO</p><h2>Visão geral do seu ateliê</h2><p className="intro-copy">Acompanhe cada pingente do corte ao envio, com os custos reunidos em um só lugar.</p></div><div className="date-note"><CircleHelp size={16} /><span>Dados salvos online<br /><strong>para vocês dois</strong></span></div></section>
    <section className="stats-grid" aria-label="Resumo da produção"><article className="stat-card stat-card-main"><div className="stat-icon violet"><Package size={19} /></div><div><span className="stat-label">Peças no controle</span><strong>{stats.total}</strong><small>cadastros ativos</small></div></article><article className="stat-card"><div className="stat-icon amber"><RefreshCw size={19} /></div><div><span className="stat-label">Em produção</span><strong>{stats.production}</strong><small>precisam de acompanhamento</small></div></article><article className="stat-card"><div className="stat-icon blue"><WandSparkles size={19} /></div><div><span className="stat-label">Aguardando banho</span><strong>{stats.bath}</strong><small>prontas para encaminhar</small></div></article><article className="stat-card"><div className="stat-icon coral"><Send size={19} /></div><div><span className="stat-label">Envios pendentes</span><strong>{stats.shipping}</strong><small>não marcados como enviados</small></div></article><article className="stat-card cost-card"><div className="cost-metric"><span className="stat-label">Custos lançados</span><strong>{money.format(stats.cost)}</strong><small>produção + banho + transporte</small></div><div className="cost-divider" aria-hidden="true" /><div className="cost-metric cost-open"><span className="stat-label">Falta pagar</span><strong>{money.format(stats.open)}</strong><small>saldo total em aberto</small></div></article></section>
    {notice && <div className="notice"><CircleHelp size={17} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Fechar aviso"><X size={16} /></button></div>}
    {formOpen && <section className="form-card"><div className="form-heading"><div><p className="eyebrow accent-eyebrow">{editingId ? "EDITAR CADASTRO" : "NOVO CADASTRO"}</p><h3>{editingId ? "Atualizar peça" : "Adicionar uma peça ao controle"}</h3></div><button className="icon-button" onClick={() => setFormOpen(false)} aria-label="Fechar formulário"><X size={18} /></button></div><form onSubmit={savePiece}><div className="form-grid form-grid-top"><label><span>Código / ref.</span><Input type="number" min="1" value={form.code} onChange={(e) => updateForm("code", Number(e.target.value))} /></label><label className="field-wide"><span>Peça / descrição *</span><Input autoFocus placeholder="Ex.: Pingente brasão da família" value={form.description} onChange={(e) => updateForm("description", e.target.value)} /></label><label><span>Quantidade</span><Input type="number" min="1" value={form.quantity} onChange={(e) => updateForm("quantity", Number(e.target.value))} /></label><label><span>Valor produção</span><Input type="number" min="0" step="0.01" value={form.productionValue} onChange={(e) => updateForm("productionValue", Number(e.target.value))} /></label></div><div className="photo-field"><div className="photo-preview">{photoPreview ? <img src={photoPreview} alt="Prévia do pingente" /> : <ImageIcon size={26} />}</div><div className="photo-copy"><strong>Foto do pingente</strong><span>Ajude a identificar a peça rapidamente. JPG, PNG, WEBP ou GIF até 5 MB.</span><input ref={photoInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handlePhotoChange} /><Button type="button" size="sm" variant="outline" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}>{uploadingPhoto ? "Enviando foto..." : photoPreview ? "Trocar foto" : "Adicionar foto"}</Button></div></div><div className="form-divider">Etapas do pedido</div><div className="form-grid form-grid-status"><label><span>Produção</span><select value={form.productionStatus} onChange={(e) => updateForm("productionStatus", e.target.value)}><option>EM PRODUÇÃO</option><option>FINALIZADO</option><option>CANCELADO</option></select></label><label><span>Status do banho</span><select value={form.bathStatus || ""} onChange={(e) => updateForm("bathStatus", e.target.value || null)}><option value="">Não definido</option><option>AGUARDANDO</option><option>EM BANHO</option><option>FINALIZADO</option></select></label><label><span>Envio / retirada</span><select value={form.shippingStatus || ""} onChange={(e) => updateForm("shippingStatus", e.target.value || null)}><option value="">Não definido</option><option>ENVIO</option><option>RETIRADA</option></select></label><label><span>Status Correios</span><select value={form.mailStatus || ""} onChange={(e) => updateForm("mailStatus", e.target.value || null)}><option value="">Não definido</option><option>NÃO ENVIADO</option><option>ENVIADO</option></select></label><label><span>Faturamento</span><select value={form.billingStatus || ""} onChange={(e) => updateForm("billingStatus", e.target.value || null)}><option value="">Não definido</option><option>PENDENTE</option><option>OK</option></select></label><label><span>Valor do banho</span><Input type="number" min="0" step="0.01" placeholder="R$ 0,00" value={form.bathValue ?? ""} onChange={(e) => updateForm("bathValue", e.target.value === "" ? null : Number(e.target.value))} /></label><label><span>Transporte</span><Input type="number" min="0" step="0.01" placeholder="R$ 0,00" value={form.transportValue ?? ""} onChange={(e) => updateForm("transportValue", e.target.value === "" ? null : Number(e.target.value))} /></label></div><label className="notes-field"><span>Observações</span><Textarea rows={2} placeholder="Detalhes de corrente, banho, cliente ou combinação de peças" value={form.notes || ""} onChange={(e) => updateForm("notes", e.target.value || null)} /></label><div className="form-footer"><span className="required-note">* campo obrigatório</span><div><Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving || uploadingPhoto}>{saving ? "Salvando..." : <><Check size={16} /> Salvar peça</>}</Button></div></div></form></section>}
    <section className="workspace-card"><div className="workspace-heading"><div><p className="eyebrow accent-eyebrow">ACOMPANHAMENTO</p><h3>Peças cadastradas <span>{visiblePieces.length}</span></h3></div><div className="table-tools"><div className="search-wrap"><Search size={16} /><input placeholder="Buscar peça ou código..." value={query} onChange={(e) => setQuery(e.target.value)} /></div><select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="TODOS">Todos os status</option><option value="PRODUÇÃO">Em produção</option><option value="BANHO">Aguardando banho</option><option value="ENVIO">Envios pendentes</option><option value="FATURAMENTO">Faturamento</option><option value="PAGAMENTO">Pagamento em aberto</option></select></div></div><div className="table-scroll"><table><thead><tr><th>FOTO</th><th>REF.</th><th>PEÇA / DETALHES</th><th>PRODUÇÃO</th><th>BANHO</th><th>LOGÍSTICA</th><th>CUSTO LANÇADO</th><th>PAGAMENTO</th><th>PRÓXIMA AÇÃO</th><th aria-label="Ações" /></tr></thead><tbody>{loading ? <tr><td colSpan={10} className="empty-state"><RefreshCw className="spin" size={22} /><span>Carregando controle...</span></td></tr> : visiblePieces.length === 0 ? <tr><td colSpan={10} className="empty-state"><Package size={24} /><span>Nenhuma peça encontrada com esses filtros.</span><Button size="sm" variant="outline" onClick={openNew}>Adicionar peça</Button></td></tr> : visiblePieces.map((piece) => { const action = nextAction(piece); const payment = paymentState(piece); return <tr key={piece.id}><td><div className="table-photo">{piece.photoKey ? <img src={`/api/pieces/photo?key=${encodeURIComponent(piece.photoKey)}`} alt="" /> : <ImageIcon size={15} />}</div></td><td><span className="ref-number">{String(piece.code).padStart(2, "0")}</span></td><td><div className="piece-name"><strong>{piece.description}</strong><span>{piece.quantity} {piece.quantity === 1 ? "unidade" : "unidades"}{piece.notes ? " · com observação" : ""}</span></div></td><td><span className={statusClass(piece.productionStatus)}>{piece.productionStatus || "Não definido"}</span><small className="cell-subvalue">{money.format(piece.productionValue || 0)}</small></td><td><span className={statusClass(piece.bathStatus)}>{piece.bathStatus || "Não definido"}</span><small className="cell-subvalue">{piece.bathValue === null ? "Valor não lançado" : money.format(piece.bathValue)}</small></td><td><div className="logistics-stack"><span className={statusClass(piece.mailStatus)}>{piece.mailStatus || "Não definido"}</span><small>{piece.shippingStatus ? `${piece.shippingStatus} · ${money.format(piece.transportValue || 0)}` : "Sem envio definido"}</small></div></td><td><strong className="cost-value">{money.format(totalCost(piece))}</strong><small className="cell-subvalue">produção + extras</small></td><td><div className="payment-cell"><span className={`payment-status payment-${payment.tone}`}>{payment.label}</span><input key={`${piece.id}-${piece.paidValue || 0}`} aria-label={`Valor pago para ${piece.description}`} type="number" min="0" step="0.01" defaultValue={piece.paidValue || ""} placeholder="0,00" onBlur={(e) => void savePayment(piece, e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} /><small>Em aberto: {money.format(payment.open)}</small></div></td><td><span className={`next-action action-${action.tone}`}><span />{action.label}</span></td><td><div className="row-actions"><button className="row-action" onClick={() => openEdit(piece)} aria-label={`Editar ${piece.description}`}><Edit3 size={15} /></button><button className="row-action danger" onClick={() => void deletePiece(piece)} aria-label={`Excluir ${piece.description}`}><Trash2 size={15} /></button></div></td></tr>; })}</tbody></table></div><footer className="table-footer"><span><strong>{visiblePieces.length}</strong> de {pieces.length} peças exibidas</span><span className="legend"><i className="legend-dot dot-green" /> finalizado <i className="legend-dot dot-amber" /> em andamento <i className="legend-dot dot-red" /> requer atenção</span></footer></section>
    <footer className="app-footer"><span>Controle de produção de semijoias</span><span className="footer-dot">•</span><span>Dados sincronizados online</span></footer>
  </div></main>;
}
