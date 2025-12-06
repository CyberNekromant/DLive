import React, { useState, useEffect } from 'react';
import { 
  HomeIcon, 
  PawIcon, 
  SettingsIcon, 
  PlusIcon, 
  PillIcon, 
  ScissorIcon, 
  EarIcon, 
  CheckIcon,
  TrashIcon,
  CameraIcon,
  MoonIcon,
  SunIcon,
  DownloadIcon
} from './components/Icons';
import { Pet, Task, TaskType } from './types';
import { StorageService } from './services/storageService';

// --- Helpers ---

// Compress image to avoid DB size bloat
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const elem = document.createElement('canvas');
        const width = 300; // Resize to 300px max width
        const scaleFactor = width / img.width;
        elem.width = width;
        elem.height = img.height * scaleFactor;
        const ctx = elem.getContext('2d');
        ctx?.drawImage(img, 0, 0, elem.width, elem.height);
        resolve(elem.toDataURL('image/jpeg', 0.7)); // Compress to 0.7 quality
      };
      img.onerror = (err) => reject(err);
    };
  });
};

const Header = ({ title }: { title: string }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 p-4 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2">
        <PawIcon className="text-brand-600 dark:text-brand-500 w-6 h-6" />
        <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">DLive</h1>
        {!isOnline && (
          <span className="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-200 text-[10px] px-2 py-0.5 rounded-full font-medium animate-pulse">
            Offline
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
    </header>
  );
};

const TaskIcon = ({ type, small }: { type: TaskType, small?: boolean }) => {
  const sizeClasses = small ? "w-8 h-8" : "w-10 h-10";
  const iconClasses = small ? "w-4 h-4" : "w-5 h-5";
  const baseClasses = `${sizeClasses} rounded-full flex items-center justify-center text-white shadow-sm shrink-0`;
  
  switch (type) {
    case TaskType.PILL:
      return <div className={`${baseClasses} bg-blue-500`}><PillIcon className={iconClasses} /></div>;
    case TaskType.NAILS:
      return <div className={`${baseClasses} bg-brand-500`}><ScissorIcon className={iconClasses} /></div>;
    case TaskType.EARS:
      return <div className={`${baseClasses} bg-teal-500`}><EarIcon className={iconClasses} /></div>;
    default:
      return <div className={`${baseClasses} bg-gray-500`}><PawIcon className={iconClasses} /></div>;
  }
};

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Сегодня';
  if (date.toDateString() === tomorrow.toDateString()) return 'Завтра';
  
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

// --- Views ---

// 1. Dashboard View
const DashboardView = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [filter, setFilter] = useState<'all' | 'today'>('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [fetchedTasks, fetchedPets] = await Promise.all([
      StorageService.getTasks(),
      StorageService.getPets()
    ]);
    
    setTasks(fetchedTasks.sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()));
    setPets(fetchedPets);
    setLoading(false);
  };

  const handleComplete = async (taskId: string) => {
    await StorageService.completeTask(taskId);
    loadData();
  };

  const getPetName = (id: string) => pets.find(p => p.id === id)?.name || 'Питомец';

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    const dueDate = new Date(task.nextDueDate);
    const today = new Date();
    // Compare dates ignoring time
    return dueDate <= today || dueDate.toDateString() === today.toDateString();
  });

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Загрузка...</div>;
  }

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1 transition-colors">
        <button 
          onClick={() => setFilter('today')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'today' ? 'bg-white dark:bg-gray-800 shadow text-brand-600 dark:text-brand-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          Сегодня
        </button>
        <button 
          onClick={() => setFilter('all')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'all' ? 'bg-white dark:bg-gray-800 shadow text-brand-600 dark:text-brand-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          Все задачи
        </button>
      </div>

      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500">
            <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors">
              <CheckIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p>На сегодня задач нет!</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 active:scale-95 transition-all">
              <TaskIcon type={task.type} />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{task.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{getPetName(task.petId)} • {formatDate(task.nextDueDate)}</p>
              </div>
              <button 
                onClick={() => handleComplete(task.id)}
                className="w-10 h-10 rounded-full border-2 border-brand-100 dark:border-brand-900 text-brand-500 flex items-center justify-center hover:bg-brand-50 dark:hover:bg-brand-900/30 active:bg-brand-100 transition-colors"
                aria-label="Выполнить"
              >
                <CheckIcon className="w-6 h-6" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 2. Pets View (Manage Pets & Tasks)
const PetsView = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddPet, setShowAddPet] = useState(false);
  const [showAddTask, setShowAddTask] = useState<string | null>(null); // Pet ID or null
  const [loading, setLoading] = useState(true);

  // Form States
  const [newPetName, setNewPetName] = useState('');
  const [newPetBreed, setNewPetBreed] = useState('');
  const [newPetImage, setNewPetImage] = useState<string | null>(null);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<TaskType>(TaskType.PILL);
  const [newTaskFreq, setNewTaskFreq] = useState(1);

  const loadData = async () => {
    const [fetchedPets, fetchedTasks] = await Promise.all([
      StorageService.getPets(),
      StorageService.getTasks()
    ]);
    setPets(fetchedPets);
    setTasks(fetchedTasks);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setNewPetImage(compressed);
      } catch (err) {
        console.error("Image upload failed", err);
        alert("Не удалось загрузить изображение");
      }
    }
  };

  const handleAddPet = async () => {
    if (!newPetName) return;
    const newPet: Pet = {
      id: Date.now().toString(),
      name: newPetName,
      breed: newPetBreed,
      imageUrl: newPetImage || `https://picsum.photos/200/200?random=${Date.now()}`
    };
    await StorageService.savePet(newPet);
    await loadData();
    setShowAddPet(false);
    setNewPetName('');
    setNewPetBreed('');
    setNewPetImage(null);
  };

  const handleAddTask = async () => {
    if (!newTaskTitle || !showAddTask) return;
    const newTask: Task = {
      id: Date.now().toString(),
      petId: showAddTask,
      title: newTaskTitle,
      type: newTaskType,
      frequencyDays: Number(newTaskFreq),
      lastDoneDate: null,
      nextDueDate: new Date().toISOString()
    };
    await StorageService.saveTask(newTask);
    await loadData();
    setShowAddTask(null);
    setNewTaskTitle('');
    setNewTaskFreq(1);
  };

  const handleDeletePet = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if(window.confirm('Удалить питомца и все его задачи?')) {
      await StorageService.deletePet(id);
      loadData();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if(window.confirm('Удалить эту задачу?')) {
        await StorageService.deleteTask(taskId);
        loadData();
    }
  };

  // Render Modals inside conditional checks for cleaner code
  if (showAddPet) {
    return (
      <div className="p-6 space-y-4 animate-fade-in">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Новый питомец</h2>
        
        <div className="flex justify-center my-4">
          <label className="relative cursor-pointer group">
             <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                {newPetImage ? (
                  <img src={newPetImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <CameraIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                )}
             </div>
             <div className="absolute bottom-0 right-0 bg-brand-500 text-white p-1.5 rounded-full shadow-sm">
               <PlusIcon className="w-4 h-4" />
             </div>
             <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>

        <input 
          className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-500 transition-colors"
          placeholder="Имя"
          value={newPetName}
          onChange={e => setNewPetName(e.target.value)}
        />
        <input 
          className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-500 transition-colors"
          placeholder="Порода (необязательно)"
          value={newPetBreed}
          onChange={e => setNewPetBreed(e.target.value)}
        />
        <div className="flex gap-3 pt-4">
          <button onClick={() => setShowAddPet(false)} className="flex-1 py-3 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Отмена</button>
          <button onClick={handleAddPet} className="flex-1 py-3 text-white bg-brand-500 hover:bg-brand-600 rounded-lg font-semibold transition-colors">Добавить</button>
        </div>
      </div>
    );
  }

  if (showAddTask) {
    return (
      <div className="p-6 space-y-4 animate-fade-in">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Новая задача</h2>
        <input 
          className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-500 transition-colors"
          placeholder="Название (напр. Глистогонное)"
          value={newTaskTitle}
          onChange={e => setNewTaskTitle(e.target.value)}
        />
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Тип задачи</label>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {Object.values(TaskType).map(t => (
              <button 
                key={t}
                onClick={() => setNewTaskType(t)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-colors ${newTaskType === t ? 'bg-brand-50 dark:bg-brand-900/50 border-brand-500 text-brand-700 dark:text-brand-300' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
              >
                {t === 'pill' ? 'Таблетки' : t === 'nails' ? 'Когти' : t === 'ears' ? 'Уши' : 'Другое'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Повторять каждые (дней)</label>
          <input 
            type="number"
            className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-500 transition-colors"
            value={newTaskFreq}
            min={1}
            onChange={e => setNewTaskFreq(parseInt(e.target.value))}
          />
        </div>
        <div className="flex gap-3 pt-4">
          <button onClick={() => setShowAddTask(null)} className="flex-1 py-3 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Отмена</button>
          <button onClick={handleAddTask} className="flex-1 py-3 text-white bg-brand-500 hover:bg-brand-600 rounded-lg font-semibold transition-colors">Сохранить</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Загрузка данных...</div>;
  }

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Мои питомцы</h2>
        <button onClick={() => setShowAddPet(true)} className="text-brand-600 dark:text-brand-500 font-medium text-sm flex items-center gap-1 hover:text-brand-700 dark:hover:text-brand-400 transition-colors">
          <PlusIcon className="w-4 h-4" /> Добавить
        </button>
      </div>

      <div className="space-y-4">
        {pets.map(pet => {
          const petTasks = tasks.filter(t => t.petId === pet.id);
          
          return (
            <div key={pet.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
              <div className="p-4 flex items-center gap-4 bg-brand-50/50 dark:bg-gray-700/30">
                <img src={pet.imageUrl} alt={pet.name} className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm bg-white dark:bg-gray-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate">{pet.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{pet.breed}</p>
                </div>
                <button 
                  onClick={(e) => handleDeletePet(pet.id, e)} 
                  type="button"
                  className="relative z-10 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors shrink-0"
                  aria-label="Удалить питомца"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Tasks List within Pet Card */}
              {petTasks.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50">
                   {petTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 pl-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
                         <div className="flex items-center gap-3">
                            <TaskIcon type={task.type} small={true} />
                            <div>
                               <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">{task.title}</p>
                               <p className="text-xs text-gray-400">Каждые {task.frequencyDays} дн.</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => handleDeleteTask(task.id)}
                           className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                         >
                            <TrashIcon className="w-4 h-4" />
                         </button>
                      </div>
                   ))}
                </div>
              )}

              <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                 <button 
                   onClick={() => setShowAddTask(pet.id)}
                   className="w-full py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-center gap-2"
                 >
                   <PlusIcon className="w-4 h-4" /> Добавить расписание
                 </button>
              </div>
            </div>
          );
        })}
        {pets.length === 0 && (
           <div className="text-center py-8 text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
             <PawIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
             <p>Добавьте своего первого питомца!</p>
           </div>
        )}
      </div>
    </div>
  );
};

// 3. Settings View
const SettingsView = ({ 
  isDark, 
  toggleTheme,
  installPrompt,
  onInstall
}: { 
  isDark: boolean; 
  toggleTheme: () => void;
  installPrompt: any;
  onInstall: () => void;
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    setNotificationsEnabled(StorageService.getNotificationSettings());
  }, []);

  const handleClearData = async () => {
    if (window.confirm('Вы уверены? Все данные о питомцах и задачах будут удалены.')) {
      await StorageService.clearAllData();
      window.location.reload();
    }
  };

  const toggleNotifications = () => {
    const newState = !notificationsEnabled;
    
    if (newState) {
      if (!("Notification" in window)) {
        alert("Ваш браузер не поддерживает уведомления.");
        return;
      }
      
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          setNotificationsEnabled(true);
          StorageService.saveNotificationSettings(true);
          new Notification("DLive", { body: "Уведомления включены!" });
        } else {
          alert("Разрешение на уведомления отклонено.");
          setNotificationsEnabled(false);
          StorageService.saveNotificationSettings(false);
        }
      });
    } else {
      setNotificationsEnabled(false);
      StorageService.saveNotificationSettings(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
           <h3 className="font-semibold text-gray-800 dark:text-gray-100">Внешний вид</h3>
        </div>
        <div className="p-4 flex items-center justify-between cursor-pointer" onClick={toggleTheme}>
           <div className="flex items-center gap-3">
              {isDark ? <MoonIcon className="text-brand-500" /> : <SunIcon className="text-orange-400" />}
              <span className="text-gray-600 dark:text-gray-300">Темная тема</span>
           </div>
           <div className={`w-11 h-6 rounded-full relative transition-colors ${isDark ? 'bg-brand-500' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
           <h3 className="font-semibold text-gray-800 dark:text-gray-100">Уведомления</h3>
        </div>
        <div className="p-4 flex items-center justify-between cursor-pointer" onClick={toggleNotifications}>
           <span className="text-gray-600 dark:text-gray-300">Напоминания о задачах</span>
           <div className={`w-11 h-6 rounded-full relative transition-colors ${notificationsEnabled ? 'bg-brand-500' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
           </div>
        </div>
      </div>

      {installPrompt && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors animate-pulse-once">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
             <h3 className="font-semibold text-gray-800 dark:text-gray-100">Приложение</h3>
          </div>
          <button 
            onClick={onInstall}
            className="w-full p-4 text-left text-brand-600 dark:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors flex items-center gap-2 font-medium"
          >
             <DownloadIcon className="w-5 h-5" />
             Установить на главный экран
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
           <h3 className="font-semibold text-gray-800 dark:text-gray-100">Данные</h3>
        </div>
        <button 
          onClick={handleClearData}
          className="w-full p-4 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
        >
           <TrashIcon className="w-5 h-5" />
           Сбросить все данные
        </button>
      </div>

      <div className="text-center text-sm text-gray-400 dark:text-gray-600 mt-8">
        <p>DLive v2.1 (PWA)</p>
        <p>Сделано с любовью к питомцам</p>
      </div>
    </div>
  );
};

// --- Main App Component ---

type ViewState = 'dashboard' | 'pets' | 'settings';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = StorageService.getTheme();
    setTheme(savedTheme);
  }, []);

  // Apply Theme to Document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    StorageService.saveTheme(theme);
  }, [theme]);

  // Capture PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    // Show the install prompt
    installPrompt.prompt();
    // Wait for the user to respond to the prompt
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPrompt(null);
    });
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'pets': return <PetsView />;
      case 'settings': return <SettingsView isDark={theme === 'dark'} toggleTheme={toggleTheme} installPrompt={installPrompt} onInstall={handleInstallClick} />;
      default: return <DashboardView />;
    }
  };

  const getTitle = () => {
    switch(currentView) {
      case 'dashboard': return 'Главная';
      case 'pets': return 'Питомцы';
      case 'settings': return 'Настройки';
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-200">
      <Header title={getTitle()} />
      
      <main className="flex-1 overflow-y-auto no-scrollbar">
        {renderView()}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center h-20 pb-4 sticky bottom-0 w-full z-20 transition-colors">
        <button 
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center justify-center w-16 h-full space-y-1 ${currentView === 'dashboard' ? 'text-brand-600 dark:text-brand-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          <HomeIcon className={`w-6 h-6 transition-transform ${currentView === 'dashboard' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-medium">Главная</span>
        </button>
        
        <button 
          onClick={() => setCurrentView('pets')}
          className={`flex flex-col items-center justify-center w-16 h-full space-y-1 ${currentView === 'pets' ? 'text-brand-600 dark:text-brand-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          <PawIcon className={`w-6 h-6 transition-transform ${currentView === 'pets' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-medium">Питомцы</span>
        </button>
        
        <button 
          onClick={() => setCurrentView('settings')}
          className={`flex flex-col items-center justify-center w-16 h-full space-y-1 ${currentView === 'settings' ? 'text-brand-600 dark:text-brand-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          <SettingsIcon className={`w-6 h-6 transition-transform ${currentView === 'settings' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-medium">Настройки</span>
        </button>
      </nav>
    </div>
  );
};

export default App;