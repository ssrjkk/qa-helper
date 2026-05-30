import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../ui';
import type { Project } from '../../types';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  avatar?: string;
}

export interface SharedProject {
  project: Project;
  sharedWith: TeamMember[];
  inviteLink?: string;
  permissions: 'private' | 'team' | 'public';
}

interface TeamFeaturesProps {
  projects: Project[];
  currentProject: Project | null;
  onShare: (projectId: number, emails: string[], role: 'editor' | 'viewer') => Promise<void>;
  onExportForTeam: (project: Project) => string;
  onImportFromTeam: (data: string) => Promise<boolean>;
  teamMembers?: TeamMember[];
  onInviteMember?: (email: string, role: string) => Promise<void>;
  onRemoveMember?: (memberId: string) => Promise<void>;
}

export function TeamFeatures({
  currentProject,
  onShare,
  onExportForTeam,
  onImportFromTeam,
  teamMembers = [],
  onRemoveMember,
}: TeamFeaturesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'share' | 'collaborate'>('share');
  const [emails, setEmails] = useState('');
  const [shareRole, setShareRole] = useState<'editor' | 'viewer'>('viewer');
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  const [importError, setImportError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = async () => {
    if (!currentProject || !emails.trim()) return;
    setIsLoading(true);
    try {
      const emailList = emails.split(',').map(e => e.trim()).filter(Boolean);
      await onShare(currentProject.id, emailList, shareRole);
      setEmails('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!currentProject) return;
    const data = onExportForTeam(currentProject);
    setExportData(data);
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportData);
  };

  const handleDownloadExport = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject?.name.replace(/\s+/g, '_') || 'project'}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!importData.trim()) return;
    setIsLoading(true);
    setImportError('');
    try {
      const success = await onImportFromTeam(importData);
      if (success) {
        setImportData('');
      } else {
        setImportError('Failed to import. Check the data format.');
      }
    } catch {
      setImportError('Invalid import data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">👥</span>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-200">Team Features</p>
            <p className="text-xs text-gray-500">
              {teamMembers.length > 0 ? `${teamMembers.length} members` : 'Share & collaborate'}
            </p>
          </div>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-gray-400"
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="p-4 space-y-4">
              <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
                <button
                  onClick={() => setActiveTab('share')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === 'share'
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Share
                </button>
                <button
                  onClick={() => setActiveTab('collaborate')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === 'collaborate'
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Export/Import
                </button>
              </div>

              {activeTab === 'share' && (
                <div className="space-y-4">
                  {currentProject ? (
                    <>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Sharing: <span className="text-indigo-400">{currentProject.name}</span></p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={emails}
                            onChange={e => setEmails(e.target.value)}
                            placeholder="email1@..., email2@..."
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500/50"
                          />
                          <select
                            value={shareRole}
                            onChange={e => setShareRole(e.target.value as 'editor' | 'viewer')}
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 outline-none"
                          >
                            <option value="viewer">View</option>
                            <option value="editor">Edit</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={handleShare}
                        disabled={!emails.trim() || isLoading}
                        className="w-full px-4 py-2 bg-indigo-500/30 text-indigo-300 rounded-lg text-sm hover:bg-indigo-500/50 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Sharing...' : 'Share Project'}
                      </button>

                      {teamMembers.length > 0 && (
                        <div className="border-t border-white/10 pt-4">
                          <p className="text-xs text-gray-400 mb-2">Team Members</p>
                          <div className="space-y-2">
                            {teamMembers.map(member => (
                              <div key={member.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-indigo-500/30 rounded-full flex items-center justify-center text-sm text-indigo-300">
                                    {member.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-200">{member.name}</p>
                                    <p className="text-xs text-gray-500">{member.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 text-xs rounded ${
                                    member.role === 'owner' ? 'bg-amber-500/20 text-amber-400' :
                                    member.role === 'editor' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {member.role}
                                  </span>
                                  {member.role !== 'owner' && onRemoveMember && (
                                    <button
                                      onClick={() => onRemoveMember(member.id)}
                                      className="p-1 text-gray-500 hover:text-red-400"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Select a project to share
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'collaborate' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-400">Export Project</p>
                      {currentProject && (
                        <button
                          onClick={handleExport}
                          className="text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          Generate
                        </button>
                      )}
                    </div>
                    {exportData ? (
                      <div className="space-y-2">
                        <textarea
                          value={exportData}
                          readOnly
                          className="w-full h-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleCopyExport}
                            className="flex-1 px-3 py-1.5 text-xs bg-white/5 text-gray-300 rounded-lg hover:bg-white/10"
                          >
                            Copy
                          </button>
                          <button
                            onClick={handleDownloadExport}
                            className="flex-1 px-3 py-1.5 text-xs bg-indigo-500/30 text-indigo-300 rounded-lg hover:bg-indigo-500/50"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 py-2">
                        {currentProject ? 'Click "Generate" to export' : 'Select a project to export'}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <p className="text-xs text-gray-400 mb-2">Import Project</p>
                    <textarea
                      value={importData}
                      onChange={e => { setImportData(e.target.value); setImportError(''); }}
                      placeholder="Paste exported project data..."
                      className="w-full h-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-200 placeholder-gray-500 resize-none outline-none focus:border-indigo-500/50"
                    />
                    {importError && (
                      <p className="text-xs text-red-400 mt-1">{importError}</p>
                    )}
                    <button
                      onClick={handleImport}
                      disabled={!importData.trim() || isLoading}
                      className="w-full mt-2 px-4 py-2 bg-emerald-500/30 text-emerald-300 rounded-lg text-sm hover:bg-emerald-500/50 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Importing...' : 'Import Project'}
                    </button>
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
