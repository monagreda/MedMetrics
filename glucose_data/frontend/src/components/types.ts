// types.ts
// Definiciones de tipos para el Dashboard Médico de Glucosa

/**
 * Tipo literal para los contextos de comida válidos
 */
export type MealContext = "Fasting" | "Post-prandial" | "Before sleep";

/**
 * Tipo literal para la severidad de las alertas
 */
export type Severity = "Moderada" | "Alta";

/**
 * ID de paciente en formato P001, P002, etc.
 */
export type PatientId = string;

/**
 * Metadata del análisis de glucosa
 */
export interface GlucoseMetadata {
  fecha_generacion: string; // ISO 8601 timestamp
  umbral_hiperglucemia: number; // Umbral en mg/dL
  total_alertas: number;
}

/**
 * Promedios de glucosa por contexto de comida
 * Clave: nombre del contexto (MealContext)
 * Valor: promedio de glucosa en mg/dL
 */
export interface PromediosPorComida {
  "Before sleep": number;
  "Fasting": number;
  "Post-prandial": number;
}

/**
 * Alerta individual de hiperglucemia
 */
export interface AlertaHiperglucemia {
  timestamp: string; // Formato: "2026-01-01 17:30:00"
  patient_id: PatientId;
  glucose_level: number; // mg/dL
  meal_context: MealContext;
  severidad: Severity;
}

/**
 * Estadísticas agregadas del análisis
 */
export interface Estadisticas {
  glucosa_maxima: number;
  pacientes_afectados: number;
}

/**
 * Estructura completa del JSON generado por el análisis
 */
export interface GlucoseData {
  metadata: GlucoseMetadata;
  promedios_por_comida: PromediosPorComida;
  alertas_hiperglucemia: AlertaHiperglucemia[];
  estadisticas: Estadisticas;
}

/**
 * Tipo para datos de gráficos de Recharts
 */
export interface ChartDataPoint {
  name: string; // Nombre legible del contexto
  value: number; // Valor de glucosa
  context: MealContext; // Contexto original para referencia
}

/**
 * Props para componentes de tarjetas de estadísticas
 */
export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  alert?: boolean;
}

/**
 * Props para el componente de tabla de alertas
 */
export interface AlertTableProps {
  alerts: AlertaHiperglucemia[];
  onPatientFilter?: (patientId: PatientId | null) => void;
}

/**
 * Estado del filtro de alertas
 */
export interface AlertFilter {
  patient: PatientId | null;
  severity: Severity | null;
  context: MealContext | null;
}