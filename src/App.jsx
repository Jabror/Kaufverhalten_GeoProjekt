import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxJA6SOItP_j5vyq1jc_Tu-_oXFBgFwkc",
  authDomain: "geoprojektumfrage.firebaseapp.com",
  projectId: "geoprojektumfrage",
  storageBucket: "geoprojektumfrage.firebasestorage.app",
  messagingSenderId: "677473951026",
  appId: "1:677473951026:web:f990618bbfa0c928320b2b",
  measurementId: "G-HCKMXZSY6Y"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const QUESTIONS = [
  { id: 1,  text: "Wie alt bist du?", multi: false, options: ["Unter 12","12–14","15–17","18 oder älter"] },
  { id: 2,  text: "Auf welchen Plattformen folgst du Influencern?", multi: true,  options: ["Instagram","TikTok","YouTube","Snapchat","Ich folge keinen Influencern"] },
  { id: 3,  text: "Wie oft siehst du Inhalte von Influencern?", multi: false, options: ["Mehrmals täglich","Einmal täglich","Mehrmals pro Woche","Selten","Nie"] },
  { id: 4,  text: "Wie sehr interessieren dich Produktempfehlungen von Influencern?", multi: false, options: ["Sehr stark","Stark","Mittel","Wenig","Gar nicht"] },
  { id: 5,  text: "Hast du schon einmal ein Produkt gekauft, weil ein Influencer es gezeigt hat?", multi: false, options: ["Ja, oft","Ja, ein paar Mal","Einmal","Noch nie"] },
  { id: 6,  text: "Welche Produkte kaufst du am ehesten wegen Influencern?", multi: true,  options: ["Kleidung","Kosmetik / Pflege","Technik","Essen / Getränke","Sonstiges","Keine"] },
  { id: 7,  text: "Wie sehr vertraust du Empfehlungen von Influencern?", multi: false, options: ["Sehr stark","Stark","Mittel","Wenig","Gar nicht"] },
  { id: 8,  text: "Glaubst du, dass Influencer ehrlich über Produkte sprechen?", multi: false, options: ["Ja, meistens","Manchmal","Selten","Nie"] },
  { id: 9,  text: "Wie wichtig ist dir, dass Influencer Werbung kennzeichnen?", multi: false, options: ["Sehr wichtig","Wichtig","Neutral","Wenig wichtig","Gar nicht wichtig"] },
  { id: 10, text: "Wie stark beeinflussen Influencer deine Kaufentscheidungen?", multi: false, options: ["Sehr stark","Stark","Mittel","Wenig","Gar nicht"] },
  { id: 11, text: "Hast du schon einmal etwas gekauft und es später bereut, weil ein Influencer es empfohlen hat?", multi: false, options: ["Ja, oft","Ja, einmal oder ein paar Mal","Nein"] },
  { id: 12, text: "Wie oft klickst du auf Links oder Rabattcodes von Influencern?", multi: false, options: ["Sehr oft","Manchmal","Selten","Nie"] },
  { id: 13, text: "Wie wichtig ist dir die Meinung von Influencern im Vergleich zu Freunden?", multi: false, options: ["Influencer sind wichtiger","Beide gleich wichtig","Freunde sind wichtiger","Keine von beiden"] },
  { id: 14, text: "Findest du Influencer eher inspirierend oder störend?", multi: false, options: ["Sehr inspirierend","Eher inspirierend","Neutral","Eher störend","Sehr störend"] },
  { id: 15, text: "Hast du schon einmal einen Influencer wegen einer Produktempfehlung neu entdeckt?", multi: false, options: ["Ja","Nein"] },
  { id: 16, text: "Wie glaubwürdig findest du Influencer im Vergleich zu normaler Werbung?", multi: false, options: ["Viel glaubwürdiger","Etwas glaubwürdiger","Gleich glaubwürdig","Weniger glaubwürdig","Viel weniger glaubwürdig"] },
  { id: 17, text: "Wie oft nutzt du Rabattcodes von Influencern?", multi: false, options: ["Sehr oft","Manchmal","Selten","Nie"] },
  { id: 18, text: "Würdest du ein Produkt eher kaufen, wenn dein Lieblings-Influencer es nutzt?", multi: false, options: ["Ja, sicher","Wahrscheinlich","Vielleicht","Eher nicht","Nein"] },
  { id: 19, text: "Denkst du, Influencer beeinflussen das Kaufverhalten von Jugendlichen stark?", multi: false, options: ["Sehr stark","Stark","Mittel","Wenig","Gar nicht"] },
  { id: 20, text: "Findest du Influencer-Werbung insgesamt positiv oder negativ?", multi: false, options: ["Sehr positiv","Eher positiv","Neutral","Eher negativ","Sehr negativ"] },
];

const PALETTE = ["#a78bfa","#f472b6","#34d399","#60a5fa","#fb923c","#e879f9","#4ade80","#f59e0b","#38bdf8","#f87171",
                 "#c084fc","#86efac","#fdba74","#67e8f9","#fca5a5","#a5f3fc","#d4d4d8","#fde68a","#bbf7d0","#e0f2fe"];

function tally(responses, qid, options) {
  const counts = {};
  options.forEach(o => counts[o] = 0);
  responses.forEach(r => {
    const ans = r.answers?.[qid];
    if (!ans) return;
    (Array.isArray(ans) ? ans : [ans]).forEach(a => { if (counts[a] !== undefined) counts[a]++; });
  });
  return counts;
}

function Bar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3, color:"#ccc" }}>
        <span>{label}</span>
        <span style={{ fontWeight:700, color }}>{value} <span style={{ color:"#888", fontWeight:400 }}>({pct}%)</span></span>
      </div>
      <div style={{ background:"#1e1e2e", borderRadius:6, height:10, overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:6, transition:"width 0.8s cubic-bezier(.4,0,.2,1)" }} />
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView]           = useState("home");
  const [step, setStep]           = useState(0);
  const [answers, setAnswers]     = useState({});
  const [responses, setResponses] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError]     = useState("");

  useEffect(() => {
    if (view === "results") {
      setDbLoading(true);
      setDbError("");
      getDocs(collection(db, "responses"))
        .then(snap => { setResponses(snap.docs.map(d => d.data())); setDbLoading(false); })
        .catch(e  => { setDbError("Fehler beim Laden: " + e.message); setDbLoading(false); });
    }
  }, [view]);

  const q = QUESTIONS[step];

  function toggleAnswer(qid, option, multi) {
    setAnswers(prev => {
      if (multi) {
        const cur = prev[qid] || [];
        return { ...prev, [qid]: cur.includes(option) ? cur.filter(x => x !== option) : [...cur, option] };
      }
      return { ...prev, [qid]: option };
    });
  }

  function isAnswered(qid) {
    const a = answers[qid];
    return Array.isArray(a) ? a.length > 0 : !!a;
  }

  async function submit() {
    setLoading(true);
    setDbError("");
    try {
      await addDoc(collection(db, "responses"), { answers, ts: serverTimestamp() });
      setSubmitted(true);
    } catch(e) {
      setDbError("Fehler beim Speichern: " + e.message);
    }
    setLoading(false);
  }

  function resetSurvey() { setStep(0); setAnswers({}); setSubmitted(false); setView("home"); }

  const bg   = { minHeight:"100vh", background:"#0b0b14", fontFamily:"'DM Sans', sans-serif", color:"#f0f0f8" };
  const card = { background:"#13131f", border:"1px solid #2a2a3e", borderRadius:20, padding:"32px 36px", maxWidth:680, margin:"0 auto" };
  const btn  = (active, color="#a78bfa") => ({
    background: active ? color : "transparent", color: active ? "#fff" : color,
    border:`2px solid ${color}`, borderRadius:12, padding:"12px 28px",
    fontFamily:"inherit", fontSize:15, fontWeight:700, cursor:"pointer", transition:"all 0.2s",
  });

  if (view === "home") return (
    <div style={{ ...bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <div style={{ ...card, textAlign:"center", maxWidth:560 }}>
        <div style={{ fontSize:52, marginBottom:8 }}>📱</div>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:34, fontWeight:800, margin:"0 0 8px", background:"linear-gradient(135deg,#a78bfa,#f472b6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          Influencer & Kaufverhalten
        </h1>
        <p style={{ color:"#9090b0", fontSize:15, lineHeight:1.7, margin:"0 0 32px" }}>
          20 Fragen · anonym · ca. 3 Minuten<br/>
          Deine Antworten helfen uns zu verstehen, wie Influencer das Kaufverhalten von Jugendlichen beeinflussen.
        </p>
        <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
          <button style={btn(true)} onClick={() => setView("survey")}>Umfrage starten →</button>
          <button style={btn(false,"#34d399")} onClick={() => setView("results")}>Ergebnisse ansehen</button>
        </div>
      </div>
    </div>
  );

  if (view === "survey" && submitted) return (
    <div style={{ ...bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <div style={{ ...card, textAlign:"center", maxWidth:480 }}>
        <div style={{ fontSize:64, marginBottom:12 }}>🎉</div>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, margin:"0 0 10px", color:"#a78bfa" }}>Danke für deine Teilnahme!</h2>
        <p style={{ color:"#9090b0", fontSize:14, marginBottom:28 }}>Deine Antworten wurden in Firebase gespeichert.</p>
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <button style={btn(true)} onClick={() => setView("results")}>Ergebnisse ansehen</button>
          <button style={btn(false)} onClick={resetSurvey}>Nochmals ausfüllen</button>
        </div>
      </div>
    </div>
  );

  if (view === "survey") {
    const progress = Math.round((step / QUESTIONS.length) * 100);
    const answered = isAnswered(q.id);
    const ans = answers[q.id];
    return (
      <div style={{ ...bg, padding:"24px 16px" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
        <div style={{ maxWidth:680, margin:"0 auto 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <button onClick={resetSurvey} style={{ background:"none", border:"none", color:"#666", cursor:"pointer", fontSize:13 }}>← Zurück</button>
          <span style={{ color:"#666", fontSize:13 }}>{step + 1} / {QUESTIONS.length}</span>
        </div>
        <div style={{ maxWidth:680, margin:"0 auto 24px", background:"#1e1e2e", borderRadius:8, height:6 }}>
          <div style={{ width:`${progress}%`, height:"100%", background:"linear-gradient(90deg,#a78bfa,#f472b6)", borderRadius:8, transition:"width 0.4s ease" }} />
        </div>
        <div style={card}>
          <div style={{ marginBottom:6 }}>
            <span style={{ background:"#a78bfa22", color:"#a78bfa", padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:700 }}>Frage {step + 1}</span>
            {q.multi && <span style={{ marginLeft:8, background:"#f472b622", color:"#f472b6", padding:"3px 10px", borderRadius:20, fontSize:12 }}>Mehrfachauswahl</span>}
          </div>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, margin:"12px 0 24px", lineHeight:1.4 }}>{q.text}</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {q.options.map(opt => {
              const sel = q.multi ? (ans||[]).includes(opt) : ans === opt;
              return (
                <div key={opt} onClick={() => toggleAnswer(q.id, opt, q.multi)}
                  style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", borderRadius:14, border:`2px solid ${sel?"#a78bfa":"#2a2a3e"}`, background:sel?"#a78bfa18":"#0f0f1c", cursor:"pointer", transition:"all 0.15s" }}>
                  <div style={{ width:20, height:20, flexShrink:0, borderRadius:q.multi?6:"50%", border:`2px solid ${sel?"#a78bfa":"#444"}`, background:sel?"#a78bfa":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {sel && <span style={{ color:"#fff", fontSize:11, fontWeight:900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:14, fontWeight:sel?600:400, color:sel?"#e0d4ff":"#c0c0d8" }}>{opt}</span>
                </div>
              );
            })}
          </div>
          {dbError && <p style={{ color:"#f87171", fontSize:13, marginTop:12 }}>{dbError}</p>}
          <div style={{ display:"flex", gap:12, marginTop:28, justifyContent:"space-between" }}>
            <button style={{ ...btn(false), opacity:step===0?0.3:1 }} disabled={step===0} onClick={() => setStep(s=>s-1)}>← Zurück</button>
            {step < QUESTIONS.length - 1
              ? <button style={btn(answered)} disabled={!answered} onClick={() => setStep(s=>s+1)}>Weiter →</button>
              : <button style={btn(answered,"#34d399")} disabled={!answered||loading} onClick={submit}>{loading?"Speichern…":"Absenden ✓"}</button>
            }
          </div>
        </div>
      </div>
    );
  }

  if (view === "results") {
    const total = responses.length;
    return (
      <div style={{ ...bg, padding:"24px 16px" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
        <div style={{ maxWidth:760, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:12 }}>
            <div>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, margin:0, background:"linear-gradient(135deg,#a78bfa,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Ergebnisse</h1>
              <p style={{ color:"#666", fontSize:13, margin:"4px 0 0" }}>Gesamt: <strong style={{ color:"#a78bfa" }}>{total}</strong> Antworten</p>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button style={btn(true,"#a78bfa")} onClick={() => setView("survey")}>Umfrage ausfüllen</button>
              <button style={btn(false,"#666")} onClick={resetSurvey}>Home</button>
            </div>
          </div>
          {dbLoading && <p style={{ color:"#666", textAlign:"center", padding:40 }}>Lade Daten aus Firebase…</p>}
          {dbError   && <p style={{ color:"#f87171", textAlign:"center" }}>{dbError}</p>}
          {!dbLoading && !dbError && total === 0 && (
            <div style={{ ...card, textAlign:"center", padding:48 }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📊</div>
              <p style={{ color:"#666" }}>Noch keine Antworten vorhanden.</p>
            </div>
          )}
          {!dbLoading && total > 0 && QUESTIONS.map((q, qi) => {
            const counts = tally(responses, q.id, q.options);
            const color  = PALETTE[qi % PALETTE.length];
            return (
              <div key={q.id} style={{ ...card, marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:16 }}>
                  <span style={{ background:color+"22", color, padding:"2px 10px", borderRadius:20, fontSize:12, fontWeight:700, flexShrink:0 }}>#{q.id}</span>
                  <p style={{ margin:0, fontSize:14, fontWeight:600, color:"#e0e0f0", lineHeight:1.5 }}>{q.text}</p>
                </div>
                {q.options.map(opt => <Bar key={opt} label={opt} value={counts[opt]} max={total} color={color} />)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
