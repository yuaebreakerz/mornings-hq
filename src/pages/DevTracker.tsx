import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  FileText, 
  CheckSquare, 
  Square, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  Pin, 
  Tag, 
  LayoutGrid, 
  List, 
  TrendingUp,
  Info,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  FileDown,
  FileCode,
  ArrowRightCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { productService } from '../services/googleService';
import { useNotifications } from '../components/NotificationProvider';

// Constants & Types
export interface DevTask {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'On Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  deadline: string;
  category: string;
  isPinned: boolean;
  referenceLink?: string;
  referenceImage?: string; // base64 payload or url
  referenceFile?: string; // base64 payload or title or url
  fileName?: string;
  created_at: string;
}

const CATEGORIES = ['Semua', 'Menu & Resep', 'IT & Sistem', 'Operasional', 'Dapur & Supply', 'Marketing', 'Lainnya'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['Pending', 'On Progress', 'Done'];

export default function DevTracker() {
  const { triggerTestNotification } = useNotifications();
  const [tasks, setTasks] = useState<DevTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'local'>('local');

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [recentActivities, setRecentActivities] = useState<string[]>([]);

  // Task Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<DevTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<DevTask | null>(null);

  // Drag-and-drop / Touch-dragging states
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [touchActiveId, setTouchActiveId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Pending' as DevTask['status'],
    priority: 'Medium' as DevTask['priority'],
    deadline: format(new Date(), 'yyyy-MM-dd'),
    category: 'IT & Sistem',
    isPinned: false,
    referenceLink: '',
    referenceImage: '',
    referenceFile: '',
    fileName: ''
  });

  // Reference upload triggers
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);

  // Load and sync tasks on mount
  useEffect(() => {
    loadTasks();
    const storedLogs = localStorage.getItem('mornings_dev_logs');
    if (storedLogs) {
      setRecentActivities(JSON.parse(storedLogs));
    } else {
      const defaultLogs = [
        `[${format(new Date(), 'HH:mm')}] Sistem tracker diinisialisasi secara responsif.`,
        `[${format(new Date(), 'HH:mm')}] Workspace developer terhubung dengan lancar.`
      ];
      setRecentActivities(defaultLogs);
      localStorage.setItem('mornings_dev_logs', JSON.stringify(defaultLogs));
    }
  }, []);

  const addActivityLog = (message: string) => {
    const timestamp = format(new Date(), 'HH:mm');
    const log = `[${timestamp}] ${message}`;
    setRecentActivities(prev => {
      const updated = [log, ...prev.slice(0, 15)];
      localStorage.setItem('mornings_dev_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const loadTasks = async () => {
    setLoading(true);
    // 1. Load from local cache for immediate response
    const cachedTasks = localStorage.getItem('mornings_dev_tasks');
    let localList: DevTask[] = [];
    if (cachedTasks) {
      try {
        localList = JSON.parse(cachedTasks);
        setTasks(localList);
      } catch (e) {
        console.warn('Failed to parse cached dev tasks', e);
      }
    }

    // 2. Attempt to background sync with Google Sheets (table: dev_tasks)
    try {
      const sheetsList = await productService.getAll().catch(() => null); 
      // If we are getting a list, but it's not the dev_tasks tab (e.g. productService.getAll is for products as default),
      // we can try direct request on sheets paths if the GAS script supports it.
      // Let's call request for 'dev_tasks' directly if we have API configured.
      const response = await productService.create({ action: 'check' }, 'dev_tasks').catch(() => null);
      
      // Let's read path='dev_tasks' by generic read (if the sheet contains a header that matches, or try reading)
      // Since path can be anything in request(), we can make a custom call.
      // However to keep it 100% resilient and avoid breaking when 'dev_tasks' sheet does not exist in the user's spreadsheet,
      // we merge it beautifully with localStorage. If fetching sheets throws an error, we keep 'local' mode.
      const urlEnv = localStorage.getItem('mornings_gas_api_url_override') || (import.meta as any).env.VITE_GAS_API_URL;
      if (urlEnv && !urlEnv.includes('YOUR_SCRIPT_ID')) {
        // Let's query 'dev_tasks' sheet via GAS
        const result = await fetch(`${urlEnv.trim()}?path=dev_tasks&action=read&cb=${Date.now()}`)
          .then(res => res.json())
          .catch(() => null);
        
        if (result && Array.isArray(result) && result.length > 0) {
          // Sync successful!
          setTasks(result as DevTask[]);
          localStorage.setItem('mornings_dev_tasks', JSON.stringify(result));
          setSyncStatus('synced');
        } else {
          // Sheet exists but empty, or not fully set up. Fall back to local
          if (localList.length === 0) {
            const initialMock: DevTask[] = [
              {
                id: '1',
                title: 'Tambahkan Modul Suara Peringatan IoT',
                description: 'Membutuhkan suara ringing dual-tone untuk tablet dapur ketika order di sheets statusnya berubah.',
                status: 'Done',
                priority: 'High',
                deadline: format(new Date(), 'yyyy-MM-dd'),
                category: 'IT & Sistem',
                isPinned: true,
                created_at: new Date().toISOString()
              },
              {
                id: '2',
                title: 'Desain Banner Promo Menu Smoothies Ramadhan',
                description: 'Desain visual minimalis dengan warna ungu-neon untuk promosi ritual smoothie sahur.',
                status: 'On Progress',
                priority: 'Medium',
                deadline: format(new Date(Date.now() + 86400000 * 3), 'yyyy-MM-dd'),
                category: 'Marketing',
                isPinned: false,
                created_at: new Date().toISOString()
              },
              {
                id: '3',
                title: 'Revisi SOP Sanitasi Cup Blender',
                description: 'Revisi tata cara mencuci wadah blender setelah produksi high-protein cup agar mencegah kontaminasi silang rasa.',
                status: 'Pending',
                priority: 'Low',
                deadline: format(new Date(Date.now() + 86400000 * 5), 'yyyy-MM-dd'),
                category: 'Operasional',
                isPinned: false,
                created_at: new Date().toISOString()
              }
            ];
            setTasks(initialMock);
            localStorage.setItem('mornings_dev_tasks', JSON.stringify(initialMock));
            syncToSheets(initialMock);
          } else {
            // Local list exists but sheet was empty/new, let's sync local tasks up to Sheets!
            syncToSheets(localList);
          }
          setSyncStatus('local');
        }
      } else {
        // No GAS configured, use local list
        if (localList.length === 0) {
          const initialMock: DevTask[] = [
            {
              id: '1',
              title: 'Integrasikan Modul Ringing Mixer Dapur',
              description: 'Implementasi notifikasi ringing otomatis bersuara double-click untuk HP/Tablet dwi-lokasi.',
              status: 'Done',
              priority: 'High',
              deadline: format(new Date(), 'yyyy-MM-dd'),
              category: 'IT & Sistem',
              isPinned: true,
              created_at: new Date().toISOString()
            },
            {
              id: '2',
              title: 'Buat Menu Baru: Dragon Fruit Chia Glow',
              description: 'Menu ritual pagi penambah kolagen dengan base buah naga merah segar dan organic chia seeds.',
              status: 'On Progress',
              priority: 'High',
              deadline: format(new Date(Date.now() + 86400000 * 4), 'yyyy-MM-dd'),
              category: 'Menu & Resep',
              isPinned: true,
              created_at: new Date().toISOString()
            }
          ];
          setTasks(initialMock);
          localStorage.setItem('mornings_dev_tasks', JSON.stringify(initialMock));
        }
        setSyncStatus('local');
      }
    } catch (e) {
      console.warn('Sheets sync error, using local database:', e);
      setSyncStatus('local');
    } finally {
      setLoading(false);
    }
  };

  const syncToSheets = async (currentTasksList: DevTask[]) => {
    setIsSyncing(true);
    const urlEnv = localStorage.getItem('mornings_gas_api_url_override') || (import.meta as any).env.VITE_GAS_API_URL;
    if (urlEnv && !urlEnv.includes('YOUR_SCRIPT_ID')) {
      try {
        // We write the collection of tasks using a batch action to path table 'dev_tasks'
        // For Google Apps Script, we can write a custom dispatch
        // We can do this safely row by row or overwrite. Overwriting or writing single task works.
        // We'll submit a full sync packet.
        await fetch(urlEnv.trim() + '?path=dev_tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'sync_sheet',
            sheet: 'dev_tasks',
            data: currentTasksList
          })
        }).catch(() => null);
        setSyncStatus('synced');
      } catch (e) {
        console.warn('Sync failed:', e);
        setSyncStatus('local');
      }
    }
    setIsSyncing(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Create or Update Task
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    let finalImageUrl = formData.referenceImage;
    let finalFileUrl = formData.referenceFile;
    let nameOfFile = formData.fileName;

    const urlEnv = localStorage.getItem('mornings_gas_api_url_override') || (import.meta as any).env.VITE_GAS_API_URL;
    const isGasConfigured = urlEnv && !urlEnv.includes('YOUR_SCRIPT_ID');

    if (imageFile) {
      try {
        const base64Data = await fileToBase64(imageFile);
        if (isGasConfigured) {
          const parts = base64Data.split(';base64,');
          const mimeType = parts[0].split(':')[1];
          const rawBase64 = parts[1];

          const resp = await fetch(urlEnv.trim(), {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'upload_file',
              folder: 'DevTracker',
              file: {
                base64: rawBase64,
                mimeType: mimeType,
                filename: imageFile.name
              }
            })
          }).then(r => r.json());

          if (resp && resp.success && resp.url) {
            finalImageUrl = resp.url;
          } else {
            finalImageUrl = base64Data;
          }
        } else {
          finalImageUrl = base64Data;
        }
      } catch (err) {
        console.error('Image base64 convert / upload error:', err);
      }
    }

    if (docFile) {
      try {
        const base64Data = await fileToBase64(docFile);
        nameOfFile = docFile.name;
        if (isGasConfigured) {
          const parts = base64Data.split(';base64,');
          const mimeType = parts[0].split(':')[1];
          const rawBase64 = parts[1];

          const resp = await fetch(urlEnv.trim(), {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'upload_file',
              folder: 'DevTracker',
              file: {
                base64: rawBase64,
                mimeType: mimeType,
                filename: docFile.name
              }
            })
          }).then(r => r.json());

          if (resp && resp.success && resp.url) {
            finalFileUrl = resp.url;
          } else {
            finalFileUrl = base64Data;
          }
        } else {
          finalFileUrl = base64Data;
        }
      } catch (err) {
        console.error('File base64 convert / upload error:', err);
      }
    }

    const taskData: DevTask = {
      id: editingTask ? editingTask.id : Date.now().toString(),
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      deadline: formData.deadline,
      category: formData.category,
      isPinned: formData.isPinned,
      referenceLink: formData.referenceLink || undefined,
      referenceImage: finalImageUrl || undefined,
      referenceFile: finalFileUrl || undefined,
      fileName: nameOfFile || undefined,
      created_at: editingTask ? editingTask.created_at : new Date().toISOString()
    };

    let updatedTasks: DevTask[] = [];

    if (editingTask) {
      updatedTasks = tasks.map(t => t.id === editingTask.id ? taskData : t);
      addActivityLog(`Mengedit tugas: "${taskData.title}" [${taskData.category}]`);
    } else {
      updatedTasks = [taskData, ...tasks];
      addActivityLog(`Menambahkan ide baru: "${taskData.title}" [${taskData.priority}]`);
    }

    setTasks(updatedTasks);
    localStorage.setItem('mornings_dev_tasks', JSON.stringify(updatedTasks));

    // Async sync in background
    syncToSheets(updatedTasks);

    setShowModal(false);
    setEditingTask(null);
    setImageFile(null);
    setDocFile(null);
    setFormData({
      title: '',
      description: '',
      status: 'Pending',
      priority: 'Medium',
      deadline: format(new Date(), 'yyyy-MM-dd'),
      category: 'IT & Sistem',
      isPinned: false,
      referenceLink: '',
      referenceImage: '',
      referenceFile: '',
      fileName: ''
    });

    setLoading(false);
    triggerTestNotification('system');
  };

  // Toggle item status quickly (checkbox / checkbox empty)
  const toggleTaskDone = (task: DevTask) => {
    const newStatus: DevTask['status'] = task.status === 'Done' ? 'Pending' : 'Done';
    const updatedTasks = tasks.map(t => {
      if (t.id === task.id) {
        return { ...t, status: newStatus };
      }
      return t;
    });

    setTasks(updatedTasks);
    localStorage.setItem('mornings_dev_tasks', JSON.stringify(updatedTasks));
    addActivityLog(`Kebijakan status [${newStatus}] pada tugas: "${task.title}"`);
    syncToSheets(updatedTasks);

    if (newStatus === 'Done') {
      notificationServicePlayChime();
    }
  };

  const notificationServicePlayChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}
  };

  const handleEditClick = (task: DevTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline,
      category: task.category,
      isPinned: task.isPinned,
      referenceLink: task.referenceLink || '',
      referenceImage: task.referenceImage || '',
      referenceFile: task.referenceFile || '',
      fileName: task.fileName || ''
    });
    setImageFile(null);
    setDocFile(null);
    setShowModal(true);
  };

  const handleDeleteTask = (id: string, name: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setTaskToDelete(task);
    }
  };

  // HTML5 Drag handlers & helpers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: DevTask['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== targetStatus) {
        handleMoveStatus(task, targetStatus);
      }
    }
    setDraggedTaskId(null);
    setDragOverCol(null);
  };

  // Mobile Touch handlers & helpers
  const handleTouchStart = (e: React.TouchEvent, taskId: string) => {
    setTouchActiveId(taskId);
  };

  const handleTouchEnd = (e: React.TouchEvent, task: DevTask) => {
    if (!touchActiveId) return;
    const touch = e.changedTouches[0];
    if (touch) {
      const elem = document.elementFromPoint(touch.clientX, touch.clientY);
      if (elem) {
        const col = elem.closest('[data-column-status]');
        if (col) {
          const nextStatus = col.getAttribute('data-column-status') as DevTask['status'];
          if (nextStatus && nextStatus !== task.status) {
            handleMoveStatus(task, nextStatus);
          }
        }
      }
    }
    setTouchActiveId(null);
  };

  const handlePinTask = (task: DevTask) => {
    const updated = tasks.map(t => t.id === task.id ? { ...t, isPinned: !t.isPinned } : t);
    setTasks(updated);
    localStorage.setItem('mornings_dev_tasks', JSON.stringify(updated));
    addActivityLog(`${task.isPinned ? 'Lepas Pin' : 'Pasang Pin'} tugas: "${task.title}"`);
    syncToSheets(updated);
  };

  const handleMoveStatus = (task: DevTask, nextStatus: DevTask['status']) => {
    const updated = tasks.map(t => t.id === task.id ? { ...t, status: nextStatus } : t);
    setTasks(updated);
    localStorage.setItem('mornings_dev_tasks', JSON.stringify(updated));
    addActivityLog(`Menggeser alur kerja ke [${nextStatus}] untuk "${task.title}"`);
    syncToSheets(updated);
  };

  // Filter Logic
  const filteredTasks = tasks.filter(t => {
    const matchSearch = (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'Semua' || t.category === selectedCategory;
    const matchPriority = selectedPriority === 'All' || t.priority === selectedPriority;
    const matchStatus = selectedStatus === 'All' || t.status === selectedStatus;
    return matchSearch && matchCat && matchPriority && matchStatus;
  });

  // Split tasks by Status for Board View
  const pendingTasks = filteredTasks.filter(t => t.status === 'Pending');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'On Progress');
  const doneTasks = filteredTasks.filter(t => t.status === 'Done');

  // Calculations for Progress Tracker
  const totalCount = filteredTasks.length;
  const completedCount = filteredTasks.filter(t => t.status === 'Done').length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Render priority badge
  const renderPriorityBadge = (p: DevTask['priority']) => {
    switch (p) {
      case 'High':
        return <span className="px-2 py-0.5 bg-rose-550/10 text-rose-600 rounded text-[9px] font-black uppercase tracking-wider border border-rose-200">High</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded text-[9px] font-black uppercase tracking-wider border border-amber-200">Medium</span>;
      case 'Low':
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-wider border border-slate-200">Low</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper header with live synchronizer info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-serif font-black text-slate-900">Catatan Pengembangan & Ide</h2>
            {syncStatus === 'synced' ? (
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Cloud Sync
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[10px] bg-sky-550/5 text-brand-purple px-2 py-0.5 rounded-full border border-brand-purple/10">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Offline Draft
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Fasilitas papan kolaboratif untuk ide, task list dapur, perbaikan sistem digital Mornings.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-205">
            <button
              onClick={() => setViewMode('board')}
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer",
                viewMode === 'board' ? "bg-white text-brand-purple shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
              title="Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer",
                viewMode === 'list' ? "bg-white text-brand-purple shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
              title="List Notion View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setFormData({
                title: '',
                description: '',
                status: 'Pending',
                priority: 'Medium',
                deadline: format(new Date(), 'yyyy-MM-dd'),
                category: 'IT & Sistem',
                isPinned: false,
                referenceLink: '',
                referenceImage: '',
                referenceFile: '',
                fileName: ''
              });
              setImageFile(null);
              setDocFile(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-brand-purple/10 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 text-brand-neon" />
            Tambah Ide/Task
          </button>
        </div>
      </div>

      {/* Main Stats Row & Recent Activities */}
      <div className="grid grid-cols-12 gap-5">
        {/* Progress bar tracker card */}
        <div className="col-span-12 md:col-span-8 p-5 bg-white border border-slate-205 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-450 block">Rencana rilis harian</span>
              <h3 className="font-serif font-black text-slate-900 mt-1">Status Progres Kerja</h3>
            </div>
            <span className="text-xl font-serif font-black text-brand-purple">{percentage}% Selesai</span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-3">
            <div 
              className="bg-brand-purple h-full rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <span>{completedCount} dari {totalCount} task tuntas</span>
            <span className="text-brand-purple font-black">Mornings HQ Dev Hub v2.1</span>
          </div>
        </div>

        {/* Activity Feed log ticker widget */}
        <div className="col-span-12 md:col-span-4 p-5 bg-white border border-slate-205 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Riwayat Aktivitas Developer</span>
            <div className="mt-3.5 space-y-2 max-h-[85px] overflow-y-auto scrollbar-thin">
              {recentActivities.map((act, idx) => (
                <p key={idx} className="text-[9px] text-slate-500 font-mono tracking-tight leading-normal border-b border-slate-50 pb-1 last:border-0 truncate">
                  {act}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter, Tags, Search controls */}
      <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
          {/* Search Input */}
          <div className="relative sm:col-span-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari ide, task, bug, dsb..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-brand-purple rounded-xl text-xs outline-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Priority filter */}
          <div className="sm:col-span-2.5 flex items-center gap-2 bg-slate-50 border border-slate-150 px-3 py-1 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-transparent border-0 text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none w-full py-1 cursor-pointer"
            >
              <option value="All">Semua Prioritas</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Status filter */}
          <div className="sm:col-span-2.5 flex items-center gap-2 bg-slate-50 border border-slate-150 px-3 py-1 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent border-0 text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none w-full py-1 cursor-pointer"
            >
              <option value="All">Semua Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Categorization tag list filter */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-50">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mr-2 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-slate-400" /> Kategori:
          </span>
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer",
                selectedCategory === category 
                  ? "bg-brand-purple text-brand-neon shadow-sm" 
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Primary view content layout */}
      <AnimatePresence mode="wait">
        {viewMode === 'board' ? (
          /* =================================BOARD VIEW================================= */
          <motion.div 
            key="board"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
          >
            {/* Column 1: Pending */}
            <div 
              data-column-status="Pending"
              onDragOver={(e) => { e.preventDefault(); }}
              onDragEnter={() => setDragOverCol('Pending')}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, 'Pending')}
              className={cn(
                "bg-slate-100/70 border rounded-2xl p-4 min-h-[500px] transition-all duration-200",
                dragOverCol === 'Pending' ? "border-brand-purple bg-brand-purple/[0.02]" : "border-slate-205"
              )}
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <div className="flex items-center gap-25">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Ide & Antrean</h3>
                </div>
                <span className="text-[10px] font-black text-slate-500 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-full">{pendingTasks.length}</span>
              </div>

              <div className="space-y-3.5">
                {pendingTasks.length === 0 ? (
                  <div className="text-center py-10 text-slate-450 text-[11px] font-medium border border-dashed border-slate-200 rounded-xl bg-white/40">
                    Tidak ada ide di sini.
                  </div>
                ) : (
                  pendingTasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onEdit={handleEditClick} 
                      onDelete={handleDeleteTask} 
                      onToggle={toggleTaskDone} 
                      onPin={handlePinTask}
                      onMoveRight={() => handleMoveStatus(task, 'On Progress')}
                      renderPriority={renderPriorityBadge} 
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                      isDragging={draggedTaskId === task.id || touchActiveId === task.id}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Column 2: On Progress */}
            <div 
              data-column-status="On Progress"
              onDragOver={(e) => { e.preventDefault(); }}
              onDragEnter={() => setDragOverCol('On Progress')}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, 'On Progress')}
              className={cn(
                "bg-slate-100/70 border rounded-2xl p-4 min-h-[500px] transition-all duration-200",
                dragOverCol === 'On Progress' ? "border-brand-purple bg-brand-purple/[0.02]" : "border-slate-205"
              )}
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <div className="flex items-center gap-25">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Sedang Dikerjakan</h3>
                </div>
                <span className="text-[10px] font-black text-slate-500 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-full">{inProgressTasks.length}</span>
              </div>

              <div className="space-y-3.5">
                {inProgressTasks.length === 0 ? (
                  <div className="text-center py-10 text-slate-450 text-[11px] font-medium border border-dashed border-slate-200 rounded-xl bg-white/40">
                    Belum ada pekerjaan dikerjakan.
                  </div>
                ) : (
                  inProgressTasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onEdit={handleEditClick} 
                      onDelete={handleDeleteTask} 
                      onToggle={toggleTaskDone} 
                      onPin={handlePinTask}
                      onMoveLeft={() => handleMoveStatus(task, 'Pending')}
                      onMoveRight={() => handleMoveStatus(task, 'Done')}
                      renderPriority={renderPriorityBadge} 
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                      isDragging={draggedTaskId === task.id || touchActiveId === task.id}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Column 3: Done */}
            <div 
              data-column-status="Done"
              onDragOver={(e) => { e.preventDefault(); }}
              onDragEnter={() => setDragOverCol('Done')}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, 'Done')}
              className={cn(
                "bg-slate-100/70 border rounded-2xl p-4 min-h-[500px] transition-all duration-200",
                dragOverCol === 'Done' ? "border-brand-purple bg-brand-purple/[0.02]" : "border-slate-205"
              )}
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <div className="flex items-center gap-25">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Selesai / Rilis</h3>
                </div>
                <span className="text-[10px] font-black text-slate-500 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-full">{doneTasks.length}</span>
              </div>

              <div className="space-y-3.5">
                {doneTasks.length === 0 ? (
                  <div className="text-center py-10 text-slate-450 text-[11px] font-medium border border-dashed border-slate-200 rounded-xl bg-white/40">
                    Belum ada tugas selesai.
                  </div>
                ) : (
                  doneTasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onEdit={handleEditClick} 
                      onDelete={handleDeleteTask} 
                      onToggle={toggleTaskDone} 
                      onPin={handlePinTask}
                      onMoveLeft={() => handleMoveStatus(task, 'On Progress')}
                      renderPriority={renderPriorityBadge} 
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                      isDragging={draggedTaskId === task.id || touchActiveId === task.id}
                    />
                  ))
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* =================================LIST NOTION VIEW================================= */
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-[60px] text-center">Pin</th>
                    <th className="py-4 px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 w-[60px] text-center">Status</th>
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Nama Ide / Pekerjaan</th>
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Kategori</th>
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Prioritas</th>
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Deadline</th>
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Referensi</th>
                    <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">Belum ada tugas atau ide pengembangan. Klik "Tambah Ide/Task" di kanan atas.</td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr key={task.id} className={cn("hover:bg-slate-50/40 transition-colors", task.status === 'Done' && "bg-slate-50/20")}>
                        <td className="py-4 px-5 text-center">
                          <button
                            onClick={() => handlePinTask(task)}
                            className={cn("p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer", task.isPinned ? "text-amber-500" : "text-slate-300")}
                          >
                            <Pin className="w-3.5 h-3.5 fill-current" />
                          </button>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <button
                            onClick={() => toggleTaskDone(task)}
                            className="inline-flex text-slate-400 hover:text-brand-purple transition-colors cursor-pointer"
                          >
                            {task.status === 'Done' ? (
                              <CheckSquare className="w-5 h-5 text-brand-purple" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-300" />
                            )}
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <span className={cn("text-xs font-bold font-serif text-slate-800 tracking-tight", task.status === 'Done' && "line-through text-slate-400")}>
                              {task.title}
                            </span>
                            <p className="text-[10px] text-slate-450 mt-1 max-w-sm line-clamp-1">{task.description}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[9px] font-extrabold uppercase tracking-widest">{task.category}</span>
                        </td>
                        <td className="py-4 px-4">{renderPriorityBadge(task.priority)}</td>
                        <td className="py-4 px-4">
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> {task.deadline}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5">
                            {task.referenceLink && (
                              <a href={task.referenceLink} target="_blank" rel="noopener noreferrer" className="p-1 bg-slate-100 hover:bg-slate-200 text-brand-purple rounded transition-all" title="Link Ref">
                                <LinkIcon className="w-3 h-3" />
                              </a>
                            )}
                            {task.referenceImage && (
                              <a href={task.referenceImage} target="_blank" rel="noopener noreferrer" className="p-1 bg-slate-100 hover:bg-slate-200 text-indigo-550 rounded transition-all cursor-pointer" title="Buka Gambar Acuan">
                                <ImageIcon className="w-3 h-3 text-brand-purple" />
                              </a>
                            )}
                            {task.referenceFile && (
                              <a href={task.referenceFile} target="_blank" rel="noopener noreferrer" className="p-1 bg-slate-100 hover:bg-slate-200 text-indigo-550 rounded text-[8px] font-black uppercase flex items-center gap-0.5 cursor-pointer" title={task.fileName || 'Buka File Pendukung'}>
                                <FileText className="w-3 h-3 text-brand-purple" />
                              </a>
                            )}
                            {!task.referenceLink && !task.referenceImage && !task.referenceFile && <span className="text-slate-400 text-[10px]">-</span>}
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right space-x-1.5">
                          <button
                            onClick={() => handleEditClick(task)}
                            className="p-1.5 text-slate-500 hover:text-brand-purple hover:bg-slate-100 rounded-lg transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id, task.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Creation & Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-2xl relative"
          >
            <button 
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 p-2 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            <h3 className="text-lg font-serif font-black text-slate-900 border-b border-slate-100 pb-3 mb-5">
              {editingTask ? 'Edit Task / Ide Pengembangan' : 'Tambah Ide atau Pekerjaan Baru'}
            </h3>

            <form onSubmit={handleSaveTask} className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-550 block mb-1">Judul Pekerjaan/Ide *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Buat bot notification WhatsApp"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-brand-purple rounded-xl text-xs outline-none transition-all placeholder:text-slate-400 font-bold"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-550 block mb-1">Deskripsi Detail atau Notes</label>
                <textarea
                  placeholder="Tulis acuan pengerjaan, scope target, ideation detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2.5}
                  className="w-full px-4 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-brand-purple rounded-xl text-xs outline-none transition-all placeholder:text-slate-400 font-medium whitespace-pre-wrap"
                />
              </div>

              {/* Split Category & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-550 block mb-1">Kategori Workspace</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none cursor-pointer font-bold text-slate-800"
                  >
                    {CATEGORIES.filter(c => c !== 'Semua').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-550 block mb-1">Tingkat Prioritas</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as DevTask['priority'] })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none cursor-pointer font-bold text-slate-800"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Split Deadline & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-550 block mb-1">Batas Waktu/Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none cursor-pointer font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-550 block mb-1">Status Alur Kerja</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as DevTask['status'] })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none cursor-pointer font-bold text-slate-800"
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pin Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinTaskInput"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="rounded text-brand-purple focus:ring-brand-purple cursor-pointer"
                />
                <label htmlFor="pinTaskInput" className="text-[10px] font-black uppercase tracking-widest text-slate-700 cursor-pointer flex items-center gap-1">
                  <Pin className="w-3 h-3 text-slate-500 fill-current" /> Penting (Sematkan di Atas)
                </label>
              </div>

              {/* References Block */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Dukungan Referensi (Tautan, Gambar, Dokumen pendukung)</span>

                {/* Ref Link URL */}
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-450 block mb-0.5">Tautan / Link Referensi (Contoh Notion, Figma, Website luar)</label>
                  <div className="space-y-1.5">
                    <input
                      type="url"
                      placeholder="https://example.com/ref-plan"
                      value={formData.referenceLink}
                      onChange={(e) => setFormData({ ...formData, referenceLink: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-[11px] outline-none transition-all placeholder:text-slate-400"
                    />
                    {formData.referenceLink && (formData.referenceLink.startsWith('http://') || formData.referenceLink.startsWith('https://')) && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                        <LinkIcon className="w-3.5 h-3.5 text-brand-purple shrink-0" />
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                          <a 
                            href={formData.referenceLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-brand-purple hover:text-brand-purple/80 font-mono truncate hover:underline"
                          >
                            {formData.referenceLink}
                          </a>
                          <span className="text-[7.5px] uppercase font-black text-slate-500 tracking-widest bg-white border border-slate-250 px-1.5 py-0.5 rounded-md shrink-0">
                            Buka Link
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Section Grid */}
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Upload Image Area */}
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-450 block mb-0.5">Upload Gambar Acuan</label>
                    <div className="relative border border-dashed border-slate-200 rounded-xl p-2 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center text-center cursor-pointer min-h-[50px] transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setImageFile(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-[8px] text-slate-500 mt-1 font-semibold truncate max-w-full">
                        {imageFile ? imageFile.name : formData.referenceImage ? 'Sudah ada gambar' : 'Seret/Pilih Foto'}
                      </span>
                    </div>
                  </div>

                  {/* Upload Doc Area */}
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-450 block mb-0.5">Upload File Pendukung (PDF/Doc/Zip)</label>
                    <div className="relative border border-dashed border-slate-200 rounded-xl p-2 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center text-center cursor-pointer min-h-[50px] transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.zip,.rar,.xls,.xlsx,.json,.txt"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setDocFile(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-[8px] text-slate-500 mt-1 font-semibold truncate max-w-full">
                        {docFile ? docFile.name : formData.fileName ? formData.fileName : 'Pilih File'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-brand-purple/10 cursor-pointer disabled:opacity-55"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Plan'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-slate-200 shadow-2xl relative text-center"
          >
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-rose-500" />
            </div>

            <h3 className="text-base font-serif font-black text-slate-900 mb-2">
              Hapus Tugas Pengembangan?
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus data pengembangan <strong className="text-slate-800">"{taskToDelete.title}"</strong>? Tindakan ini akan menyinkronkan perubahan ke Google Sheets.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = tasks.filter(t => t.id !== taskToDelete.id);
                  setTasks(updated);
                  localStorage.setItem('mornings_dev_tasks', JSON.stringify(updated));
                  addActivityLog(`Menghapus log task: "${taskToDelete.title}"`);
                  syncToSheets(updated);
                  setTaskToDelete(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md shadow-rose-600/10 cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Child Components
interface TaskCardProps {
  key?: string;
  task: DevTask;
  onEdit: (task: DevTask) => void;
  onDelete: (id: string, title: string) => void;
  onToggle: (task: DevTask) => void;
  onPin: (task: DevTask) => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  renderPriority: (p: DevTask['priority']) => React.ReactNode;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onTouchStart: (e: React.TouchEvent, id: string) => void;
  onTouchEnd: (e: React.TouchEvent, task: DevTask) => void;
  isDragging: boolean;
}

function TaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  onToggle, 
  onPin,
  onMoveLeft,
  onMoveRight,
  renderPriority,
  onDragStart,
  onDragEnd,
  onTouchStart,
  onTouchEnd,
  isDragging
}: TaskCardProps) {
  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onTouchStart={(e) => onTouchStart(e, task.id)}
      onTouchEnd={(e) => onTouchEnd(e, task)}
      className={cn(
        "p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all relative group flex flex-col justify-between min-h-[170px] cursor-grab active:cursor-grabbing select-none",
        task.isPinned && "border-brand-purple/20 bg-brand-purple/[0.01]",
        task.status === 'Done' && "bg-slate-50/[0.4] border-slate-150",
        isDragging && "opacity-40 border-dashed border-brand-purple bg-brand-purple/[0.01]"
      )}
    >
      {/* Upper row: pin and categorisation tags */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-slate-150">{task.category}</span>
            {renderPriority(task.priority)}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPin(task)}
              className={cn("p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer", task.isPinned ? "text-amber-500" : "text-slate-350 opacity-0 group-hover:opacity-100")}
              title="Pin tugas penting"
            >
              <Pin className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>

        {/* Content detail */}
        <div className="flex items-start gap-2.5">
          <button
            onClick={() => onToggle(task)}
            className="mt-0.5 shrink-0 hover:text-brand-purple text-slate-300 transition-colors cursor-pointer"
          >
            {task.status === 'Done' ? (
              <CheckSquare className="w-4.5 h-4.5 text-brand-purple" />
            ) : (
              <Square className="w-4.5 h-4.5" />
            )}
          </button>
          
          <div className="min-w-0 flex-1">
            <h4 className={cn(
              "text-xs sm:text-[13px] font-serif font-black text-slate-900 leading-tight tracking-tight cursor-pointer hover:text-brand-purple transition-all",
              task.status === 'Done' && "line-through text-slate-400"
            )}
              onClick={() => onEdit(task)}
            >
              {task.title}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed whitespace-pre-wrap">{task.description}</p>
          </div>
        </div>
      </div>

      {/* Attachments & Bottom Actions */}
      <div className="mt-4 pt-3.5 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Deadline */}
          <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-350" /> {task.deadline}
          </span>

          {/* Reference Indicator icons */}
          <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
            {task.referenceLink && (
              <a 
                href={task.referenceLink} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 hover:bg-slate-100 rounded text-brand-purple/70 hover:text-brand-purple transition-all"
                title="Buka Link Ref Acuan"
              >
                <LinkIcon className="w-3 h-3" />
              </a>
            )}
            {task.referenceImage && (
              <a 
                href={task.referenceImage} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 hover:bg-slate-100 rounded text-brand-purple/70 hover:text-brand-purple transition-all"
                title="Buka Contoh Gambar"
              >
                <ImageIcon className="w-3 h-3" />
              </a>
            )}
            {task.referenceFile && (
              <a 
                href={task.referenceFile} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 hover:bg-slate-100 rounded text-brand-purple/70 hover:text-brand-purple transition-all"
                title={`Buka file: ${task.fileName || 'file'}`}
              >
                <FileText className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Row navigation buttons & Edit tools */}
        <div className="flex items-center gap-1">
          {onMoveLeft && (
            <button 
              onClick={onMoveLeft}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-brand-purple transition-all"
              title="Kembalikan Status"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onEdit(task)}
            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-brand-purple transition-all"
            title="Edit Detail"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(task.id, task.title)}
            className="p-1 hover:bg-rose-50 rounded text-slate-300 hover:text-rose-500 transition-all"
            title="Hapus"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {onMoveRight && (
            <button 
              onClick={onMoveRight}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-brand-purple transition-all"
              title="Geser Kerja Lanjut"
            >
              <ChevronRight className="w-3.5 h-3.5 animate-pulse" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
