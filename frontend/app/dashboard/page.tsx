'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Notification {
  notificationId: string;
  timestamp: number;
  type: string;
  title: string;
  message: string;
  isRead: string;
  metadata?: any;
}

interface User {
  rut: string;
  name: string;
  email: string;
  career: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'grades'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [markingRead, setMarkingRead] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    
    setDarkMode(savedDarkMode);

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    loadNotifications(JSON.parse(userData).rut);
  }, [router]);

  const loadNotifications = async (studentId: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications?studentId=${studentId}`
      );
      
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notification: Notification) => {
    if (notification.isRead === 'true' || !user) return;
    
    setMarkingRead(notification.notificationId);
    
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/read`,
        {
          studentId: user.rut,
          timestamp: notification.timestamp
        }
      );
      
      // Actualizar localmente
      setNotifications(prev => 
        prev.map(n => 
          n.notificationId === notification.notificationId 
            ? { ...n, isRead: 'true' }
            : n
        )
      );
      
    } catch (error) {
      console.error('Error marking as read:', error);
    } finally {
      setMarkingRead(null);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    const unreadNotifications = notifications.filter(n => n.isRead === 'false');
    
    for (const notification of unreadNotifications) {
      try {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/notifications/read`,
          {
            studentId: user.rut,
            timestamp: notification.timestamp
          }
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    // Recargar todas
    await loadNotifications(user.rut);
  };

  const playNotificationSound = () => {
    if (soundEnabled && typeof window !== 'undefined') {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMnBSd+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzxnYpBSp5yvHciTsJFmO56+mjUhELTKTk8LhlHQU2jdXzxnYpBSp5yvHciTsJFmO56+mjUhELTKTk8LhlHQU2jdXzxnYpBSp5yvHciTsJFmO56+mjUhELTKTk8LhlHQU2jdXzxnYpBSp5yvHciTsJFmO56+mjUhELTKTk8LhlHQU2jdXzxnYpBSp5yvHciTsJFmO56+mjUhELTKTk8LhlHQU2jdXzxnYpBSp5yvHciTsJFmO56+mjUhELTKTk8LhlHQU2jdXzxnYpBSp5yvHciTsJFmO56+mjUhELTKTk8LhlHQU2jdXzxnYpBSp5yvHciTsJFmO56+mjUhELTKTk8LhlHQU2jdXzxnYpBSp5yvHciTsJFmO56+mjUhELTKTk8LhlHQU2jdXzxnYpBSp5yvHciTsJFmO56+mjUhELTKTk8LhlHQU2jdXzxnYpBSp5yvHciTsJFmO56+mjUhELTKTk8LhlHQU2jdXzxnYpBSp5yvHciTsJFmO56+mjUhELTKTk8LhlHQU2jdXzxnYpBSp5yvHciTsJFmO56+mjUhELTKTk8LhlHQ==');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
  };

  const simulateGradePublication = async () => {
    if (!user) return;
    
    setPublishing(true);
    
    const courses = [
      { code: 'MAT301', name: 'Cálculo III', grade: (Math.random() * 3 + 4).toFixed(1) },
      { code: 'FIS201', name: 'Física II', grade: (Math.random() * 3 + 4).toFixed(1) },
      { code: 'PRG301', name: 'Algoritmos Avanzados', grade: (Math.random() * 3 + 4).toFixed(1) },
      { code: 'BD201', name: 'Base de Datos', grade: (Math.random() * 3 + 4).toFixed(1) },
      { code: 'WEB301', name: 'Desarrollo Web', grade: (Math.random() * 3 + 4).toFixed(1) },
      { code: 'IA301', name: 'Inteligencia Artificial', grade: (Math.random() * 3 + 4).toFixed(1) },
      { code: 'SEG201', name: 'Seguridad Informática', grade: (Math.random() * 3 + 4).toFixed(1) }
    ];
    
    const randomCourse = courses[Math.floor(Math.random() * courses.length)];
    
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications`,
        {
          studentId: user.rut,
          type: 'GRADE',
          title: '📊 Nueva nota publicada desde Banner',
          message: `Se ha publicado la nota de ${randomCourse.name}: ${randomCourse.grade}`,
          metadata: {
            courseCode: randomCourse.code,
            courseName: randomCourse.name,
            grade: parseFloat(randomCourse.grade),
            source: 'Banner Oracle PL/SQL'
          }
        }
      );
      
      playNotificationSound();
      await loadNotifications(user.rut);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error creating notification:', error);
    } finally {
      setPublishing(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'GRADE': return '📊';
      case 'DOCUMENT': return '📄';
      case 'INFO': return 'ℹ️';
      default: return '🔔';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Estadísticas
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => n.isRead === 'false').length,
    grades: notifications.filter(n => n.type === 'GRADE').length,
    avgGrade: notifications
      .filter(n => n.metadata?.grade)
      .reduce((acc, n) => acc + (n.metadata?.grade || 0), 0) / 
      notifications.filter(n => n.metadata?.grade).length || 0
  };

  // Filtrado
  const filteredNotifications = notifications
    .filter(n => {
      if (filter === 'unread') return n.isRead === 'false';
      if (filter === 'grades') return n.type === 'GRADE';
      return true;
    })
    .filter(n => 
      searchTerm === '' || 
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Cargando...</p>
        </div>
      </div>
    );
  }

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-bounce">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold">¡Nota publicada!</p>
              <p className="text-sm">Simulación desde Banner Oracle</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col space-y-4 z-40">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className={`p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 ${
            darkMode ? 'bg-yellow-400 hover:bg-yellow-500' : 'bg-gray-800 hover:bg-gray-900'
          }`}
          title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}
        >
          <span className="text-2xl">{darkMode ? '☀️' : '🌙'}</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 ${
            soundEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          } text-white`}
          title={soundEnabled ? 'Silenciar' : 'Activar Sonido'}
        >
          <span className="text-2xl">{soundEnabled ? '🔊' : '🔇'}</span>
        </button>

        {/* Simulate Banner */}
        <button
          onClick={simulateGradePublication}
          disabled={publishing}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed group"
          title="Simular publicación desde Banner"
        >
          {publishing ? (
            <div className="animate-spin text-2xl">⏳</div>
          ) : (
            <div className="relative">
              <span className="text-2xl">🎯</span>
            </div>
          )}
        </button>
      </div>

      {/* Header */}
      <header className={`${cardBg} shadow-sm transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white text-2xl font-bold rounded-full w-12 h-12 flex items-center justify-center">
                USS
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${textPrimary}`}>Student Hub</h1>
                <p className={`text-sm ${textSecondary}`}>Universidad San Sebastián</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`px-4 py-2 text-sm font-medium ${textSecondary} hover:${textPrimary} ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg transition`}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`${cardBg} rounded-xl shadow-sm p-6 ${borderColor} border transition-colors duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${textSecondary}`}>Total</p>
                <p className={`text-3xl font-bold ${textPrimary}`}>{stats.total}</p>
              </div>
              <span className="text-4xl">📬</span>
            </div>
          </div>

          <div className={`${cardBg} rounded-xl shadow-sm p-6 ${borderColor} border transition-colors duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${textSecondary}`}>No Leídas</p>
                <p className={`text-3xl font-bold text-blue-600`}>{stats.unread}</p>
              </div>
              <span className="text-4xl">🔔</span>
            </div>
          </div>

          <div className={`${cardBg} rounded-xl shadow-sm p-6 ${borderColor} border transition-colors duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${textSecondary}`}>Notas</p>
                <p className={`text-3xl font-bold text-purple-600`}>{stats.grades}</p>
              </div>
              <span className="text-4xl">📊</span>
            </div>
          </div>

          <div className={`${cardBg} rounded-xl shadow-sm p-6 ${borderColor} border transition-colors duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${textSecondary}`}>Promedio</p>
                <p className={`text-3xl font-bold text-green-600`}>
                  {stats.avgGrade > 0 ? stats.avgGrade.toFixed(1) : '--'}
                </p>
              </div>
              <span className="text-4xl">🎯</span>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className={`${cardBg} rounded-xl shadow-sm p-6 mb-8 ${borderColor} border transition-colors duration-300`}>
          <h2 className={`text-xl font-semibold ${textPrimary} mb-4`}>Bienvenido</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className={`text-sm ${textSecondary}`}>Nombre</p>
              <p className={`font-medium ${textPrimary}`}>{user?.name}</p>
            </div>
            <div>
              <p className={`text-sm ${textSecondary}`}>RUT</p>
              <p className={`font-medium ${textPrimary}`}>{user?.rut}</p>
            </div>
            <div>
              <p className={`text-sm ${textSecondary}`}>Carrera</p>
              <p className={`font-medium ${textPrimary}`}>{user?.career}</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className={`${cardBg} rounded-xl shadow-sm p-6 mb-8 ${borderColor} border transition-colors duration-300`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                🔍 Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar en notificaciones..."
                className={`w-full px-4 py-2 border ${borderColor} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                📊 Filtrar
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-4 py-2 rounded-lg transition ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`flex-1 px-4 py-2 rounded-lg transition ${
                    filter === 'unread'
                      ? 'bg-blue-600 text-white'
                      : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  No leídas
                </button>
                <button
                  onClick={() => setFilter('grades')}
                  className={`flex-1 px-4 py-2 rounded-lg transition ${
                    filter === 'grades'
                      ? 'bg-blue-600 text-white'
                      : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Notas
                </button>
              </div>
            </div>
          </div>
          
          {/* Mark All as Read Button */}
          {stats.unread > 0 && (
            <button
              onClick={markAllAsRead}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
            >
              ✓ Marcar todas como leídas ({stats.unread})
            </button>
          )}
        </div>

        {/* Notifications */}
        <div className={`${cardBg} rounded-xl shadow-sm p-6 ${borderColor} border transition-colors duration-300`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-semibold ${textPrimary}`}>
              Notificaciones ({filteredNotifications.length})
            </h2>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className={textSecondary}>
                {searchTerm || filter !== 'all' ? 'No se encontraron notificaciones' : 'No tienes notificaciones'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification, index) => (
                <div
                  key={notification.notificationId}
                  className={`border rounded-lg p-4 transition-all duration-500 hover:shadow-md ${
                    notification.isRead === 'false'
                      ? darkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'
                      : `${cardBg} ${borderColor}`
                  } ${index === 0 ? 'ring-2 ring-blue-300' : ''}`}
                  style={{
                    animation: index === 0 ? 'slideIn 0.5s ease-out' : 'none'
                  }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-lg font-semibold ${textPrimary}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {notification.isRead === 'false' && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                              Nueva
                            </span>
                          )}
                          {notification.isRead === 'false' && (
                            <button
                              onClick={() => markAsRead(notification)}
                              disabled={markingRead === notification.notificationId}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-full transition disabled:opacity-50"
                            >
                              {markingRead === notification.notificationId ? '...' : '✓ Marcar leída'}
                            </button>
                          )}
                        </div>
                      </div>
                      <p className={textSecondary}>{notification.message}</p>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <div className="flex items-center space-x-2">
                          <span className={textSecondary}>{formatDate(notification.timestamp)}</span>
                          {notification.metadata?.source && (
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                              {notification.metadata.source}
                            </span>
                          )}
                        </div>
                        {notification.metadata?.grade && (
                          <span className="font-semibold text-blue-600 text-lg">
                            Nota: {notification.metadata.grade}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
