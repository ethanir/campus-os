import { useState, useEffect, useRef } from "react";
import { Upload, FileText, Check, Loader2, AlertCircle } from "lucide-react";
import { getCourses, uploadMaterial } from "../api/client";

const MATERIAL_TYPES = [
  { value: "syllabus", label: "Syllabus" },
  { value: "slides", label: "Lecture Slides" },
  { value: "textbook", label: "Textbook / Reading" },
  { value: "assignment", label: "Assignment Spec" },
  { value: "announcement", label: "Announcement" },
  { value: "piazza", label: "Piazza Export" },
  { value: "other", label: "Other" },
];

export default function UploadPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materialType, setMaterialType] = useState("other");
  const [dragOver, setDragOver] = useState(false);
  const [uploads, setUploads] = useState([]); // {file, status: "pending"|"uploading"|"done"|"error", result}
  const fileInput = useRef(null);

  useEffect(() => {
    getCourses().then((c) => {
      setCourses(c);
      if (c.length > 0) setSelectedCourse(c[0].id);
    });
  }, []);

  const addFiles = (files) => {
    const newUploads = Array.from(files).map((f) => ({ file: f, status: "pending", result: null }));
    setUploads((prev) => [...prev, ...newUploads]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleUploadAll = async () => {
    if (!selectedCourse) return;

    for (let i = 0; i < uploads.length; i++) {
      if (uploads[i].status !== "pending") continue;

      setUploads((prev) => prev.map((u, j) => j === i ? { ...u, status: "uploading" } : u));

      try {
        const result = await uploadMaterial(selectedCourse, uploads[i].file, materialType);
        setUploads((prev) => prev.map((u, j) => j === i ? { ...u, status: "done", result } : u));
      } catch (err) {
        setUploads((prev) => prev.map((u, j) => j === i ? { ...u, status: "error" } : u));
      }
    }
  };

  const pendingCount = uploads.filter((u) => u.status === "pending").length;

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-bold mb-1">Upload Materials</h1>
      <p className="text-sm text-neutral-500 mb-6">Drop your course files — syllabus, slides, textbooks, Piazza exports, anything.</p>

      {/* Course + type selectors */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1">
          <label className="font-mono text-[10px] tracking-wider text-neutral-500 font-bold block mb-1.5">COURSE</label>
          <select
            value={selectedCourse || ""}
            onChange={(e) => setSelectedCourse(Number(e.target.value))}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-accent-yellow/40 appearance-none"
          >
            {courses.length === 0 && <option value="">No courses — create one first</option>}
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="font-mono text-[10px] tracking-wider text-neutral-500 font-bold block mb-1.5">MATERIAL TYPE</label>
          <select
            value={materialType}
            onChange={(e) => setMaterialType(e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-accent-yellow/40 appearance-none"
          >
            {MATERIAL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInput.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all
          ${dragOver ? "border-accent-yellow/50 bg-accent-yellow/[0.03]" : "border-border hover:border-border-light"}`}
      >
        <Upload size={32} className={`mx-auto mb-4 ${dragOver ? "text-accent-yellow" : "text-neutral-600"}`} />
        <p className="text-neutral-300 font-medium mb-1">Drop files here or click to browse</p>
        <p className="text-xs text-neutral-600">PDF, PPTX, TXT, MD — up to 50MB each</p>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept=".pdf,.pptx,.txt,.md,.doc,.docx"
          className="hidden"
          onChange={(e) => { if (e.target.files.length) addFiles(e.target.files); }}
        />
      </div>

      {/* File queue */}
      {uploads.length > 0 && (
        <div className="mt-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-mono text-[10px] tracking-[2px] text-neutral-500 font-bold">
              FILES ({uploads.length})
            </h2>
            {pendingCount > 0 && (
              <button
                onClick={handleUploadAll}
                disabled={!selectedCourse}
                className="font-mono text-[10px] font-bold tracking-wider bg-accent-yellow text-black px-4 py-2 rounded-lg hover:bg-accent-yellow/90 disabled:opacity-30 transition"
              >
                UPLOAD {pendingCount} FILE{pendingCount !== 1 ? "S" : ""}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {uploads.map((u, i) => (
              <div key={i} className="flex items-center gap-3 bg-bg-card border border-border rounded-lg px-4 py-3">
                <FileText size={14} className="text-neutral-500 flex-shrink-0" />
                <span className="text-sm text-neutral-300 truncate flex-1">{u.file.name}</span>
                <span className="text-xs text-neutral-600 font-mono">{(u.file.size / 1024).toFixed(0)}KB</span>
                {u.status === "pending" && <span className="font-mono text-[9px] text-neutral-600 tracking-wider">PENDING</span>}
                {u.status === "uploading" && <Loader2 size={14} className="text-accent-yellow animate-spin" />}
                {u.status === "done" && <Check size={14} className="text-accent-green" />}
                {u.status === "error" && <AlertCircle size={14} className="text-accent-red" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline visualization */}
      <div className="mt-8 flex items-center justify-center gap-4 font-mono text-[10px] tracking-wider text-neutral-700">
        <span>UPLOAD</span>
        <span className="text-neutral-800">→</span>
        <span>EXTRACT TEXT</span>
        <span className="text-neutral-800">→</span>
        <span>AI PARSE</span>
        <span className="text-neutral-800">→</span>
        <span>DASHBOARD</span>
      </div>
    </div>
  );
}
