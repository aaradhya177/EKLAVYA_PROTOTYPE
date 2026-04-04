"use client";

import { create } from "zustand";

import { reports, type ReportJob } from "@/lib/mock-data";

type ReportStore = {
  pendingReports: ReportJob[];
  generatedReports: ReportJob[];
  enqueueReport: (report: ReportJob) => void;
  completeReport: (report: ReportJob) => void;
};

export const useReportStore = create<ReportStore>((set) => ({
  pendingReports: [],
  generatedReports: reports,
  enqueueReport: (report) => set((state) => ({ pendingReports: [...state.pendingReports, report] })),
  completeReport: (report) =>
    set((state) => ({
      pendingReports: state.pendingReports.filter((item) => item.id !== report.id),
      generatedReports: [report, ...state.generatedReports]
    }))
}));
