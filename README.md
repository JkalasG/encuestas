# Vilaseca - CaliTori
> **Calidad y Toma de Resultados e Indicadores**

React (Vite) + NestJS + SQLite (una sola tabla: `registros`).

## Arrancar

```bash
# Terminal 1 - API (http://localhost:3000/api)
cd backend
npm run build && npm run start:prod      # o: npm run start:dev

# Terminal 2 - Web (http://localhost:5173)
cd frontend
npm run dev
```

La base se crea sola en `backend/data/encuestas.sqlite`.
Configuración en `backend/.env` (ver `.env.example`): `JWT_SECRET`, `GOOGLE_CLIENT_ID` (opcional), `REGISTRO_ABIERTO`.

## Uso

1. Crea una cuenta (o entra con Google si configuraste `GOOGLE_CLIENT_ID`).
2. **Encuestas → Nueva encuesta**: elige tipos de pregunta, datos del cliente, enlace, fecha límite, máximo de respuestas.
3. Copia el enlace `/s/<tu-enlace>` y pásalo a tus clientes.
4. **Respuestas**: gráficos por pregunta, tabla de respuestas y exportación a Excel.

## Tipos de pregunta

| Tipo | Valor guardado |
|---|---|
| Escala 1-10 | 1…10 |
| Caritas (5) | 2, 4, 6, 8, 10 |
| Estrellas (5) | 2, 4, 6, 8, 10 |
| Matriz de satisfacción | por fila: 2, 4, 6, 8, 10 |
| Opción única / múltiple / texto | texto |

## Tabla `registros`

Una fila por registro, distinguida por `tipo`: `usuario`, `encuesta` (configuración en `datos`, enlace en `llave`) o `respuesta` (`padreId` = encuesta, respuestas en `datos`).

## Google Login

Crea un ID de cliente OAuth (Web) en Google Cloud, agrega `http://localhost:5173` como origen autorizado y pon el ID en `GOOGLE_CLIENT_ID`.
