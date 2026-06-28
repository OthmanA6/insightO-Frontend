import { Modal } from '@/shared/components/ui/Modal';
import { Paperclip, LayoutTemplate } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectAttachment: () => void;
  courseId?: string;
  departmentId?: string;
}

export function TaskTypeSelectorModal({ open, onClose, onSelectAttachment, courseId, departmentId }: SelectorProps) {
  const navigate = useNavigate();

  return (
    <Modal open={open} onClose={onClose} title="" size="md" className="bg-app border-panel">
      <div className="p-2 mb-4 text-center">
        <h2 className="text-xl font-black text-content uppercase tracking-widest">Select Task Type</h2>
        <p className="text-xs text-content-muted mt-1 font-bold">Choose how you want to evaluate your students</p>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attachment Task Button */}
        <button
          onClick={() => { onClose(); onSelectAttachment(); }}
          className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-panel-hover bg-app hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all group"
        >
          <div className="p-4 rounded-full bg-panel-hover group-hover:bg-indigo-500/20 text-content-muted group-hover:text-indigo-400 transition-all">
            <Paperclip className="h-8 w-8" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-bold text-content uppercase tracking-wider">Standard Task</h3>
            <p className="text-[10px] text-content-muted mt-2 font-medium">Upload files and set AI rubric</p>
          </div>
        </button>

        {/* Quiz Builder Button */}
        <button
          onClick={() => { 
            onClose(); 
            const searchParams = new URLSearchParams();
            if (courseId) searchParams.set('courseId', courseId);
            if (departmentId) searchParams.set('departmentId', departmentId);
            const query = searchParams.toString();
            navigate(`/dashboard/quiz-builder${query ? `?${query}` : ''}`); 
          }}
          className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-panel-hover bg-app hover:border-purple-500/50 hover:bg-purple-500/10 transition-all group"
        >
          <div className="p-4 rounded-full bg-panel-hover group-hover:bg-purple-500/20 text-content-muted group-hover:text-purple-400 transition-all">
            <LayoutTemplate className="h-8 w-8" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-bold text-content uppercase tracking-wider">Quiz / Form</h3>
            <p className="text-[10px] text-content-muted mt-2 font-medium">Build dynamic questions & tests</p>
          </div>
        </button>
      </div>
    </Modal>
  );
}
