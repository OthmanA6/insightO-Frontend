import { useState, useRef } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Loader2, UploadCloud, FileText, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/shared/api/axiosInstance';
import { submitTask } from '@/shared/api/taskSubmissionApi';

interface SubmitTaskModalProps {
  taskId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SubmitTaskModal({ taskId, open, onClose, onSuccess }: SubmitTaskModalProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<{ url: string; fileName?: string; size?: number }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = response.data.data;
      setAttachments((prev) => [...prev, { url: data.url, fileName: file.name, size: data.size }]);
      toast.success('File uploaded successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || error.message || 'File upload failed';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && attachments.length === 0) {
      toast.error('Please provide some content or attach a file.');
      return;
    }

    setIsSubmitting(true);
    try {
      const validAttachments = attachments.map(a => ({ url: a.url, fileName: a.fileName, size: a.size }));
      const payload: any = {};
      if (content.trim()) payload.content = content.trim();
      if (validAttachments.length > 0) payload.attachments = validAttachments;

      await submitTask(taskId, payload);
      toast.success('Task submitted successfully');
      setContent('');
      setAttachments([]);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || error.message || 'Failed to submit task';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="xl" className="bg-background border-border">
      <Modal.Header 
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">Submit Assignment</h2>
              <p className="text-[10px] text-muted-foreground font-black tracking-widest uppercase mt-0.5">Evaluation Process</p>
            </div>
          </div>
        }
      />
      
      <Modal.Body className="p-6 md:p-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Submission Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your response, findings, or notes here..."
              className="bg-card border-border text-foreground min-h-[160px] rounded-2xl focus:ring-primary p-4"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Attachments (Optional)</Label>
            
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-colors ${
                isUploading 
                  ? 'border-primary/50 bg-primary/5 cursor-wait' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer'
              }`}
            >
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".pdf,.png,.jpg,.jpeg,.txt,.js,.ts,.py,.cpp,.java,.html,.css,.json" 
              />
              
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">
                  {isUploading ? 'Uploading securely...' : 'Click to Upload Material'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">PDF, TXT, PNG, JPG (Max 10MB)</p>
              </div>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2 mt-2">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-foreground truncate">{att.fileName || 'Attachment'}</span>
                        {att.size && <span className="text-[10px] text-muted-foreground font-mono">{(att.size / 1024).toFixed(1)} KB</span>}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeAttachment(idx)}
                      className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-border flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={onClose} className="h-12 px-6 rounded-xl text-muted-foreground">
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || (!content.trim() && attachments.length === 0)}
              className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold transition-all flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Submit Assignment
            </Button>
          </div>
          
        </form>
      </Modal.Body>
    </Modal>
  );
}
