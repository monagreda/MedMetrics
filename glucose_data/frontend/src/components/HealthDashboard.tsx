// HealthDashboard.tsx
// VERSIÓN DEFINITIVA - Combina hooks profesionales + visualizaciones completas
import React, { useState } from 'react';
import { 
  Droplet, 
  Heart, 
  Activity, 
  AlertTriangle, 
  Users, 
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Clock,
  Filter,
  Download
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { 
  useGlucoseData,
  useAlertFilters,
  usePatientStats,
  usePatientList,
  useContextStats,
  useGlucoseTrend,
  useExportCSV,
  useLocalStorage
} from '../hooks/useGlucoseData';
import type { 
  MealContext, 
  PatientId, 
  ChartDataPoint,
  AlertaHiperglucemia 
} from './types';

// import type { TooltipProps } from 'recharts';

/**
 * Health Dashboard - Versión Definitiva
 * Combina arquitectura con hooks + visualizaciones completas
 */
const HealthDashboard: React.FC = () => {
  // ============================================================================
  // CUSTOM HOOKS - GESTIÓN DE DATOS
  // ============================================================================
  
  const { data, loading, error } = useGlucoseData();
  
  // Filtros con persistencia en localStorage
  const [selectedPatient, setSelectedPatient] = useLocalStorage<PatientId | null>('filter_patient', null);
  const [selectedContext, setSelectedContext] = useLocalStorage<MealContext | null>('filter_context', null);

  // Procesamiento de datos con hooks
  const alerts = data?.alertas_hiperglucemia || [];
  const filteredAlerts = useAlertFilters(alerts, {
    patient: selectedPatient,
    context: selectedContext,
  });
  
  const patientStats = usePatientStats(alerts);
  const patients = usePatientList(alerts);
  const contextStats = useContextStats(alerts);
  const trend = useGlucoseTrend(alerts);
  const exportCSV = useExportCSV(filteredAlerts);

  // Estado local para sorting de tabla
  const [sortField, setSortField] = useState<keyof AlertaHiperglucemia>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ============================================================================
  // PREPARACIÓN DE DATOS PARA GRÁFICOS
  // ============================================================================

  // Datos para gráfico de barras (Recharts)
  const chartData: ChartDataPoint[] = React.useMemo(() => {
    if (!data) return [];
    
    return Object.entries(data.promedios_por_comida).map(([context, value]) => ({
      name: translateContext(context as MealContext),
      value: Math.round(value * 10) / 10,
      context: context as MealContext
    }));
  }, [data]);

  // Alertas ordenadas para tabla
  const sortedAlerts = React.useMemo(() => {
    return [...filteredAlerts].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredAlerts, sortField, sortOrder]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSort = (field: keyof AlertaHiperglucemia) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setSelectedPatient(null);
    setSelectedContext(null);
  };

  // ============================================================================
  // ESTADOS DE CARGA Y ERROR
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 text-indigo-600 animate-pulse mx-auto mb-4" />
          <p className="text-xl text-gray-700 font-medium">Cargando análisis médico...</p>
          <p className="text-sm text-gray-500 mt-2">Procesando datos de glucosa</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Error al cargar datos</h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* ========== HEADER ========== */}
      <header className="bg-white shadow-md border-b-4 border-indigo-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-xl shadow-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Dashboard Médico de Glucosa
                </h1>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  <p className="text-gray-600 flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    {new Date(data.metadata.fecha_generacion).toLocaleString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(trend)}
                    <span className="text-sm font-medium text-gray-700">
                      {getTrendText(trend)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={exportCSV}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Download className="w-5 h-5" />
              Exportar CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ========== STATS GRID ========== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de Alertas"
            value={data.metadata.total_alertas}
            icon={<AlertTriangle className="w-6 h-6" />}
            subtitle={`${filteredAlerts.length} visibles`}
            alert={data.metadata.total_alertas > 100}
          />
          
          <StatCard
            title="Glucosa Máxima"
            value={`${data.estadisticas.glucosa_maxima.toFixed(1)} mg/dL`}
            icon={<TrendingUp className="w-6 h-6" />}
            subtitle="Nivel más alto detectado"
            alert={data.estadisticas.glucosa_maxima > 180}
          />
          
          <StatCard
            title="Pacientes Monitoreados"
            value={patients.length}
            icon={<Users className="w-6 h-6" />}
            subtitle={`${data.estadisticas.pacientes_afectados} con alertas`}
          />
          
          <StatCard
            title="Umbral Clínico"
            value={`${data.metadata.umbral_hiperglucemia} mg/dL`}
            icon={<Droplet className="w-6 h-6" />}
            subtitle="Límite de hiperglucemia"
          />
        </div>

        {/* ========== PATIENT STATS CARDS ========== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {patients.map(patientId => {
            const stats = patientStats[patientId];
            return (
              <div 
                key={patientId}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-indigo-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{patientId}</h3>
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {stats.totalAlerts} alertas
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Promedio:</span>
                    <span className="font-bold text-gray-900">{stats.avgGlucose.toFixed(1)} mg/dL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Máximo:</span>
                    <span className="font-bold text-red-600">{stats.maxGlucose.toFixed(1)} mg/dL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Mínimo:</span>
                    <span className="font-bold text-green-600">{stats.minGlucose.toFixed(1)} mg/dL</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========== RECHARTS BAR CHART ========== */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-600" />
              Promedio de Glucosa por Contexto de Comida
            </h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-gray-600">Normal (&lt;{data.metadata.umbral_hiperglucemia})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-gray-600">Alto (≥{data.metadata.umbral_hiperglucemia})</span>
              </div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                tick={{ fill: '#374151', fontSize: '14px', fontWeight: 500  }}
              />
              <YAxis 
                label={{ 
                  value: 'Glucosa (mg/dL)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fontSize: '14px', fontWeight: 600, fill: '#374151' }
                }}
                stroke="#6b7280"
                tick={{ fill: '#374151' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
              y={data.metadata.umbral_hiperglucemia}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              // Pasamos solo el string. Recharts usará el estilo por defecto del stroke.
              label={`Umbral: ${data.metadata.umbral_hiperglucemia} mg/dL`}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.value, data.metadata.umbral_hiperglucemia)} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ========== CONTEXT DISTRIBUTION ========== */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Distribución de Alertas por Contexto
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(contextStats).map(([context, count]) => {
              const percentage = ((count / alerts.length) * 100).toFixed(1);
              return (
                <div 
                  key={context} 
                  className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border-2 border-indigo-100 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{getContextIcon(context as MealContext)}</span>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                      {percentage}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{translateContext(context as MealContext)}</p>
                  <p className="text-4xl font-bold text-indigo-600 mb-1">{count}</p>
                  <p className="text-xs text-gray-500">alertas detectadas</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========== FILTERS ========== */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-indigo-600" />
            <h3 className="text-xl font-bold text-gray-900">Filtros de Alertas</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paciente
              </label>
              <select
                value={selectedPatient || ''}
                onChange={(e) => setSelectedPatient(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              >
                <option value="">Todos los pacientes</option>
                {patients.map(patient => (
                  <option key={patient} value={patient}>{patient}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contexto de Comida
              </label>
              <select
                value={selectedContext || ''}
                onChange={(e) => setSelectedContext((e.target.value as MealContext) || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              >
                <option value="">Todos los contextos</option>
                <option value="Fasting">🌅 Ayuno (Fasting)</option>
                <option value="Post-prandial">🍽️ Post-prandial</option>
                <option value="Before sleep">🌙 Antes de dormir</option>
              </select>
            </div>
          </div>
          
          {(selectedPatient || selectedContext) && (
            <button
              onClick={clearFilters}
              className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium text-sm hover:underline"
            >
              ✕ Limpiar todos los filtros
            </button>
          )}
        </div>

        {/* ========== ALERTS TABLE ========== */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                Tabla de Alertas de Hiperglucemia
              </h2>
              <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                {sortedAlerts.length} alertas
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('timestamp')}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Fecha/Hora {sortField === 'timestamp' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('patient_id')}
                  >
                    Paciente {sortField === 'patient_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('glucose_level')}
                  >
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4" />
                      Glucosa {sortField === 'glucose_level' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Contexto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Severidad
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAlerts.map((alert, index) => (
                  <tr 
                    key={index} 
                    className={`hover:bg-indigo-50 transition-colors ${
                      alert.severidad === 'Alta' ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(alert.timestamp).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        {alert.patient_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className="text-xl font-bold text-red-600">
                          {alert.glucose_level.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">mg/dL</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        +{(alert.glucose_level - data.metadata.umbral_hiperglucemia).toFixed(1)} sobre umbral
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>{getContextIcon(alert.meal_context)}</span>
                        <span>{translateContext(alert.meal_context)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        alert.severidad === 'Alta' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.severidad}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sortedAlerts.length === 0 && (
              <div className="text-center py-16 bg-green-50">
                <Heart className="w-20 h-20 text-green-500 mx-auto mb-4 animate-pulse" />
                <p className="text-2xl font-bold text-gray-900 mb-2">¡Sin alertas!</p>
                <p className="text-gray-600">No hay alertas de hiperglucemia con los filtros seleccionados</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  alert?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  subtitle, 
  alert = false 
}) => {
  const bgColor = alert ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200';
  const iconColor = alert ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600';
  
  return (
    <div className={`${bgColor} border-2 rounded-xl p-6 shadow-md hover:shadow-xl transition-all hover:-translate-y-1`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {subtitle && (
            <p className="text-gray-500 text-sm">{subtitle}</p>
          )}
        </div>
        <div className={`${iconColor} p-3 rounded-lg shadow-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Tooltip personalizado para Recharts
const CustomTooltip = ({active, payload}:any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartDataPoint;
    return (
      <div className="bg-white border-2 border-indigo-600 rounded-lg shadow-xl p-4">
        <p className="font-bold text-gray-900 text-lg mb-1">{data.name}</p>
        <p className="text-indigo-600 font-bold text-2xl mb-1">{data.value} mg/dL</p>
        <p className="text-xs text-gray-500">Promedio de glucosa</p>
      </div>
    );
  }
  return null;
};

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function translateContext(context: MealContext): string {
  const translations: Record<MealContext, string> = {
    'Fasting': 'Ayuno',
    'Post-prandial': 'Post-prandial',
    'Before sleep': 'Antes de dormir'
  };
  return translations[context] || context;
}

function getContextIcon(context: MealContext): string {
  const icons: Record<MealContext, string> = {
    'Fasting': '🌅',
    'Post-prandial': '🍽️',
    'Before sleep': '🌙'
  };
  return icons[context] || '📊';
}

function getBarColor(value: number, umbral: number): string {
  return value > umbral ? '#ef4444' : '#22c55e';
}

function getTrendIcon(trend: 'increasing' | 'decreasing' | 'stable') {
  switch (trend) {
    case 'increasing':
      return <TrendingUp className="w-5 h-5 text-red-500" />;
    case 'decreasing':
      return <TrendingDown className="w-5 h-5 text-green-500" />;
    default:
      return <Minus className="w-5 h-5 text-gray-500" />;
  }
}

function getTrendText(trend: 'increasing' | 'decreasing' | 'stable'): string {
  switch (trend) {
    case 'increasing':
      return 'Tendencia al alza ⚠️';
    case 'decreasing':
      return 'Tendencia a la baja ✅';
    default:
      return 'Tendencia estable';
  }
}


export default HealthDashboard;