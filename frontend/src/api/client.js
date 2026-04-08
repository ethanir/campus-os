import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// ── Courses ────────────────────────────────────────────
export const getCourses = () => api.get("/courses").then((r) => r.data);
export const createCourse = (data) => api.post("/courses", data).then((r) => r.data);
export const getCourse = (id) => api.get(`/courses/${id}`).then((r) => r.data);
export const deleteCourse = (id) => api.delete(`/courses/${id}`).then((r) => r.data);
export const importFromScreenshot = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/courses/import-screenshot", form).then((r) => r.data);
};

// ── Materials ──────────────────────────────────────────
export const uploadMaterial = (courseId, file, materialType) => {
  const form = new FormData();
  form.append("file", file);
  form.append("material_type", materialType);
  return api.post(`/courses/${courseId}/upload`, form).then((r) => r.data);
};
export const getMaterials = (courseId) =>
  api.get(`/courses/${courseId}/materials`).then((r) => r.data);
export const deleteMaterial = (courseId, materialId) =>
  api.delete(`/courses/${courseId}/materials/${materialId}`).then((r) => r.data);

// ── Syllabus Parsing ───────────────────────────────────
export const parseSyllabus = (courseId) =>
  api.post(`/courses/${courseId}/parse-syllabus`).then((r) => r.data);

// ── Assignments ────────────────────────────────────────
export const getAssignments = (courseId) =>
  api.get(`/courses/${courseId}/assignments`).then((r) => r.data);
export const createAssignment = (courseId, data) =>
  api.post(`/courses/${courseId}/assignments`, data).then((r) => r.data);
export const deleteAssignment = (assignmentId) =>
  api.delete(`/assignments/${assignmentId}`).then((r) => r.data);
export const uploadAssignment = (courseId, file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post(`/courses/${courseId}/upload-assignment`, form).then((r) => r.data);
};

// ── Steps ──────────────────────────────────────────────
export const getSteps = (assignmentId) =>
  api.get(`/assignments/${assignmentId}/steps`).then((r) => r.data);
export const generateSteps = (assignmentId) =>
  api.post(`/assignments/${assignmentId}/generate-steps`).then((r) => r.data);
export const toggleStep = (stepId, isDone) =>
  api.patch(`/steps/${stepId}`, { is_done: isDone }).then((r) => r.data);

// ── Drafts ─────────────────────────────────────────────
export const generateDraft = (assignmentId) =>
  api.post(`/assignments/${assignmentId}/draft`).then((r) => r.data);
export const generateHomeworkTurnin = (assignmentId) =>
  api.post(`/assignments/${assignmentId}/homework-turnin`).then((r) => r.data);
export const generateHomeworkStudy = (assignmentId) =>
  api.post(`/assignments/${assignmentId}/homework-study`).then((r) => r.data);

// ── Planner ────────────────────────────────────────────
export const getWeeklyPlan = () => api.get("/plan/weekly").then((r) => r.data);
export const generateWeeklyPlan = () =>
  api.post("/plan/weekly/generate").then((r) => r.data);

// ── Study Guides ───────────────────────────────────────
export const getStudyGuides = (courseId) =>
  api.get(`/courses/${courseId}/study-guides`).then((r) => r.data);
export const generateStudyGuide = (courseId, examTitle, materialIds = []) => {
  const params = new URLSearchParams({ exam_title: examTitle });
  if (materialIds.length > 0) params.append("material_ids", materialIds.join(","));
  return api.post(`/courses/${courseId}/study-guide?${params}`).then((r) => r.data);
};

export default api;
