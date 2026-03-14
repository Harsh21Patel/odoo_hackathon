export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
export const statusColor = (s) => ({ Draft:'status-draft',Waiting:'status-waiting',Ready:'status-ready',Done:'status-done',Cancelled:'status-cancelled' }[s] || 'status-draft');
export const moveTypeIcon = (t) => ({ receipt:'↓', delivery:'↑', transfer:'⇄', adjustment:'⊕' }[t] || '•');
export const moveTypeColor = (t) => ({ receipt:'success', delivery:'danger', transfer:'info', adjustment:'warning' }[t] || 'info');
export const truncate = (str, n=28) => str?.length > n ? str.slice(0,n)+'…' : str;
