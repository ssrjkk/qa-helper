import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, RippleButton } from '../ui';
import { copyToClipboard } from '../../lib';

interface ExportPanelProps {
  output: string;
  context?: string;
  taskType?: string;
  projectName?: string;
  onClose?: () => void;
}

type ExportFormat = 'markdown' | 'pdf' | 'json';

export function ExportPanel({ output, context, taskType, projectName, onClose }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const handleExport = async (format: ExportFormat) => {
    setExporting(true);
    try {
      const { exportUtils } = await import('../../lib/export');
      const options = { output, context, taskType, projectName };
      
      const handlers: Record<ExportFormat, () => Promise<{ blob: Blob; filename: string }>> = {
        markdown: async () => ({
          blob: await exportUtils.toMarkdown(options),
          filename: exportUtils.generateFilename('md', taskType),
        }),
        pdf: async () => ({
          blob: await exportUtils.toPdf(options),
          filename: exportUtils.generateFilename('pdf', taskType),
        }),
        json: async () => ({
          blob: await exportUtils.toJson(options),
          filename: exportUtils.generateFilename('json', taskType),
        }),
      };

      const { blob, filename } = await handlers[format]();
      await exportUtils.downloadFile(blob, filename);
    } catch {
      // Export failed — user notified via UI state
    } finally {
      setExporting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await copyToClipboard(output);
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write failed — non-critical
    }
  };

  const formats = [
    { id: 'markdown' as const, label: 'Markdown', icon: '📝', desc: 'For docs' },
    { id: 'pdf' as const, label: 'PDF', icon: '📄', desc: 'Printable' },
    { id: 'json' as const, label: 'JSON', icon: '📋', desc: 'Raw data' }
  ] as const;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-300">Export Options</h4>
            {onClose && (
              <button
                onClick={onClose}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Close
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {formats.map(format => (
              <button
                key={format.id}
                onClick={() => handleExport(format.id)}
                disabled={exporting}
                className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all disabled:opacity-50"
              >
                <span className="text-2xl">{format.icon}</span>
                <span className="text-xs font-medium text-white">{format.label}</span>
                <span className="text-[10px] text-gray-500">{format.desc}</span>
              </button>
            ))}
          </div>

          <RippleButton
            onClick={handleCopy}
            variant="secondary"
            className="w-full !py-2 text-sm"
          >
            {copied ? '✅ Copied!' : '📋 Copy to Clipboard'}
          </RippleButton>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  );
}
