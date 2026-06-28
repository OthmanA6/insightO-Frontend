import { useState, useEffect } from 'react';
import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Loader2, FileCode, FileText } from 'lucide-react';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

interface SystemFileViewerProps {
  fileUrl: string;
  fileName: string;
}

const CODE_EXTENSIONS = ['js', 'ts', 'jsx', 'tsx', 'py', 'json', 'html', 'css', 'c', 'cpp'];

export function SystemFileViewer({ fileUrl, fileName }: SystemFileViewerProps) {
  const [codeContent, setCodeContent] = useState<string>('');
  const [isLoadingCode, setIsLoadingCode] = useState<boolean>(true);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Extract extension safely
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const isCodeFile = CODE_EXTENSIONS.includes(extension);

  // Resolve absolute URL
  const absoluteUrl = fileUrl.startsWith('http') 
    ? fileUrl 
    : new URL(fileUrl, import.meta.env.VITE_API_URL || 'http://localhost:5000').href;

  useEffect(() => {
    if (!isCodeFile) return;

    const fetchCode = async () => {
      setIsLoadingCode(true);
      setCodeError(null);
      try {
        const res = await fetch(absoluteUrl);
        if (!res.ok) throw new Error(`Failed to fetch file: ${res.statusText}`);
        const text = await res.text();
        setCodeContent(text);
      } catch (err: any) {
        setCodeError(err.message || 'Error loading file content');
      } finally {
        setIsLoadingCode(false);
      }
    };

    fetchCode();
  }, [absoluteUrl, isCodeFile]);

  if (isCodeFile) {
    // Map common extensions to Prism languages
    const getLanguage = (ext: string) => {
      switch (ext) {
        case 'js':
        case 'jsx': return 'javascript';
        case 'ts':
        case 'tsx': return 'typescript';
        case 'py': return 'python';
        default: return ext;
      }
    };

    return (
      <div className="rounded-xl overflow-hidden border border-panel-hover bg-app flex flex-col h-[80vh] min-h-[600px] shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-panel border-b border-panel shrink-0">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FileCode className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-content-muted font-mono tracking-tight">{fileName}</span>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto relative custom-scrollbar">
          {isLoadingCode && (
            <div className="absolute inset-0 flex items-center justify-center bg-app/50 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3 bg-panel border border-panel-hover px-5 py-3 rounded-2xl shadow-xl">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-content-muted">Loading Code...</span>
              </div>
            </div>
          )}
          {codeError ? (
            <div className="flex items-center justify-center h-full text-red-400 text-sm font-mono p-6 text-center">
              {codeError}
            </div>
          ) : (
            <SyntaxHighlighter
              language={getLanguage(extension)}
              style={vscDarkPlus}
              showLineNumbers
              customStyle={{
                margin: 0,
                padding: '1.5rem',
                background: 'transparent',
                fontSize: '13px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
              }}
              codeTagProps={{
                style: { fontFamily: 'inherit' }
              }}
            >
              {codeContent}
            </SyntaxHighlighter>
          )}
        </div>
      </div>
    );
  }

  // Document Viewer for non-code files (PDFs, Images, Word docs, etc)
  return (
    <div className="rounded-xl overflow-hidden border border-panel-hover bg-panel flex flex-col h-[80vh] min-h-[600px] shadow-2xl relative">
      {/* Custom Sleek Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-panel border-b border-panel shrink-0 z-10 shadow-sm">
        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <FileText className="h-4 w-4" />
        </div>
        <span className="text-sm font-bold text-content-muted font-mono tracking-tight">{fileName}</span>
      </div>

      <div className="flex-1 relative bg-app min-h-0">
        <div className="absolute inset-0 overflow-auto">
          <DocViewer 
            documents={[{ uri: absoluteUrl, fileName }]} 
            pluginRenderers={DocViewerRenderers}
            config={{ 
            header: { disableHeader: true },
            pdfVerticalScrollByDefault: true,
            pdfZoom: { defaultZoom: 1.0, zoomJump: 0.1 }
          }}
            style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
            className="w-full h-full"
            theme={{
              primary: '#10b981', // emerald-500 for active elements/icons
              secondary: '#050505', // Very dark/black for the viewer toolbar background
              tertiary: '#13151f', // Modal background
              textPrimary: '#f8fafc',
              textSecondary: '#94a3b8',
              textTertiary: '#cbd5e1',
              disableThemeScrollbar: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
