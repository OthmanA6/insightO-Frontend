import { useState, useEffect } from 'react';
import { getMySubmissions } from '@/shared/api/taskSubmissionApi';
import type { TaskSubmission } from '@/shared/api/taskSubmissionApi';
import { Loader2, ClipboardCheck, Sparkles, AlertCircle, CheckCircle2, Clock, FileText, Download } from 'lucide-react';
import { SystemFileViewer } from '@/shared/components/ui/SystemFileViewer';
import { Modal } from '@/shared/components/ui/Modal';
import { format } from 'date-fns';

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await getMySubmissions();
        setSubmissions(data);
      } catch (error) {
        console.error('Failed to fetch submissions', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest">Retrieving Evaluation Records...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-10 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
      
      <section className="flex flex-col gap-2 pb-6 border-b border-border">
        <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-primary" /> My Evaluations
        </h1>
        <p className="text-sm font-medium text-muted-foreground">
          Historical record of your submissions and received academic feedback.
        </p>
      </section>

      {submissions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-border bg-card flex flex-col items-center gap-4">
          <FileText className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No submissions found. Start working on your active tasks!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {submissions.map((sub) => {
            const task = typeof sub.task_id === 'object' ? sub.task_id as any : { title: 'Unknown Task' };
            
            return (
              <div key={sub.id || sub._id} className="rounded-3xl bg-card border border-border overflow-hidden shadow-sm">
                <div className="p-6 md:p-8 flex flex-col gap-6">
                  
                  {/* Header Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{task.title || 'Assignment Submission'}</h3>
                      <div className="flex items-center gap-2 mt-2 text-xs font-medium text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Submitted on {sub.createdAt ? format(new Date(sub.createdAt), 'MMMM d, yyyy h:mm a') : 'Unknown'}
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="shrink-0">
                      {(sub.status === 'SUBMITTED' || sub.status === 'AI_GRADED') && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold text-xs">
                          <AlertCircle className="h-3.5 w-3.5" /> Under Review
                        </div>
                      )}
                      {sub.status === 'FINALIZED' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Graded
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submission Content Snippet */}
                  {sub.content && (
                    <div className="bg-muted/30 rounded-xl p-4 border border-border">
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">{sub.content}</p>
                    </div>
                  )}

                  {/* Attachments */}
                  {sub.attachments && sub.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {sub.attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/30 transition-colors">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedFile({ url: att.url, name: att.fileName || 'Attachment' });
                            }}
                            className="flex items-center gap-2 text-xs font-bold text-emerald-500 hover:text-emerald-400 cursor-pointer"
                            title="Smart View"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            {att.fileName || 'Attachment'}
                          </button>
                          <div className="w-px h-3.5 bg-primary/20 mx-1"></div>
                          <a
                            href={new URL(att.url, import.meta.env.VITE_API_URL || 'http://localhost:5000').href}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:text-primary/70 transition-colors"
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Evaluation Sections */}

                  {sub.status === 'FINALIZED' && (
                    <div className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/20 p-6 relative overflow-hidden">
                       <div className="absolute top-0 end-0 p-6 opacity-5">
                        <CheckCircle2 className="h-24 w-24 text-emerald-500" />
                      </div>
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" /> Instructor Feedback
                          </h4>
                          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-xl border border-emerald-500/20 shadow-sm">
                            Final Grade: {sub.final_grade}/100
                          </span>
                        </div>
                        {sub.instructor_feedback && (
                          <div className="ps-4 border-s-2 border-emerald-500/50">
                            <p className="text-sm text-foreground/90 font-medium italic">"{sub.instructor_feedback}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* File Viewer Modal */}
      <Modal
        open={!!selectedFile}
        onClose={() => setSelectedFile(null)}
        title={selectedFile?.name || 'File Viewer'}
        size="7xl"
      >
        {selectedFile && (
          <SystemFileViewer fileUrl={selectedFile.url} fileName={selectedFile.name} />
        )}
      </Modal>
    </div>
  );
}
