/* Mohamed Personal UI Branding — Workshop Ledger: warm paper surfaces, inspection red signals, asymmetrical evidence-led layout, mono metadata, and human-in-the-loop states. */
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, ChevronRight, CircleAlert, FileImage, Loader2, ScanLine, ShieldCheck, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

type InspectionResult = {
  prediction: "OK" | "Defective";
  confidence: number;
  defective_probability: number;
  heatmap_base64?: string;
  model?: { name: string; input_size: number; roc_auc: number; f1: number };
};

const baselineMetrics = [
  { value: "94.05%", label: "Accuracy", note: "1,093 unseen test images" },
  { value: "99.35%", label: "ROC-AUC", note: "Probability ranking" },
  { value: "94.61%", label: "F1 score", note: "Defective class" },
];

function percent(value: number) { return `${(value * 100).toFixed(1)}%`; }

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [status, setStatus] = useState<"idle" | "ready" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/health`).then((r) => setApiOnline(r.ok)).catch(() => setApiOnline(false));
  }, []);

  function chooseFile(next: File | undefined) {
    if (!next) return;
    if (!next.type.startsWith("image/") || next.size > 10 * 1024 * 1024) {
      setError("Choose an image file under 10 MB."); setStatus("error"); return;
    }
    setFile(next); setResult(null); setError(""); setStatus("ready");
    setPreview(URL.createObjectURL(next));
  }

  function onInput(event: ChangeEvent<HTMLInputElement>) { chooseFile(event.target.files?.[0]); }
  function onDrop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); chooseFile(event.dataTransfer.files?.[0]); }
  function clearFile() { setFile(null); setPreview(""); setResult(null); setError(""); setStatus("idle"); if (inputRef.current) inputRef.current.value = ""; }

  async function inspect() {
    if (!file) return;
    setStatus("loading"); setError("");
    const body = new FormData(); body.append("file", file);
    try {
      const response = await fetch(`${API_URL}/predict`, { method: "POST", body });
      if (!response.ok) throw new Error((await response.json()).detail || "The inference service returned an error.");
      const data = await response.json() as InspectionResult;
      setResult(data); setStatus("success"); setApiOnline(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The inference service is unavailable."); setStatus("error"); setApiOnline(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="phase-rail" aria-label="Inspection phases"><span className="rail-caption">CAST / SIGHT</span><div className="rail-line" />{['01','02','03','04','05'].map((phase, index) => <a href={['#top','#inspect','#evidence','#method','#inspect'][index]} key={phase} className={index === 1 ? 'rail-phase active' : 'rail-phase'}><span>{phase}</span><small>{['ORIENT','INSPECT','EVIDENCE','METHOD','REVIEW'][index]}</small></a>)}</aside>
      <header className="site-header">
        <a className="brand-lockup" href="#top" aria-label="Cast Sight home"><span className="brand-mark" aria-hidden="true"><span /></span><span><strong>CAST / SIGHT</strong><small>INDUSTRIAL VISION DESK</small></span></a>
        <button className="menu-toggle" aria-expanded={menuOpen} aria-controls="primary-nav" onClick={() => setMenuOpen((open) => !open)}><span>Menu</span><span className="menu-lines" /></button>
        <nav id="primary-nav" className={menuOpen ? "primary-nav open" : "primary-nav"}>
          <a href="#inspect" onClick={() => setMenuOpen(false)}>Inspect</a><a href="#evidence" onClick={() => setMenuOpen(false)}>Evidence</a><a href="#method" onClick={() => setMenuOpen(false)}>Method</a><span className="header-status"><i className={apiOnline ? "status-dot live" : "status-dot"} />{apiOnline ? "INFERENCE ONLINE" : "INFERENCE DESK UNAVAILABLE"}</span>
        </nav>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow"><span>01</span> HUMAN-CENTERED INSPECTION</p>
            <h1>See what the<br /><em>model sees</em><br />before the line moves.</h1>
            <p className="hero-lede">A visual quality-control desk for casting teams. Upload one sample and receive a measured verdict with the evidence needed for a human review.</p>
            <div className="hero-actions"><a className="primary-action" href="#inspect">Inspect a casting <ArrowUpRight size={16} /></a><a className="text-action" href="#evidence">View baseline evidence <ChevronRight size={15} /></a></div>
            <p className="hero-footnote"><span className="red-rule" /> MobileNetV2 transfer-learning baseline · Grad-CAM ready</p>
          </div>
          <div className="hero-visual"><div className="visual-frame"><div className="specimen-graphic" role="img" aria-label="Aluminum casting ring specimen diagram"><div className="specimen-ring"><span /><i /><b /><em /></div><div className="specimen-cross horizontal" /><div className="specimen-cross vertical" /><div className="specimen-grid" /></div><span className="frame-label top-left">SPECIMEN / 001</span><span className="frame-label bottom-right">VISUAL EVIDENCE</span><span className="crosshair crosshair-a" /><span className="crosshair crosshair-b" /></div><div className="vertical-note">QUALITY CONTROL / 2026</div></div>
        </section>

        <section className="fact-strip" id="evidence"><div className="section-kicker">MEASURED BASELINE <span>—</span> TEST SET</div>{baselineMetrics.map((metric) => <div className="fact" key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span><small>{metric.note}</small></div>)}<div className="fact fact-note"><ShieldCheck size={18} /><span>Unseen test set</span><small>Results preserved from the real project run</small></div></section>

        <section className="inspect-section" id="inspect">
          <div className="section-intro"><p className="eyebrow"><span>02</span> LIVE INSPECTION</p><h2>Bring a sample<br /><em>to the desk.</em></h2><p>Use the saved production checkpoint to classify an image as OK or Defective. The server validates the file again before inference.</p><div className="provenance-list"><div><span>MODEL</span><strong>MobileNetV2 / frozen backbone</strong></div><div><span>INPUT</span><strong>RGB · 224 × 224 px</strong></div><div><span>OUTPUT</span><strong>Verdict · confidence · heatmap</strong></div></div></div>
          <div className="inspection-card">
            <div className="card-heading"><div><span className="mono-label">SPECIMEN TRAY / LIVE</span><h3>Upload a casting image</h3></div><span className={apiOnline ? "api-badge online" : "api-badge"}><i className="status-dot" />{apiOnline ? "READY" : "DESK UNAVAILABLE"}</span></div>
            {!file ? <div className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={onDrop} onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && inputRef.current?.click()}><div className="upload-symbol"><Upload size={20} /></div><strong>Drop a casting image here</strong><span>or browse from your device</span><small>JPG, JPEG, PNG · max 10 MB</small><input ref={inputRef} type="file" accept="image/*" onChange={onInput} /></div> : <div className="selected-specimen"><div className="selected-image"><img src={preview} alt="Selected casting specimen" /><button className="remove-file" onClick={clearFile} aria-label="Remove selected image"><X size={15} /></button></div><div className="selected-meta"><span className="mono-label">SELECTED SPECIMEN</span><strong>{file.name}</strong><small>{(file.size / 1024).toFixed(0)} KB · {file.type || "image"}</small><div className="ready-line"><Check size={14} /> Ready for inference</div></div></div>}
            {error && <div className="inline-error"><CircleAlert size={16} />{error}</div>}
            <div className="card-footer"><span className="privacy-note"><ShieldCheck size={14} /> Image stays with your inference session</span><Button className="inspect-button" disabled={!file || status === "loading"} onClick={inspect}>{status === "loading" ? <><Loader2 size={15} className="spin" /> Reading specimen</> : <>Run inspection <ArrowUpRight size={15} /></>}</Button></div>
          </div>
        </section>

        {result && <section className="result-section" aria-live="polite"><div className="result-head"><div><span className="eyebrow"><span>03</span> INSPECTION RESULT</span><h2>Decision with<br /><em>visible evidence.</em></h2></div><div className={result.prediction === "OK" ? "result-stamp ok" : "result-stamp defective"}><span>{result.prediction === "OK" ? "OK" : "DEFECTIVE"}</span><small>MODEL VERDICT</small></div></div><div className="result-grid"><div className="result-specimen"><img src={preview} alt="Inspected casting specimen" /><span className="image-tag">ORIGINAL SAMPLE</span></div><div className="result-explanation">{result.heatmap_base64 ? <img src={`data:image/jpeg;base64,${result.heatmap_base64}`} alt="Grad-CAM explanation heatmap" /> : <div className="heatmap-empty"><ScanLine size={28} /><span>Explanation unavailable</span></div>}<span className="image-tag">GRAD-CAM / MODEL FOCUS</span></div><div className="result-data"><div className="score-block"><span className="mono-label">CONFIDENCE</span><strong>{percent(result.confidence)}</strong><div className="confidence-track"><span style={{ width: `${result.confidence * 100}%` }} /></div></div><div className="score-block"><span className="mono-label">DEFECTIVE PROBABILITY</span><strong>{percent(result.defective_probability)}</strong></div><div className="result-guidance"><Sparkles size={16} /><p>{result.prediction === "OK" ? "No defect signal exceeded the decision threshold. Confirm the highlighted surface before release." : "A defect signal was detected. Hold for inspector review and compare the highlighted region with the physical part."}</p></div></div></div></section>}

        <section className="method-section" id="method"><div className="method-ledger" aria-label="Measured model evidence"><div className="ledger-ring"><span /><i /><b /></div><span className="frame-label ledger-top">MODEL / EVIDENCE</span><span className="frame-label ledger-bottom">HUMAN REVIEW REQUIRED</span><div className="ledger-ticks"><span>224 PX</span><span>RGB</span><span>GRAD-CAM</span></div></div><div className="method-copy"><p className="eyebrow"><span>04</span> HOW TO READ THE DESK</p><h2>Automation,<br /><em>made accountable.</em></h2><p>Cast / Sight keeps the decision short and the evidence close. The model offers a signal; the inspector owns the release decision.</p><ol className="method-steps"><li><span>01</span><div><strong>Upload</strong><p>Provide one clear casting image with the part visible.</p></div></li><li><span>02</span><div><strong>Measure</strong><p>The saved checkpoint returns a binary verdict and calibrated probabilities.</p></div></li><li><span>03</span><div><strong>Review</strong><p>Use Grad-CAM as an audit trail, never as a replacement for physical inspection.</p></div></li></ol></div></section>
      </main>
      <footer className="site-footer"><div className="brand-lockup"><span className="brand-mark" aria-hidden="true"><span /></span><span><strong>CAST / SIGHT</strong><small>INDUSTRIAL VISION DESK</small></span></div><p>Portfolio application · Real casting dataset · Evidence-first quality control</p><span className="footer-code"></span></footer>
    </div>
  );
}
