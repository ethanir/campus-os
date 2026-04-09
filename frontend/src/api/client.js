import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ───────────────────────────────────────────────
export const register = (data) => api.post("/auth/register", data).then((r) => r.data);
export const login = (data) => api.post("/auth/login", data).then((r) => r.data);
export const getMe = () => api.get("/auth/me").then((r) => r.data);
export const getCreditPacks = () => api.get("/auth/credit-packs").then((r) => r.data);
export const buyCredits = (packId) => api.post(`/auth/buy-credits?pack_id=${packId}`).then((r) => r.data);
export const changePassword = (data) => api.post("/auth/change-password", data).then((r) => r.data);

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
export const getMaterials = (courseId) => api.get(`/courses/${courseId}/materials`).then((r) => r.data);
export const deleteMaterial = (courseId, materialId) => api.delete(`/courses/${courseId}/materials/${materialId}`).then((r) => r.data);

// ── Assignments ────────────────────────────────────────
export const getAssignments = (courseId) => api.get(`/courses/${courseId}/assignments`).then((r) => r.data);
export const createAssignment = (courseId, data) => api.post(`/courses/${courseId}/assignments`, data).then((r) => r.data);
export const deleteAssignment = (assignmentId) => api.delete(`/assignments/${assignmentId}`).then((r) => r.data);
export const uploadAssignment = (courseId, file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post(`/courses/${courseId}/upload-assignment`, form).then((r) => r.data);
};

// ── Syllabus ───────────────────────────────────────────
export const parseSyllabus = (courseId) => api.post(`/courses/${courseId}/parse-syllabus`).then((r) => r.data);

// ── Steps ──────────────────────────────────────────────
export const getSteps = (assignmentId) => api.get(`/assignments/${assignmentId}/steps`).then((r) => r.data);
export const generateSteps = (assignmentId) => api.post(`/assignments/${assignmentId}/generate-steps`).then((r) => r.data);
export const toggleStep = (stepId, isDone) => api.patch(`/steps/${stepId}`, { is_done: isDone }).then((r) => r.data);

// ── AI Generation ──────────────────────────────────────
export const generateDraft = (assignmentId) => api.post(`/assignments/${assignmentId}/draft`).then((r) => r.data);
export const generateHomeworkTurnin = (assignmentId) => api.post(`/assignments/${assignmentId}/homework-turnin`).then((r) => r.data);
export const generateHomeworkStudy = (assignmentId) => api.post(`/assignments/${assignmentId}/homework-study`).then((r) => r.data);

// ── Study Guides ───────────────────────────────────────
export const getStudyGuides = (courseId) => api.get(`/courses/${courseId}/study-guides`).then((r) => r.data);
export const generateStudyGuide = (courseId, examTitle, materialIds = []) => {
  const params = new URLSearchParams({ exam_title: examTitle });
  if (materialIds.length > 0) params.append("material_ids", materialIds.join(","));
  return api.post(`/courses/${courseId}/study-guide?${params}`).then((r) => r.data);
};

export default api;

// ── Context Usage ──────────────────────────────────────
export const getContextUsage = (courseId) => api.get(`/courses/${courseId}/context-usage`).then((r) => r.data);
