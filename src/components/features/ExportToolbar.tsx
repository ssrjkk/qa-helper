import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExportToolbarProps {
  output: string;
  context?: string;
  taskType?: string;
}

export function ExportToolbar({ output, context, taskType }: ExportToolbarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyAsJSON = () => {
    const data = {
      taskType,
      context,
      output,
      exportedAt: new Date().toISOString(),
    };
    handleCopy(JSON.stringify(data, null, 2), 'json');
    setShowMenu(false);
  };

  const copyAsMarkdown = () => {
    const md = `# QA Copilot BY ssrjkk Export\n\n**Task:** ${taskType || 'N/A'}\n\n## Context\n\n${context || 'N/A'}\n\n## Output\n\n${output}`;
    handleCopy(md, 'md');
    setShowMenu(false);
  };

  const downloadAsText = () => {
    const content = `QA Copilot BY ssrjkk Export
Task: ${taskType || 'N/A'}
Date: ${new Date().toLocaleString()}
${'='.repeat(50)}

CONTEXT:
${context || 'N/A'}

${'='.repeat(50)}

OUTPUT:
${output}`;
    const filename = `qa-export-${Date.now()}.txt`;
    downloadFile(content, filename, 'text/plain');
    setShowMenu(false);
  };

  const downloadAsMarkdown = () => {
    const md = `# QA Copilot BY ssrjkk Export

**Task:** ${taskType || 'N/A'}  
**Date:** ${new Date().toLocaleString()}

---

## Context

${context || 'N/A'}

---

## Output

${output}`;
    const filename = `qa-export-${Date.now()}.md`;
    downloadFile(md, filename, 'text/markdown');
    setShowMenu(false);
  };

  const copyPlain = () => {
    handleCopy(output, 'plain');
    setShowMenu(false);
  };

  if (!output) return null;

  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowMenu(!showMenu)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs text-gray-300 hover:bg-white/20 transition-colors"
      >
        <span>📤</span>
        <span>Export</span>
        <span className={`transition-transform ${showMenu ? 'rotate-180' : ''}`}>▼</span>
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowMenu(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 z-50 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden min-w-48"
            >
              <div className="p-2">
                <p className="text-xs text-gray-500 px-2 py-1 mb-1">Copy</p>
                <ExportButton 
                  icon="📄" 
                  label="Plain Text" 
                  shortcut="⌘C" 
                  onClick={copyPlain}
                  copied={copied === 'plain'}
                />
                <ExportButton 
                  icon="📋" 
                  label="Copy as JSON" 
                  onClick={copyAsJSON}
                  copied={copied === 'json'}
                />
                <ExportButton 
                  icon="📝" 
                  label="Copy as Markdown" 
                  onClick={copyAsMarkdown}
                  copied={copied === 'md'}
                />
              </div>
              <div className="border-t border-white/10 p-2">
                <p className="text-xs text-gray-500 px-2 py-1 mb-1">Download</p>
                <ExportButton 
                  icon="📥" 
                  label="Download .txt" 
                  onClick={downloadAsText}
                />
                <ExportButton 
                  icon="📥" 
                  label="Download .md" 
                  onClick={downloadAsMarkdown}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExportButton({ 
  icon, 
  label, 
  shortcut, 
  onClick, 
  copied 
}: { 
  icon: string; 
  label: string; 
  shortcut?: string; 
  onClick: () => void; 
  copied?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
    >
      <span className="flex items-center gap-2">
        <span>{icon}</span>
        <span>{copied ? 'Copied!' : label}</span>
      </span>
      {shortcut && <span className="text-xs text-gray-500">{shortcut}</span>}
    </button>
  );
}
