import React, { useCallback, useEffect, useMemo, useState } from "react";
import HeaderTitle from "../../components/header-title/HeaderTitle";
import "./AiNoteMakerPage.css";
import api, { resolveAxiosError } from "../../data/axios";
import ReactMarkdown from "react-markdown";
import { marked } from "marked";
import html2pdf from "html2pdf.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/AuthProvider";
import {
  AI_NOTE_MAKER_DRAFT_KEY,
  clearPostLoginReturnMarkers,
  setPostLoginReturnToAiNoteMaker,
} from "../../utils/aiNoteMakerLoginReturn";

function buildStructuredNotes(topic, raw) {
  const text = raw.trim();
  if (!text) return "";

  const title = topic.trim() || "Study notes";
  const lines = text.split(/\r?\n/).map((l) => l.trim());

  const bulletLines = [];
  const nonBulletLines = [];

  for (const line of lines) {
    if (!line) continue;
    if (/^(-|\*|•|\d+\.)\s/.test(line)) {
      bulletLines.push(line.replace(/^(-|\*|•|\d+\.)\s+/, ""));
    } else {
      nonBulletLines.push(line);
    }
  }

  const body = nonBulletLines.join("\n\n");
  const overview =
    body.length > 420 ? `${body.slice(0, 417).trim()}…` : body || text.slice(0, 420);

  let md = `# ${title}\n\n## Overview\n${overview || text.slice(0, 400)}\n\n`;
  if (bulletLines.length) {
    md += "## Key points\n";
    bulletLines.forEach((b) => {
      md += `- ${b}\n`;
    });
    md += "\n";
  }
  if (body.length > 420) {
    md += "## Full notes\n";
    md += `${body}\n`;
  }

  return md.trim();
}

export default function AiNoteMakerPage() {
  const [topic, setTopic] = useState("");
  const [raw, setRaw] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const wordCount = useMemo(() => {
    const w = raw.trim().split(/\s+/).filter(Boolean);
    return raw.trim() ? w.length : 0;
  }, [raw]);

  useEffect(() => {
    if (!isLoggedIn) return;
    try {
      const saved = sessionStorage.getItem(AI_NOTE_MAKER_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.topic === "string") setTopic(parsed.topic);
        if (typeof parsed?.raw === "string") setRaw(parsed.raw);
        if (typeof parsed?.output === "string") setOutput(parsed.output);
        sessionStorage.removeItem(AI_NOTE_MAKER_DRAFT_KEY);
      }
    } catch {
      // ignore
    }
    clearPostLoginReturnMarkers();
  }, [isLoggedIn]);

  const onOrganise = useCallback(() => {
    const run = async () => {
      const trimmed = raw.trim();
      if (!trimmed) {
        setOutput("");
        setError("");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const res = await api.post("/ai/notes", { topic, raw: trimmed });
        const aiOut = res?.data?.data?.output?.trim?.();
        if (aiOut) setOutput(aiOut);
        else setOutput(buildStructuredNotes(topic, trimmed));
      } catch (e) {
        const info = resolveAxiosError(e);
        setError(info.message || "Failed to generate notes");
        setOutput(buildStructuredNotes(topic, trimmed));
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [topic, raw]);

  const onLoginToUnlock = useCallback(() => {
    setPostLoginReturnToAiNoteMaker();
    try {
      sessionStorage.setItem(
        AI_NOTE_MAKER_DRAFT_KEY,
        JSON.stringify({ topic, raw, output })
      );
    } catch {
      // ignore (e.g. quota) — redirect still works
    }
    navigate("/authentication?authType=login&userRole=student");
  }, [navigate, output, raw, topic]);

  const onDownload = useCallback(async () => {
    if (!output) return;
    if (!isLoggedIn) return;
    const safeTitle = (topic.trim() || "notes").replace(/\s+/g, "-").slice(0, 40);
    const htmlBody = marked.parse(output);

    const holder = document.createElement("div");
    holder.setAttribute("aria-hidden", "true");
    holder.style.position = "fixed";
    holder.style.left = "0";
    holder.style.top = "0";
    holder.style.width = "794px"; // ~A4 at 96dpi
    holder.style.background = "#fff";
    holder.style.opacity = "0.01"; // keep it renderable, but invisible
    holder.style.pointerEvents = "none";
    holder.style.zIndex = "-1";
    holder.innerHTML = `
      <style>
        .pdf-doc{font-family:Calibri,Arial,sans-serif;line-height:1.45;color:#111;padding:28px;}
        .pdf-doc h1{font-size:22pt;margin:0 0 10pt;font-weight:800;}
        .pdf-doc h2{font-size:14.5pt;margin:16pt 0 6pt;font-weight:800;}
        .pdf-doc h3{font-size:12.5pt;margin:12pt 0 5pt;font-weight:750;}
        .pdf-doc p{margin:6pt 0;}
        .pdf-doc ul,.pdf-doc ol{margin:6pt 0 10pt;padding-left:20pt;}
        .pdf-doc li{margin:3pt 0;}
        .pdf-doc code{font-family:Consolas,monospace;background:#f2f2f2;padding:1px 4px;border-radius:4px;}
        .pdf-doc hr{border:none;border-top:1px solid #ddd;margin:14pt 0;}

        /* Prevent awkward splits across pages */
        .pdf-doc :is(h1,h2,h3){break-after: avoid-page; page-break-after: avoid;}
        .pdf-doc :is(p,li,blockquote,pre,table,tr,img){break-inside: avoid; page-break-inside: avoid;}
        .pdf-doc ul, .pdf-doc ol{break-inside: auto; page-break-inside: auto;}
        .pdf-doc li{break-inside: avoid; page-break-inside: avoid;}
      </style>
      <div class="pdf-doc">${htmlBody}</div>
    `;
    document.body.appendChild(holder);

    const options = {
      margin: 12,
      filename: `${safeTitle}.pdf`,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    try {
      const contentEl = holder.querySelector(".pdf-doc");
      await html2pdf().set(options).from(contentEl).save();
    } finally {
      document.body.removeChild(holder);
    }
  }, [output, topic]);

  const onClear = useCallback(() => {
    setTopic("");
    setRaw("");
    setOutput("");
    setError("");
  }, []);

  return (
    <div className="ai-note-maker">
      <div className="ai-note-maker__header">
        <HeaderTitle
          title="AI Note Maker"
          description="Paste lecture text or rough bullets — we organise them into a clear outline you can copy or download."
        />
      </div>

      <div className="ai-note-maker__grid">
        <section className="ai-note-maker__panel ai-note-maker__panel--input">
          <label className="ai-note-maker__label" htmlFor="note-topic">
            Topic or title
          </label>
          <input
            id="note-topic"
            className="ai-note-maker__input"
            type="text"
            placeholder="e.g. Chapter 3 — Photosynthesis"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={200}
          />

          <label className="ai-note-maker__label" htmlFor="note-raw">
            Your notes
          </label>
          <textarea
            id="note-raw"
            className="ai-note-maker__textarea"
            placeholder="Paste messy notes here. Lines starting with -, *, •, or 1. become key points."
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={16}
          />
          <p className="ai-note-maker__meta">{wordCount} words</p>

          <div className="ai-note-maker__actions">
            <button
              type="button"
              className="ai-note-maker__btn ai-note-maker__btn--primary"
              onClick={onOrganise}
              disabled={isLoading || !raw.trim()}
            >
              {isLoading ? "Generating…" : "Organise notes"}
            </button>
            <button type="button" className="ai-note-maker__btn ai-note-maker__btn--ghost" onClick={onClear}>
              Clear
            </button>
          </div>
        </section>

        <section className="ai-note-maker__panel ai-note-maker__panel--output">
          <div className="ai-note-maker__output-head">
            <h2 className="ai-note-maker__output-title">Structured output</h2>
            <div className="ai-note-maker__output-actions">
              {!isLoggedIn && output ? (
                <button
                  type="button"
                  className="ai-note-maker__btn ai-note-maker__btn--secondary"
                  onClick={onLoginToUnlock}
                  disabled={isLoading}
                >
                  Login to download
                </button>
              ) : (
                <button
                  type="button"
                  className="ai-note-maker__btn ai-note-maker__btn--secondary"
                  onClick={onDownload}
                  disabled={!output || isLoading || !isLoggedIn}
                >
                  Download PDF
                </button>
              )}
            </div>
          </div>
          {error ? <p className="ai-note-maker__meta" style={{ color: "#b42318" }}>{error}</p> : null}
          <div
            className={`ai-note-maker__md ${!isLoggedIn ? "ai-note-maker__md--locked" : ""}`}
            tabIndex={0}
          >
            {isLoading ? (
              <p className="ai-note-maker__md-placeholder">Generating notes with AI…</p>
            ) : output ? (
              <ReactMarkdown>{output}</ReactMarkdown>
            ) : (
              <p className="ai-note-maker__md-placeholder">Organised notes will appear here.</p>
            )}
            {!isLoggedIn && output ? <div className="ai-note-maker__md-lock" /> : null}
          </div>
          {!isLoggedIn && output ? (
            <div className="ai-note-maker__unlock">
              <p className="ai-note-maker__unlock-text">
                Login to view full notes and download the PDF.
              </p>
              <button type="button" className="ai-note-maker__btn ai-note-maker__btn--primary" onClick={onLoginToUnlock}>
                Login to unlock
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
