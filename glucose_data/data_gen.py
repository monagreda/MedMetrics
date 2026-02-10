import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Configuración
np.random.seed(42)
n_records = 1000
start_date = datetime(2026, 1, 1)

# Generar datos ficticios
data = {
    'timestamp': [start_date + timedelta(minutes=30*i) for i in range(n_records)],
    'patient_id': np.random.choice(['P001', 'P002', 'P003'], n_records),
    'glucose_level': np.random.normal(110, 25, n_records).round(2), # Promedio 110, desviación 25
    'meal_context': np.random.choice(['Fasting', 'Post-prandial', 'Before sleep'], n_records)
}

df = pd.DataFrame(data)

# Guardar a CSV
df.to_csv('glucose_data.csv', index=False)
print("¡Archivo glucose_data.csv generado con éxito!")