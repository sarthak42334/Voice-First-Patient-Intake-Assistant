import React, { useState } from 'react';
import {
  Search,
  FileText,
  Download,
  Trash2,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Database
} from 'lucide-react';
import { Intake } from '../types';
import { getPdfExportUrl, deleteIntake } from '../api/client';

interface IntakeDashboardProps {
  intakes: Intake[];
  onRefresh: () => void;
  onSelectIntake: (intake: Intake) => void;
  onNewIntake: () => void;
}

export const IntakeDashboard: React.FC<IntakeDashboardProps> = ({
  intakes,
  onRefresh,
  onSelectIntake,
  onNewIntake,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const filteredIntakes = intakes.filter((i) => {
    const matchesSearch =
      i.patient_display_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.raw_transcript && i.raw_transcript.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (i.approved_by_worker && i.approved_by_worker.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'approved' && i.status === 'approved') ||
      (statusFilter === 'draft' && i.status !== 'approved');

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this intake record from SQLite?')) return;
    setIsDeletingId(id);
    try {
      await deleteIntake(id);
      onRefresh();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-slate-900">Saved Patient Intake Records</h2>
          </div>
          <p className="text-xs text-slate-500">
            Stored in local SQLite database • Reopen to review, modify, or export PDF reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            type="button"
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onNewIntake}
            type="button"
            className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Intake</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 my-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Patient ID or transcript..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-teal-500 bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-medium">
          <span className="text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 focus:outline-teal-500 cursor-pointer"
          >
            <option value="all">All Records ({intakes.length})</option>
            <option value="approved">Approved</option>
            <option value="draft">Draft / In Progress</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      {filteredIntakes.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
          <p className="text-sm font-medium text-slate-600">No intake records found</p>
          <p className="text-xs text-slate-400 mt-1">
            Start a new intake from audio or load a synthetic demo preset.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Patient ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Language & Provider</th>
                <th className="px-4 py-3">Created / Sign-Off</th>
                <th className="px-4 py-3">Facts Extracted</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIntakes.map((intake) => {
                const isApproved = intake.status === 'approved';
                const createdDate = new Date(intake.created_at).toLocaleString();

                return (
                  <tr
                    key={intake.id}
                    onClick={() => onSelectIntake(intake)}
                    className="hover:bg-teal-50/30 transition-all cursor-pointer group"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-teal-700 text-sm">
                      {intake.patient_display_id}
                    </td>
                    <td className="px-4 py-3">
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block font-medium text-slate-800">
                        {intake.transcript_language || 'hi-IN'}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">
                        {intake.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-600 block">{createdDate}</span>
                      {intake.approved_by_worker && (
                        <span className="text-[10px] text-emerald-700 block">
                          By: {intake.approved_by_worker}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800">
                        {intake.facts ? intake.facts.length : 0} items
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={getPdfExportUrl(intake.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded text-teal-700 hover:bg-teal-100 transition-all"
                          title="Download PDF Intake Record"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => onSelectIntake(intake)}
                          type="button"
                          className="p-1.5 rounded text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                          title="View Intake Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(intake.id, e)}
                          disabled={isDeletingId === intake.id}
                          type="button"
                          className="p-1.5 rounded text-rose-600 hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-40"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

