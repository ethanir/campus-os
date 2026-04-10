import { useState, useEffect, useRef } from "react";
import { Upload, FileText, Check, Loader2, AlertCircle, Image } from "lucide-react";
import { getCourses, uploadMaterial } from "../api/client";

const MATERIAL_TYPES = [
  { value: "syllabus", label: "Syllabus" },
  { value: "slides", label: "Lecture Slides" },
  { value: "textbook", label: "Textbook / Reading" },
  { value: "reference_image", label: "📷 Reference Image" },
  { value: "completed_work", label: "Past Work" },
  { value: "announcement", label: "Announcement" },
  { value: "other", label: "Other" },
];

export default function UploadPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materialType, setMaterialType] = useState("other");
  const [imageDescription, setImageDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploads, setUploads] = useState([]);
  const fileInput = useRef(null);

  useEffect(() => {
    getCourses().then((c) => { setCourses(c); if (c.length > 0) setSelectedCourse(c[0].id); });
  }, []);

  const isRefImage = materialType === "reference_image";

  const addFiles = (files) => {
    const newUploads = Array.from(files).map((f) => ({ file: f, status: "pending", result: null }));
    setUploads((prev) => [...prev, ...newUploads]);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); };

  const handleUploadAll = async () => {
    if (!selectedCourse) return;
    for (let i = 0; i < uploads.length; i++) {
      if (uploads[i].status !== "pending") continue;
      setUploads((prev) => prev.map((u, j) => j === i ? { ...u, status: "uploading" } : u));
      try {
        const result = await uploadMaterial(selectedCourse, uploads[i].file, materialType, isRefImage ? imageDescription : "");
        setUploads((prev) => prev.map((u, j) => j === i ? { ...u, status: "done", result } : u));
      } catch { setUploads((prev) => prev.map((u, j) => j === i ? { ...u, status: "error" } : u)); }
    }
  };

  const pendingCount = uploads.filter((u) => u.status === "pending").length;

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Upload Materials</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Syllabus, slides, textbooks, reference images — drop it all here.
      </p>

      {/* Selectors */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1">
          <label className="font-mono text-[10px] tracking-wider font-bold block mb-1.5" style={{ color: "var(--text-dim)" }}>COURSE</label>
          <select value={selectedCourse || ""} onChange={(e) => setSelectedCourse(Number(e.target.value))}
            className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }}>
            {courses.length === 0 && <option value="">No courses — create one first</option>}
            {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="font-mono text-[10px] tracking-wider font-bold block mb-1.5" style={{ color: "var(--text-dim)" }}>TYPE</label>
          <select value={materialType} onChange={(e) => { setMaterialType(e.target.value); setImageDescription(""); }}
            className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }}>
            {MATERIAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* Description field for reference images */}
      {isRefImage && (
        <div className="mb-5">
          <label className="font-mono text-[10px] tracking-wider font-bold block mb-1.5" style={{ color: "var(--text-dim)" }}>DESCRIBE THIS IMAGE</label>
          <textarea
            value={imageDescription}
            onChange={(e) => setImageDescription(e.target.value)}
            placeholder="e.g. Fig 2.1 — free body diagram showing forces on inclined plane, used in HW3 Q2"
            className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none"
            rows={2}
            style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)", lineHeight: 1.5 }}
          />
          <p className="text-[10px] mt-1" style={{ color: "var(--text-dim)" }}>Helps the AI understand the figure. Include fig numbers, labels, what it represents.</p>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInput.current?.click()}
        className="rounded-2xl p-14 text-center cursor-pointer transition-all"
        style={{
          border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
          background: dragOver ? `rgba(var(--accent-rgb), 0.03)` : "transparent",
        }}>
        {isRefImage ? <Image size={28} className="mx-auto mb-3" style={{ color: dragOver ? "var(--accent)" : "var(--text-dim)" }} /> : <Upload size={28} className="mx-auto mb-3" style={{ color: dragOver ? "var(--accent)" : "var(--text-dim)" }} />}
        <p className="font-medium mb-1" style={{ color: "var(--text)" }}>{isRefImage ? "Drop images here or click to browse" : "Drop files here or click to browse"}</p>
        <p className="text-xs" style={{ color: "var(--text-dim)" }}>{isRefImage ? "PNG, JPG, WEBP — screenshots, cropped figures" : "PDF, PPTX, TXT, MD — up to 50MB each"}</p>
        <input ref={fileInput} type="file" multiple accept={isRefImage ? ".png,.jpg,.jpeg,.webp,.gif" : ".pdf,.pptx,.txt,.md,.doc,.docx"} className="hidden"
          onChange={(e) => { if (e.target.files.length) addFiles(e.target.files); }} />
      </div>

      {/* File queue */}
      {uploads.length > 0 && (
        <div className="mt-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-mono text-[10px] tracking-[2px] font-bold" style={{ color: "var(--text-dim)" }}>FILES ({uploads.length})</h2>
            {pendingCount > 0 && (
              <button onClick={handleUploadAll} disabled={!selectedCourse}
                className="font-mono text-[10px] font-bold tracking-wider px-4 py-2 rounded-lg transition disabled:opacity-30"
                style={{ background: "var(--accent)", color: "var(--bg)" }}>
                UPLOAD {pendingCount} FILE{pendingCount !== 1 ? "S" : ""}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {uploads.map((u, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-4 py-3"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <FileText size={14} style={{ color: "var(--text-dim)" }} />
                <span className="text-sm truncate flex-1" style={{ color: "var(--text)" }}>{u.file.name}</span>
                <span className="text-xs font-mono" style={{ color: "var(--text-dim)" }}>{(u.file.size / 1024).toFixed(0)}KB</span>
                {u.status === "pending" && <span className="font-mono text-[9px] tracking-wider" style={{ color: "var(--text-dim)" }}>PENDING</span>}
                {u.status === "uploading" && <Loader2 size={14} className="animate-spin" style={{ color: "var(--accent)" }} />}
                {u.status === "done" && <Check size={14} style={{ color: "var(--accent-green)" }} />}
                {u.status === "error" && <AlertCircle size={14} style={{ color: "var(--accent-red)" }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline */}
      <div className="mt-8 flex items-center justify-center gap-3 font-mono text-[10px] tracking-wider" style={{ color: "var(--text-dim)" }}>
        <span>UPLOAD</span><span>→</span><span>EXTRACT</span><span>→</span><span>AI PARSE</span><span>→</span><span>DASHBOARD</span>
      </div>
    </div>
  );
}
