// hooks/useGlucoseData.ts
// Custom hooks para manejo de datos de glucosa

import { useState, useEffect, useMemo } from 'react';
import type { GlucoseData, AlertaHiperglucemia, MealContext, PatientId } from '../components/types';

/**
 * Hook para cargar y gestionar datos de glucosa desde el API
 * 
 * @param apiUrl - URL del endpoint del JSON
 * @returns Estado con datos, loading y error
 */
export function useGlucoseData(apiUrl: string = '/api/summary.json') {
  const [data, setData] = useState<GlucoseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const jsonData: GlucoseData = await response.json();
        setData(jsonData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiUrl]);

  return { data, loading, error };
}

/**
 * Hook para filtrar alertas de hiperglucemia
 * 
 * @param alerts - Array completo de alertas
 * @param filters - Objeto con filtros activos
 * @returns Array de alertas filtradas
 */
export function useAlertFilters(
  alerts: AlertaHiperglucemia[],
  filters: {
    patient?: PatientId | null;
    context?: MealContext | null;
    minGlucose?: number;
    maxGlucose?: number;
  }
) {
  return useMemo(() => {
    let filtered = [...alerts];

    if (filters.patient) {
      filtered = filtered.filter(alert => alert.patient_id === filters.patient);
    }

    if (filters.context) {
      filtered = filtered.filter(alert => alert.meal_context === filters.context);
    }

    if (filters.minGlucose !== undefined) {
      filtered = filtered.filter(alert => alert.glucose_level >= filters.minGlucose!);
    }

    if (filters.maxGlucose !== undefined) {
      filtered = filtered.filter(alert => alert.glucose_level <= filters.maxGlucose!);
    }

    return filtered;
  }, [alerts, filters]);
}

/**
 * Hook para obtener estadísticas de pacientes
 * 
 * @param alerts - Array de alertas
 * @returns Objeto con estadísticas por paciente
 */
export function usePatientStats(alerts: AlertaHiperglucemia[]) {
  return useMemo(() => {
    const stats = new Map<PatientId, {
      totalAlerts: number;
      avgGlucose: number;
      maxGlucose: number;
      minGlucose: number;
    }>();

    alerts.forEach(alert => {
      const existing = stats.get(alert.patient_id);
      
      if (!existing) {
        stats.set(alert.patient_id, {
          totalAlerts: 1,
          avgGlucose: alert.glucose_level,
          maxGlucose: alert.glucose_level,
          minGlucose: alert.glucose_level,
        });
      } else {
        existing.totalAlerts += 1;
        existing.avgGlucose = (existing.avgGlucose * (existing.totalAlerts - 1) + alert.glucose_level) / existing.totalAlerts;
        existing.maxGlucose = Math.max(existing.maxGlucose, alert.glucose_level);
        existing.minGlucose = Math.min(existing.minGlucose, alert.glucose_level);
      }
    });

    return Object.fromEntries(stats);
  }, [alerts]);
}

/**
 * Hook para obtener lista única de pacientes
 * 
 * @param alerts - Array de alertas
 * @returns Array ordenado de IDs de pacientes
 */
export function usePatientList(alerts: AlertaHiperglucemia[]): PatientId[] {
  return useMemo(() => {
    return Array.from(new Set(alerts.map(alert => alert.patient_id))).sort();
  }, [alerts]);
}

/**
 * Hook para estadísticas por contexto de comida
 * 
 * @param alerts - Array de alertas
 * @returns Objeto con conteo por contexto
 */
export function useContextStats(alerts: AlertaHiperglucemia[]) {
  return useMemo(() => {
    const stats: Record<MealContext, number> = {
      'Fasting': 0,
      'Post-prandial': 0,
      'Before sleep': 0,
    };

    alerts.forEach(alert => {
      stats[alert.meal_context] = (stats[alert.meal_context] || 0) + 1;
    });

    return stats;
  }, [alerts]);
}

/**
 * Hook para detectar tendencias temporales
 * 
 * @param alerts - Array de alertas ordenadas por tiempo
 * @returns Indicador de tendencia: 'increasing', 'decreasing', 'stable'
 */
export function useGlucoseTrend(alerts: AlertaHiperglucemia[]): 'increasing' | 'decreasing' | 'stable' {
  return useMemo(() => {
    if (alerts.length < 10) return 'stable';

    // Tomar primeros y últimos 20% de datos
    const sampleSize = Math.floor(alerts.length * 0.2);
    const firstSample = alerts.slice(0, sampleSize);
    const lastSample = alerts.slice(-sampleSize);

    const firstAvg = firstSample.reduce((sum, a) => sum + a.glucose_level, 0) / firstSample.length;
    const lastAvg = lastSample.reduce((sum, a) => sum + a.glucose_level, 0) / lastSample.length;

    const diff = lastAvg - firstAvg;
    const threshold = 5; // mg/dL

    if (diff > threshold) return 'increasing';
    if (diff < -threshold) return 'decreasing';
    return 'stable';
  }, [alerts]);
}

/**
 * Hook para exportar datos a CSV
 * 
 * @param alerts - Array de alertas a exportar
 * @returns Función para descargar CSV
 */
export function useExportCSV(alerts: AlertaHiperglucemia[]) {
  return () => {
    const headers = ['Fecha/Hora', 'Paciente', 'Glucosa (mg/dL)', 'Contexto', 'Severidad'];
    const rows = alerts.map(alert => [
      alert.timestamp,
      alert.patient_id,
      alert.glucose_level.toString(),
      alert.meal_context,
      alert.severidad,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `alertas_glucosa_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
}

/**
 * Hook para localStorage persistence
 * 
 * @param key - Clave para localStorage
 * @param initialValue - Valor inicial
 * @returns [valor, setter] similar a useState
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}