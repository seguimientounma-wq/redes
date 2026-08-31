'use client';

import { useEffect, useState } from 'react';
import { getComments, addCommentAction } from '@/actions/tasks';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function CommentsSection({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await getComments(taskId);
      setComments(data);
    } catch (e) {
      toast.error('Error al cargar comentarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      loadComments();
    }
  }, [taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await addCommentAction(taskId, newComment);
      setNewComment('');
      await loadComments();
    } catch (error) {
      toast.error('Error al enviar comentario');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center mb-6">
        <MessageSquare className="h-5 w-5 mr-2" />
        Comentarios y Notas de Seguimiento
      </h3>

      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-4 max-h-60 overflow-y-auto border border-gray-100 dark:border-gray-800">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-4">Aún no hay comentarios en esta tarea.</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm text-blue-700 dark:text-blue-400">{comment.autor}</span>
                  <span className="text-xs text-gray-400">{comment.fecha}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{comment.comentario}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escribe un comentario o nota..."
          className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-blue-600 focus:border-blue-600 outline-none dark:text-gray-100"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
        </button>
      </form>
    </div>
  );
}
