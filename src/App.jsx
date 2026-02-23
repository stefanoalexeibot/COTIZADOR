import { useState, useRef } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const API = "/api/claude";
const MODEL = "claude-sonnet-4-20250514";

const GOLD = "#c8a84b";
const BG = "#0f0f0f";
const BG2 = "#141414";
const BG3 = "#1a1a1a";
const BORDER = "#2a2a2a";
const TEXT = "#e8e0d0";
const MUTED = "#666";

const mono = "'Courier New', monospace";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n) =>
  Number(n || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

async function callClaude(system, messages) {
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 2000, system, messages }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${r.status}`);
  }
  const d = await r.json();
  const text = (d.content || []).map((b) => b.text || "").join("").trim();
  return text.replace(/```json|```/g, "").trim();
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = (e) => res(e.target.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function buildImageMsg(base64, mediaType, text) {
  const isPdf = mediaType === "application/pdf";
  return {
    role: "user",
    content: [
      isPdf
        ? { type: "document", source: { type: "base64", media_type: mediaType, data: base64 } }
        : { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
      { type: "text", text },
    ],
  };
}

// ─── STEP INDICATOR ──────────────────────────────────────────────────────────
function Steps({ current }) {
  const steps = ["Lista del cliente", "Cotización proveedores", "Comparar y ajustar", "Generar cotización"];
  return (
    <div style={{ display: "flex", gap: 0, marginBottom: 32 }}>
      {steps.map((s, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
              {i > 0 && <div style={{ flex: 1, height: 2, background: done || active ? GOLD : BORDER }} />}
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: active ? GOLD : done ? "#5a4a20" : BG2,
                border: `2px solid ${active || done ? GOLD : BORDER}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: active ? BG : done ? GOLD : MUTED,
                fontSize: 12, fontWeight: "bold", flexShrink: 0,
              }}>
                {done ? "✓" : i + 1}
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: done ? GOLD : BORDER }} />}
            </div>
            <div style={{ fontSize: 10, color: active ? GOLD : done ? "#888" : MUTED, letterSpacing: 1, textAlign: "center" }}>
              {s.toUpperCase()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── UPLOAD ZONE ─────────────────────────────────────────────────────────────
function UploadZone({ label, onFile, fileName, accept = "image/*,.pdf" }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);
  return (
    <div
      onClick={() => ref.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]); }}
      style={{
        border: `2px dashed ${drag ? GOLD : BORDER}`,
        borderRadius: 6, padding: "28px 16px",
        textAlign: "center", cursor: "pointer",
        background: drag ? "rgba(200,168,75,0.04)" : BG2,
        transition: "all .2s",
      }}>
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }}
        onChange={(e) => onFile(e.target.files[0])} />
      <div style={{ fontSize: 28 }}>{fileName ? "📄" : "⬆"}</div>
      <div style={{ color: fileName ? GOLD : MUTED, fontSize: 13, marginTop: 8 }}>
        {fileName || label}
      </div>
      <div style={{ color: "#444", fontSize: 11, marginTop: 4 }}>JPG · PNG · PDF</div>
    </div>
  );
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 6, padding: 20, ...style }}>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 10, color: MUTED, letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>{children}</div>;
}

function Btn({ children, onClick, disabled, variant = "primary", style }) {
  const isPrimary = variant === "primary";
  const isOutline = variant === "outline";
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "11px 22px",
      background: disabled ? "#222" : isPrimary ? `linear-gradient(135deg, ${GOLD}, #a08030)` : "transparent",
      color: disabled ? MUTED : isPrimary ? BG : isOutline ? MUTED : TEXT,
      border: isOutline ? `1px solid ${BORDER}` : "none",
      borderRadius: 5, fontFamily: mono, fontSize: 12,
      fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all .2s", ...style,
    }}>
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <div style={{ textAlign: "center", padding: 50, color: MUTED }}>
      <div style={{ fontSize: 36, display: "inline-block", animation: "spin 1s linear infinite" }}>⚙</div>
      <div style={{ marginTop: 12, letterSpacing: 3, fontSize: 11 }}>PROCESANDO CON IA...</div>
    </div>
  );
}

function Err({ msg }) {
  return msg ? (
    <div style={{ marginTop: 10, color: "#e05555", fontSize: 12, padding: "10px 14px", background: "#1a0f0f", borderRadius: 4, border: "1px solid #5a2020" }}>
      {msg}
    </div>
  ) : null;
}

// ─── STEP 1: CLIENT LIST ──────────────────────────────────────────────────────
function Step1({ onNext }) {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleFile = (f) => { setFile(f); setFileName(f?.name || ""); setErr(""); };

  const analyze = async () => {
    if (mode === "text" && !text.trim()) { setErr("Ingresa la lista del cliente."); return; }
    if (mode === "file" && !file) { setErr("Sube un archivo."); return; }
    setLoading(true); setErr("");
    try {
      const system = `Eres experto en tornillería industrial. Extrae TODOS los artículos de tornillería de la lista proporcionada.
Responde SOLO con JSON válido, sin markdown:
{"items":[{"descripcion":"Tornillo hexagonal 3/8 x 1 zinc grado 2","cantidad":1000,"unidad":"pza"}]}`;
      let messages;
      if (mode === "text") {
        messages = [{ role: "user", content: `Lista del cliente:\n\n${text}` }];
      } else {
        const b64 = await fileToBase64(file);
        messages = [buildImageMsg(b64, file.type, "Extrae todos los artículos de tornillería de este documento.")];
      }
      const raw = await callClaude(system, messages);
      const parsed = JSON.parse(raw);
      onNext(parsed.items || []);
    } catch (e) {
      setErr("Error al procesar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <Card>
        <Label>Fuente de la lista</Label>
        <div style={{ display: "flex", gap: 0, marginBottom: 16, border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden", width: "fit-content" }}>
          {[["text", "📋 Texto"], ["file", "📎 Archivo"]].map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: "8px 18px", background: mode === m ? GOLD : "transparent",
              color: mode === m ? BG : MUTED, border: "none", cursor: "pointer",
              fontFamily: mono, fontWeight: "bold", fontSize: 12, letterSpacing: 1,
            }}>{l}</button>
          ))}
        </div>
        {mode === "text" ? (
          <textarea
            value={text} onChange={(e) => setText(e.target.value)}
            placeholder={"Pega la lista del cliente aquí...\n\nEj:\nTORNILLO DE 3/8 X 1 CABEZA HEXAGONAL 1000pcs\nGUASA PLANA 1/2 1000 pcs\n..."}
            style={{
              width: "100%", height: 220, background: "#111", border: `1px solid ${BORDER}`,
              borderRadius: 5, color: TEXT, fontFamily: mono, fontSize: 12,
              padding: 14, resize: "vertical", outline: "none", lineHeight: 1.6, boxSizing: "border-box",
            }} />
        ) : (
          <UploadZone label="Arrastra imagen o PDF del cliente" onFile={handleFile} fileName={fileName} />
        )}
        {loading ? <Spinner /> : (
          <Btn onClick={analyze} disabled={loading} style={{ width: "100%", marginTop: 14 }}>
            ⚙ Extraer artículos con IA
          </Btn>
        )}
        <Err msg={err} />
      </Card>

      <Card>
        <Label>Ejemplo de lista</Label>
        <div style={{ background: "#111", borderRadius: 5, padding: 14, fontSize: 11, color: "#888", lineHeight: 2, fontFamily: mono }}>
          {`TORNILLO DE 3/8 X 1 CAB. HEX. 1000pcs
TORNILLOS COCHE 1/4 X 1 1/4  1000 pc
GUASA Y RONDANA PRESION 1/2 1000pcs
GUASA PLANA 1/2  1000 pcs
GUASA PLANA 3/8  2000 pcs
TORNILLO 1/4 X 1 1/2  1000pcs
TORNILLO CONICO 3/8 X 1 1/4  1000 pcs
TORNILLO CONICO 3/8 X 1  1000pcs
TORNILLO CONICO 3/8 X 1/2  1000pcs
TORNILLO 2 1/2 X 3/8 CAB. HEX.  1000 pcs`}
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: MUTED, lineHeight: 1.6 }}>
          ↑ Puedes pegar texto como este, o subir la imagen/PDF que te manda el cliente directamente.
        </div>
      </Card>
    </div>
  );
}

// ─── STEP 2: SUPPLIER QUOTES ──────────────────────────────────────────────────
function Step2({ items, onNext, onBack }) {
  const [prov1, setProv1] = useState({ name: "Proveedor 1", file: null, fileName: "", prices: null });
  const [prov2, setProv2] = useState({ name: "Proveedor 2", file: null, fileName: "", prices: null });
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [err, setErr] = useState("");

  const itemList = items.map((it, i) => `${i + 1}. ${it.descripcion} — ${it.cantidad} ${it.unidad}`).join("\n");

  const makeSystem = (provName) => `Eres experto en tornillería. El proveedor ${provName} envió su cotización en imagen o PDF.

REGLAS DE EXTRACCIÓN:
1. La cotización puede tener columnas como: Cantidad, Clave, Descripción, Precio Unitario, Desc, Desc2, "Prec c/dto", IVA, Importe.
2. USA SIEMPRE la columna "Prec c/dto" o "Precio con descuento" como precio. Si no existe esa columna, usa "Precio Unitario".
3. Para cada artículo de nuestra lista, busca la fila del proveedor cuya DESCRIPCIÓN sea equivalente (puede estar abreviada, en diferente orden de palabras, o con sinónimos). 
   ARANDELAS / RONDANAS / GUASAS:
   - "GUASA" = "HUASA" = "ARANDELA" = "RONDANA" = "ROND" = "RONDANA PLANA" = "ARANDELA PLANA"
   - "GUASA DE PRESION" = "HUASA DE PRESION" = "ARANDELA DE PRESION" = "RONDANA DE PRESION" = "ROND PRESION" = "LOCK WASHER"
   - "GUASA Y RONDANA DE PRESION" puede ser un solo artículo que incluye ambas
   
   TORNILLOS — ABREVIACIONES COMUNES:
   - "TOR HEX" = "TOR HEXAGONAL" = "TOR C/HEXAGONAL" = "TORNILLO HEXAGONAL" = "TORNILLO CABEZA HEXAGONAL" = "TORNILLO CAB HEX"
   - "TOR SKT" = "TOR SOCKET" = "TORNILLO SOCKET" = "TORNILLO ALLEN" = "TOR ALLEN"
   - "TOR SKT C/PLANA" = "TOR SOCKET C/PLANA" = "TORNILLO SOCKET CABEZA PLANA" = "TORNILLO CONICO" = "TORNILLO ALLEN PLANO" = "FLAT HEAD SOCKET"
   - "TOR COCHE" = "TOR C/COCHE" = "TORNILLO COCHE" = "TORNILLO DE CABEZA DE COCHE" = "TORNILLO CARRIAGE" = "TORNILLO CABEZA REDONDA CUELLO CUADRADO"
   - "TOR SKT C/BOTON" = "TORNILLO BOTON" = "BUTTON HEAD SOCKET"
   - "TOR" al inicio = abreviación de TORNILLO
   
   TUERCAS:
   - "TUERCA HEX" = "TUERCA HEXAGONAL" = "NUT HEX" = "TUERCA"
   - "TUERCA NYLON" = "TUERCA CON SEGURO" = "TUERCA AUTOFRENANTE" = "NYLOC"
   
   MEDIDAS — interpreta como equivalentes:
   - "3/8-16 x 1" = "3/8 x 1" (el -16 es el paso de rosca, puede omitirse)
   - "1/4-20 x 1-1/2" = "1/4 x 1 1/2"
   - NGO = NEGRO, GR-2/GR-5/GR-8 = grado del tornillo (puede ignorarse para el match)
   - ZINC / ZN / GALV = acabado superficial (puede ignorarse para el match si no hay otra coincidencia)
4. Si no encuentras equivalente, pon null.
5. Verifica que la cantidad del proveedor coincida con la nuestra (puede haber diferencia).

Nuestra lista de artículos (idx empieza en 0):
${itemList}

Responde SOLO con JSON válido, sin markdown:
{"precios":[{"idx":0,"precioUnitario":0.7271,"descripcionProveedor":"TOR C/HEXAGONAL GR-5 NGO - 3/8-16 x 1","cantidad":1200},{"idx":1,"precioUnitario":null,"descripcionProveedor":null,"cantidad":null}]}`;

  const analyze = async (prov, setProv, setLoading, num) => {
    if (!prov.file) { setErr(`Sube la cotización del ${prov.name}`); return; }
    setLoading(true); setErr("");
    try {
      const b64 = await fileToBase64(prov.file);
      const messages = [buildImageMsg(b64, prov.file.type, `Extrae los precios que cotizó ${prov.name} para cada artículo de la lista.`)];
      const raw = await callClaude(makeSystem(prov.name), messages);
      const parsed = JSON.parse(raw);
      const prices = parsed.precios || [];
      setProv((prev) => ({ ...prev, prices }));
    } catch (e) {
      setErr(`Error al procesar ${prov.name}.`);
    } finally {
      setLoading(false);
    }
  };

  const canContinue = prov1.prices || prov2.prices;

  const proceed = () => {
    const enriched = items.map((it, i) => {
      const m1 = prov1.prices?.find((p) => p.idx === i);
      const m2 = prov2.prices?.find((p) => p.idx === i);
      const p1 = m1?.precioUnitario ?? null;
      const p2 = m2?.precioUnitario ?? null;
      return {
        ...it, p1, p2,
        p1Desc: m1?.descripcionProveedor ?? null,
        p2Desc: m2?.descripcionProveedor ?? null,
        p1Qty: m1?.cantidad ?? null,
        p2Qty: m2?.cantidad ?? null,
        selectedPrice: p1 ?? p2 ?? 0,
        selectedProv: p1 !== null ? 1 : p2 !== null ? 2 : null
      };
    });
    onNext(enriched, prov1.name, prov2.name);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {[
          [prov1, setProv1, loading1, setLoading1, 1],
          [prov2, setProv2, loading2, setLoading2, 2],
        ].map(([prov, setProv, loading, setLoading, num]) => (
          <Card key={num}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <Label>{prov.name}</Label>
              <input
                value={prov.name}
                onChange={(e) => setProv((p) => ({ ...p, name: e.target.value }))}
                style={{ background: "transparent", border: `1px solid ${BORDER}`, color: GOLD, fontFamily: mono, fontSize: 12, padding: "4px 8px", borderRadius: 4, width: 140, outline: "none" }}
                placeholder="Nombre proveedor"
              />
            </div>
            <UploadZone
              label={`Arrastra cotización de ${prov.name}`}
              onFile={(f) => setProv((p) => ({ ...p, file: f, fileName: f?.name || "", prices: null }))}
              fileName={prov.fileName}
            />
            {loading ? <Spinner /> : (
              <Btn onClick={() => analyze(prov, setProv, setLoading, num)} style={{ width: "100%", marginTop: 12 }}
                disabled={!prov.file || loading}>
                ⚙ Extraer precios
              </Btn>
            )}
            {prov.prices && (
              <div style={{ marginTop: 10, padding: "8px 12px", background: "#0f1a0f", border: "1px solid #2a4a2a", borderRadius: 4, fontSize: 11, color: "#6a9a6a" }}>
                ✓ {prov.prices.filter((p) => p.precioUnitario !== null).length} de {items.length} artículos cotizados
              </div>
            )}
          </Card>
        ))}
      </div>

      <Err msg={err} />

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Btn variant="outline" onClick={onBack}>← Atrás</Btn>
        <Btn onClick={proceed} disabled={!canContinue}>
          Comparar precios →
        </Btn>
      </div>
    </div>
  );
}

// ─── STEP 3: COMPARE & ADJUST ─────────────────────────────────────────────────
function Step3({ items, prov1Name, prov2Name, utilidad, setUtilidad, onNext, onBack }) {
  const [rows, setRows] = useState(items);

  const update = (idx, field, value) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));

  const selectProv = (idx, provNum) => {
    const row = rows[idx];
    const price = provNum === 1 ? row.p1 : row.p2;
    if (price !== null) update(idx, "selectedPrice", price);
    update(idx, "selectedProv", provNum);
  };

  const subtotal = rows.reduce((s, r) => s + (r.cantidad || 0) * (r.selectedPrice || 0), 0);
  const utilMonto = subtotal * (utilidad / 100);
  const total = subtotal + utilMonto;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Utilidad bar */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Label style={{ marginBottom: 0, whiteSpace: "nowrap" }}>MARGEN DE UTILIDAD</Label>
          <input type="range" min={0} max={100} value={utilidad} onChange={(e) => setUtilidad(Number(e.target.value))}
            style={{ flex: 1, accentColor: GOLD }} />
          <input type="number" min={0} max={100} value={utilidad} onChange={(e) => setUtilidad(Number(e.target.value))}
            style={{ width: 55, background: BG, border: `1px solid ${GOLD}`, color: GOLD, fontFamily: mono, fontSize: 18, fontWeight: "bold", textAlign: "center", padding: 4, borderRadius: 4 }} />
          <span style={{ color: GOLD, fontWeight: "bold" }}>%</span>
        </div>
      </Card>

      {/* Comparison table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "30px 1fr 70px 110px 110px 120px 120px",
          padding: "10px 16px", background: BG3, fontSize: 10, color: MUTED, letterSpacing: 2, gap: 8,
        }}>
          <div>#</div><div>DESCRIPCIÓN</div><div>CANT.</div>
          <div style={{ color: "#6a9a6a" }}>{prov1Name.toUpperCase()}</div>
          <div style={{ color: "#6a7a9a" }}>{prov2Name.toUpperCase()}</div>
          <div>MI PRECIO</div><div style={{ color: GOLD }}>+ UTILIDAD</div>
        </div>

        {rows.map((row, idx) => {
          const myPrice = parseFloat(row.selectedPrice) || 0;
          const sub = row.cantidad * myPrice;
          const conUtil = sub * (1 + utilidad / 100);
          const hasBoth = row.p1 !== null && row.p2 !== null;

          return (
            <div key={idx} style={{
              display: "grid", gridTemplateColumns: "30px 1fr 70px 110px 110px 120px 120px",
              padding: "10px 16px", gap: 8, alignItems: "center",
              borderTop: `1px solid ${BORDER}`,
              background: idx % 2 === 0 ? BG2 : "#121212",
            }}>
              <div style={{ color: MUTED, fontSize: 11 }}>{idx + 1}</div>
              <input value={row.descripcion} onChange={(e) => update(idx, "descripcion", e.target.value)}
                style={{ background: "transparent", border: "none", color: TEXT, fontFamily: mono, fontSize: 11, outline: "none", width: "100%" }} />
              <input type="number" value={row.cantidad} onChange={(e) => update(idx, "cantidad", e.target.value)}
                style={{ background: "transparent", border: "none", color: TEXT, fontFamily: mono, fontSize: 11, outline: "none", width: "100%" }} />

              {/* Prov 1 */}
              <div
                onClick={() => row.p1 !== null && selectProv(idx, 1)}
                title={row.p1Desc ? `${row.p1Desc}${row.p1Qty && row.p1Qty !== row.cantidad ? ` ⚠ qty proveedor: ${row.p1Qty}` : ""}` : ""}
                style={{
                  padding: "4px 8px", borderRadius: 4, fontSize: 11, cursor: row.p1 !== null ? "pointer" : "default",
                  background: row.selectedProv === 1 ? "rgba(106,154,106,0.15)" : "transparent",
                  border: `1px solid ${row.selectedProv === 1 ? "#2a5a2a" : BORDER}`,
                  color: row.p1 !== null ? (hasBoth && row.p1 <= row.p2 ? "#6a9a6a" : TEXT) : MUTED,
                  transition: "all .15s", position: "relative",
                }}>
                {row.p1 !== null ? fmt(row.p1) : "—"}
                {row.selectedProv === 1 && <span style={{ marginLeft: 4, color: "#6a9a6a" }}>✓</span>}
                {row.p1Qty && row.p1Qty !== row.cantidad && <span style={{ marginLeft: 4, color: "#e0a020", fontSize: 10 }}>⚠</span>}
              </div>

              {/* Prov 2 */}
              <div
                onClick={() => row.p2 !== null && selectProv(idx, 2)}
                title={row.p2Desc ? `${row.p2Desc}${row.p2Qty && row.p2Qty !== row.cantidad ? ` ⚠ qty proveedor: ${row.p2Qty}` : ""}` : ""}
                style={{
                  padding: "4px 8px", borderRadius: 4, fontSize: 11, cursor: row.p2 !== null ? "pointer" : "default",
                  background: row.selectedProv === 2 ? "rgba(106,120,154,0.15)" : "transparent",
                  border: `1px solid ${row.selectedProv === 2 ? "#2a3a5a" : BORDER}`,
                  color: row.p2 !== null ? (hasBoth && row.p2 <= row.p1 ? "#6a7a9a" : TEXT) : MUTED,
                  transition: "all .15s",
                }}>
                {row.p2 !== null ? fmt(row.p2) : "—"}
                {row.selectedProv === 2 && <span style={{ marginLeft: 4, color: "#6a7a9a" }}>✓</span>}
                {row.p2Qty && row.p2Qty !== row.cantidad && <span style={{ marginLeft: 4, color: "#e0a020", fontSize: 10 }}>⚠</span>}
              </div>

              {/* My price (editable) */}
              <input
                type="number"
                value={row.selectedPrice}
                onChange={(e) => update(idx, "selectedPrice", e.target.value)}
                style={{
                  background: "#111", border: `1px solid ${BORDER}`, color: TEXT,
                  fontFamily: mono, fontSize: 11, padding: "4px 8px", borderRadius: 4,
                  outline: "none", width: "100%", boxSizing: "border-box",
                }} />

              <div style={{ color: GOLD, fontSize: 12, fontWeight: "bold" }}>{fmt(conUtil)}</div>
            </div>
          );
        })}

        {/* Totals */}
        <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 70px 110px 110px 120px 120px", padding: "14px 16px", gap: 8, background: BG3, borderTop: `2px solid ${GOLD}` }}>
          <div /><div style={{ color: GOLD, fontWeight: "bold", letterSpacing: 2, fontSize: 11 }}>TOTALES</div>
          <div /><div /><div />
          <div style={{ color: TEXT, fontSize: 12 }}>
            <div style={{ fontSize: 10, color: MUTED }}>Subtotal: {fmt(subtotal)}</div>
            <div style={{ fontSize: 10, color: MUTED }}>Utilidad: {fmt(utilMonto)}</div>
          </div>
          <div style={{ color: GOLD, fontSize: 16, fontWeight: "bold" }}>{fmt(total)}</div>
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Btn variant="outline" onClick={onBack}>← Atrás</Btn>
        <Btn onClick={() => onNext(rows)}>Generar cotización →</Btn>
      </div>
    </div>
  );
}

// ─── STEP 4: GENERATE QUOTE ───────────────────────────────────────────────────
function Step4({ items, utilidad, onBack }) {
  const [cliente, setCliente] = useState({ empresa: "", contacto: "", email: "" });
  const [folio, setFolio] = useState(`COT-${Date.now().toString().slice(-6)}`);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [generated, setGenerated] = useState(false);

  const subtotal = items.reduce((s, r) => s + (r.cantidad || 0) * (parseFloat(r.selectedPrice) || 0), 0);
  const utilMonto = subtotal * (utilidad / 100);
  const total = subtotal + utilMonto;
  const iva = total * 0.16;
  const totalConIva = total + iva;

  const generate = async () => {
    setLoading(true); setErr("");
    try {
      // Build Python script to create the XLSX in the exact template format
      const itemsJson = JSON.stringify(items.map((it) => ({
        desc: it.descripcion,
        qty: it.cantidad,
        unit: it.unidad,
        price: (parseFloat(it.selectedPrice) || 0) * (1 + utilidad / 100),
      })));

      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 100,
          messages: [{ role: "user", content: "respond with exactly: ok" }],
        }),
      });
      // We won't actually use Claude here, just trigger the download
      setGenerated(true);
    } catch (e) {
      setErr("Error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    const today = new Date().toLocaleDateString("es-MX");
    const header = ["COTIZACIÓN", "", "", "", "", ""];
    const meta = [
      ["Folio:", folio, "", "Empresa cliente:", cliente.empresa, ""],
      ["Fecha:", today, "", "Contacto:", cliente.contacto, ""],
      ["Vendedor:", "Alejandro Luna", "", "Email:", cliente.email, ""],
      ["Email:", "a.luna@tornillosam.com", "", "", "", ""],
      ["Tel:", "81 2198 0008", "", "Vigencia:", "5 días hábiles", ""],
      ["", "", "", "Condiciones:", "CONTADO ANTICIPADO", ""],
      [],
      ["#", "Descripción", "Cantidad", "Unidad", "P. Unitario", "Importe"],
    ];
    const rows = items.map((it, i) => {
      const price = (parseFloat(it.selectedPrice) || 0) * (1 + utilidad / 100);
      return [i + 1, it.descripcion, it.cantidad, it.unidad, price.toFixed(2), (it.cantidad * price).toFixed(2)];
    });
    const footer = [
      [],
      ["", "", "", "", "Subtotal MXN$", total.toFixed(2)],
      ["", "", "", "", "16% IVA MXN$", iva.toFixed(2)],
      ["", "", "", "", "TOTAL MXN$", totalConIva.toFixed(2)],
      [],
      ["", "Datos Bancarios:", "Banorte Cuenta: 0242546816  Clabe: 072580002425468168"],
      ["", "Notificación de Pago:", "e.vazquez@tornillosam.com"],
    ];
    const all = [header, ...meta, ...rows, ...footer];
    const csv = all.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${folio}.csv`; a.click();
  };

  const printQuote = () => {
    const today = new Date().toLocaleDateString("es-MX");
    const rowsHtml = items.map((it, i) => {
      const price = (parseFloat(it.selectedPrice) || 0) * (1 + utilidad / 100);
      return `<tr>
        <td style="text-align:center;border:1px solid #ddd;padding:6px">${i + 1}</td>
        <td style="border:1px solid #ddd;padding:6px">${it.descripcion}</td>
        <td style="text-align:center;border:1px solid #ddd;padding:6px">${it.cantidad}</td>
        <td style="text-align:center;border:1px solid #ddd;padding:6px">${it.unidad}</td>
        <td style="text-align:right;border:1px solid #ddd;padding:6px">$ ${price.toFixed(2)}</td>
        <td style="text-align:right;border:1px solid #ddd;padding:6px">$ ${(it.cantidad * price).toFixed(2)}</td>
      </tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${folio}</title>
    <style>body{font-family:Arial,sans-serif;font-size:11px;margin:20px}table{width:100%;border-collapse:collapse}.header{display:flex;justify-content:space-between;margin-bottom:16px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;font-size:10px}.meta-block{border:1px solid #eee;padding:8px;border-radius:4px}h1{font-size:20px;margin:0;color:#333}.folio{font-size:13px;color:#c00;font-weight:bold}th{background:#f5f5f5;border:1px solid #ddd;padding:7px;text-align:left}.totals td{font-weight:bold}.notice{font-size:9px;color:#888;margin-top:8px}@media print{body{margin:10px}}</style>
    </head><body>
    <div class="header"><div><h1>COTIZACIÓN</h1></div><div style="text-align:right"><div class="folio">Folio: ${folio}</div><div>Fecha: ${today}</div></div></div>
    <div class="meta">
      <div class="meta-block"><b>Vendedor:</b> Alejandro Luna<br><b>Email:</b> a.luna@tornillosam.com<br><b>Tel:</b> 81 2198 0008</div>
      <div class="meta-block"><b>Empresa:</b> ${cliente.empresa || "—"}<br><b>Contacto:</b> ${cliente.contacto || "—"}<br><b>Email:</b> ${cliente.email || "—"}<br><b>Vigencia:</b> 5 días hábiles · <b>Pago:</b> Contado anticipado</div>
    </div>
    <p style="font-size:9px;color:#888">**cot. Sujeta a cambios sin previo aviso** | ***El precio podrá variar de acuerdo a la existencia***</p>
    <table><thead><tr><th>#</th><th>Descripción</th><th>Cantidad</th><th>Unidad</th><th>P. Unitario</th><th>Importe</th></tr></thead>
    <tbody>${rowsHtml}</tbody></table>
    <table style="margin-left:auto;margin-top:12px;width:280px" class="totals">
      <tr><td style="padding:5px">Sub total Mxn$</td><td style="text-align:right;padding:5px">$ ${total.toFixed(2)}</td></tr>
      <tr><td style="padding:5px">16% IVA Mxn$</td><td style="text-align:right;padding:5px">$ ${iva.toFixed(2)}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:6px;font-size:13px">Total Mxn$</td><td style="text-align:right;padding:6px;font-size:13px">$ ${totalConIva.toFixed(2)}</td></tr>
    </table>
    <div class="notice" style="margin-top:16px">Datos Bancarios Moneda Nacional<br>Banorte Cuenta: 0242546816 | Clabe Interbancaria: 072580002425468168<br>Notificación de Pago: e.vazquez@tornillosam.com</div>
    <script>window.onload=()=>window.print()</script></body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Client info */}
        <Card>
          <Label>Datos del cliente</Label>
          {[["empresa", "Empresa / Razón Social"], ["contacto", "Nombre del contacto"], ["email", "Email del contacto"]].map(([k, lbl]) => (
            <div key={k} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: MUTED, marginBottom: 5 }}>{lbl}</div>
              <input value={cliente[k]} onChange={(e) => setCliente((c) => ({ ...c, [k]: e.target.value }))}
                style={{ width: "100%", background: "#111", border: `1px solid ${BORDER}`, color: TEXT, fontFamily: mono, fontSize: 12, padding: "8px 12px", borderRadius: 4, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <div>
            <div style={{ fontSize: 10, color: MUTED, marginBottom: 5 }}>Folio</div>
            <input value={folio} onChange={(e) => setFolio(e.target.value)}
              style={{ width: "100%", background: "#111", border: `1px solid ${GOLD}`, color: GOLD, fontFamily: mono, fontSize: 12, padding: "8px 12px", borderRadius: 4, outline: "none", boxSizing: "border-box" }} />
          </div>
        </Card>

        {/* Summary */}
        <Card>
          <Label>Resumen final</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[["Artículos", items.length], ["Subtotal + utilidad", fmt(total)], ["16% IVA", fmt(iva)]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ color: MUTED }}>{k}</span>
                <span style={{ color: TEXT, fontWeight: "bold" }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: 14, background: BG3, borderRadius: 5, border: `1px solid ${GOLD}` }}>
              <span style={{ color: GOLD, fontSize: 15, fontWeight: "bold" }}>TOTAL CON IVA</span>
              <span style={{ color: GOLD, fontSize: 20, fontWeight: "bold" }}>{fmt(totalConIva)}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Btn onClick={printQuote} style={{ flex: 1 }}>🖨 Imprimir / PDF</Btn>
            <Btn variant="outline" onClick={downloadCSV} style={{ flex: 1 }}>↓ Exportar CSV</Btn>
          </div>
        </Card>
      </div>

      {/* Preview table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
          <Label>Vista previa de partidas</Label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 70px 70px 120px 120px", padding: "8px 16px", background: BG3, fontSize: 10, color: MUTED, letterSpacing: 2, gap: 8 }}>
          <div>#</div><div>DESCRIPCIÓN</div><div>CANT.</div><div>UNIDAD</div><div>P. UNITARIO</div><div>IMPORTE</div>
        </div>
        {items.map((it, i) => {
          const price = (parseFloat(it.selectedPrice) || 0) * (1 + utilidad / 100);
          const imp = it.cantidad * price;
          return (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "30px 1fr 70px 70px 120px 120px",
              padding: "8px 16px", gap: 8, borderTop: `1px solid ${BORDER}`,
              background: i % 2 === 0 ? BG2 : "#121212", fontSize: 12,
            }}>
              <div style={{ color: MUTED }}>{i + 1}</div>
              <div style={{ color: TEXT }}>{it.descripcion}</div>
              <div style={{ color: TEXT }}>{it.cantidad}</div>
              <div style={{ color: MUTED }}>{it.unidad}</div>
              <div style={{ color: TEXT }}>{fmt(price)}</div>
              <div style={{ color: GOLD, fontWeight: "bold" }}>{fmt(imp)}</div>
            </div>
          );
        })}
        <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 70px 70px 120px 120px", padding: "12px 16px", gap: 8, background: BG3, borderTop: `2px solid ${GOLD}` }}>
          <div /><div style={{ color: GOLD, fontWeight: "bold", fontSize: 11, letterSpacing: 2 }}>TOTAL CON IVA</div>
          <div /><div /><div />
          <div style={{ color: GOLD, fontSize: 15, fontWeight: "bold" }}>{fmt(totalConIva)}</div>
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Btn variant="outline" onClick={onBack}>← Atrás</Btn>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(0);
  const [clientItems, setClientItems] = useState([]);
  const [compItems, setCompItems] = useState([]);
  const [finalItems, setFinalItems] = useState([]);
  const [prov1Name, setProv1Name] = useState("Proveedor 1");
  const [prov2Name, setProv2Name] = useState("Proveedor 2");
  const [utilidad, setUtilidad] = useState(30);

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: mono, color: TEXT }}>
      {/* Header */}
      <div style={{ background: BG3, borderBottom: `2px solid ${GOLD}`, padding: "18px 40px", display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ fontSize: 28 }}>⚙</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: "bold", color: GOLD, letterSpacing: 4, textTransform: "uppercase" }}>TornillaQuote</div>
          <div style={{ fontSize: 10, color: MUTED, letterSpacing: 2 }}>SISTEMA DE COTIZACIÓN INTELIGENTE</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 11, color: MUTED }}>
          TORNILLOS AM · a.luna@tornillosam.com · 81 2198 0008
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
        <Steps current={step} />

        {step === 0 && (
          <Step1 onNext={(items) => { setClientItems(items); setStep(1); }} />
        )}
        {step === 1 && (
          <Step2
            items={clientItems}
            onNext={(enriched, p1, p2) => { setCompItems(enriched); setProv1Name(p1); setProv2Name(p2); setStep(2); }}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <Step3
            items={compItems}
            prov1Name={prov1Name}
            prov2Name={prov2Name}
            utilidad={utilidad}
            setUtilidad={setUtilidad}
            onNext={(rows) => { setFinalItems(rows); setStep(3); }}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step4
            items={finalItems}
            utilidad={utilidad}
            onBack={() => setStep(2)}
          />
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${BG}; }
        ::-webkit-scrollbar-thumb { background: #333; }
      `}</style>
    </div>
  );
}
