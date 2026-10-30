import { ApiResponse, PaginatedResponse, ListParams, buildQueryParams } from "../types.js";
import { api } from "../client.js";

export interface Exam {
  _id: string;
  title: string;
  classId: string;
  sectionId?: string;
  academicYear: string;
  examType: string;
  date: string;
  isPublished: boolean;
  maxMarks?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExamInput {
  title: string;
  classId: string;
  sectionId?: string;
  academicYear: string;
  examType: string;
  date: string;
  maxMarks?: number;
}

export type UpdateExamInput = Partial<CreateExamInput>;

export interface PublishExamInput {
  examId: string;
  isPublished: boolean;
}

export interface BulkPublishInput {
  examIds: string[];
  isPublished: boolean;
}

export interface MarksEntry {
  studentId: string;
  marks: number;
  grade?: string;
}

export interface ExamResult {
  studentId: string;
  studentName: string;
  admissionNo: string;
  marks: number;
  grade?: string;
  maxMarks?: number;
}

export interface BulkPublishResult {
  updated: number;
}

export interface ExamQueryParams extends ListParams {
  classId?: string;
  sectionId?: string;
  academicYear?: string;
  examType?: string;
}

export const examsService = {
  async list(params?: ExamQueryParams) {
    const queryString = buildQueryParams(params as Record<string, string | number | boolean | undefined> ?? {});
    const response = await api.get<PaginatedResponse<Exam>>(`/exams?${queryString}`);
    return response.data;
  },

  async get(id: string) {
    const response = await api.get<ApiResponse<Exam>>(`/exams/${id}`);
    return response.data;
  },

  async create(input: CreateExamInput) {
    const response = await api.post<ApiResponse<Exam>>("/exams", input);
    return response.data;
  },

  async update(id: string, input: UpdateExamInput) {
    const response = await api.put<ApiResponse<Exam>>(`/exams/${id}`, input);
    return response.data;
  },

  async publish(input: PublishExamInput) {
    const response = await api.post<ApiResponse<Exam>>(`/exams/${input.examId}/publish`, { isPublished: input.isPublished });
    return response.data;
  },

  async bulkPublish(input: BulkPublishInput) {
    const response = await api.post<ApiResponse<{ updated: number }>>("/exams/bulk-publish", input);
    return response.data;
  },

  async upsertMarks(examId: string, entries: MarksEntry[]) {
    const response = await api.post<ApiResponse<{ updated: number }>>(`/exams/${examId}/marks`, { entries });
    return response.data;
  },

  async getResults(examId: string) {
    const response = await api.get<ApiResponse<ExamResult[]>>(`/exams/${examId}/results`);
    return response.data;
  },

  async downloadReportCard(studentId: string) {
    const response = await api.get(`/exams/report-card/${studentId}`, { responseType: "blob" });
    return response.data;
  },
};
