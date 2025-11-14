'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function LoginPage() {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Limpiar localStorage corrupto al cargar
  useState(() => {
    const userData = localStorage.getItem('user');
    if (userData === 'undefined' || userData === 'null') {
      localStorage.clear();
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/login`,
        { rut, password }
      );

      if (response.data.success && response.data.token && response.data.student) {
        // Guardar token y usuario
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.student));
        
        // Redirigir al dashboard
        router.push('/dashboard');
      } else {
        setError('Respuesta inválida del servidor');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Error al iniciar sesión. Por favor, verifica que el backend esté funcionando.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo USS */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 text-white text-4xl font-bold rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            USS
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Student Hub</h1>
          <p className="text-gray-600 mt-2">Universidad San Sebastián</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-2">
              RUT
            </label>
            <input
              id="rut"
              type="text"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              placeholder="12345678-9"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-800"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-800"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Credenciales de prueba */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold text-gray-600 mb-2">Credenciales de prueba:</p>
          <div className="text-xs text-gray-600 space-y-1">
            <p>RUT: <span className="font-mono bg-white px-2 py-1 rounded">12345678-9</span></p>
            <p>Password: <span className="font-mono bg-white px-2 py-1 rounded">password123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
