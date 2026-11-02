\# 📦 Inventario Fullstack



Sistema académico de gestión de productos con React, Express y MySQL, desarrollado en las prácticas de Fullstack de SENATI.



\## Estado actual



| Componente | Estado |

|---|---|

| Backend CRUD | Implementado |

| Registro y login JWT | Implementados |

| Permisos por rol | Implementados |

| Interfaz de productos | Implementada |

| Login y envío del JWT desde React | Pendientes para la guía 11 |

| Mejoras visuales | Pendientes para la guía 9 |



\*\*El frontend actual aún no envía el token JWT.\*\* Con el backend protegido, sus peticiones de productos reciben 401. El CRUD autenticado se puede probar desde Postman.



\## Tecnologías



| Capa | Tecnologías |

|---|---|

| Frontend | React, Vite, Bootstrap y Axios |

| Backend | Node.js y Express |

| Base de datos | MySQL, Sequelize y mysql2 |

| Autenticación | bcryptjs y jsonwebtoken |

| Protección | Helmet, CORS y express-rate-limit |



\## Organización



| Carpeta | Contenido |

|---|---|

| backend/config | Conexión a MySQL |

| backend/models | Producto y Usuario |

| backend/controllers | Registro e inicio de sesión |

| backend/middleware | Autenticación y permisos |

| backend/routes | Rutas de autenticación |

| backend/scripts | Configuración y promoción de usuarios |

| frontend/src/components | Interfaz de productos |

| frontend/src/services | Cliente Axios |



\## Instalación



Requisitos: Git, Node.js/npm compatibles con las dependencias del proyecto, MySQL y Postman. Laragon puede proporcionar MySQL; Apache no es necesario.



```bash

git clone https://github.com/Piero200314/inventario-fullstack.git

cd inventario-fullstack

```



\### 1. Crear la base de datos



Inicia MySQL y ejecuta:



```sql

CREATE DATABASE IF NOT EXISTS apidb

CHARACTER SET utf8mb4

COLLATE utf8mb4\_unicode\_ci;

```



\### 2. Configurar el backend



```bash

cd backend

npm ci

```



Crea `backend/.env` con tu configuración local:



```dotenv

DB\_HOST=127.0.0.1

DB\_PORT=3306

DB\_NAME=apidb

DB\_USER=tu\_usuario

DB\_PASS=tu\_contrasena

PORT=3006

```



Desde la carpeta backend:



```bash

node scripts/configurar-seguridad.js

npm run dev

```



El script añade las variables de seguridad ausentes:



\- `JWT\_SECRET`: clave aleatoria.

\- `JWT\_EXPIRES\_IN`: duración de 1 hora.

\- `FRONTEND\_ORIGIN`: http://localhost:5173.



Conserva los valores existentes; no reemplaza una clave ya definida pero inválida.



La API se inicia en http://localhost:3006.



\### 3. Iniciar el frontend



En otra terminal, desde la raíz del proyecto:



```bash

cd frontend

npm ci

npm run dev

```



Abre la dirección que indique Vite, normalmente http://localhost:5173.



Axios utiliza `http://localhost:3006` en `frontend/src/services/api.js`. Si cambias los puertos, ajusta también la URL de Axios y `FRONTEND\_ORIGIN`.



\## Endpoints



| Método | Ruta | Acceso |

|---|---|---|

| GET | / | Público |

| POST | /api/auth/registro | Público |

| POST | /api/auth/login | Público |

| GET | /api/productos | Almacenero y Administrador |

| POST | /api/productos | Almacenero y Administrador |

| PUT | /api/productos/:id | Almacenero y Administrador |

| DELETE | /api/productos/:id | Administrador |



Los endpoints de productos también funcionan bajo `/productos`, con los mismos permisos.



\## Pruebas con Postman



\### Registro



Envía POST a `/api/auth/registro`, con Body → raw → JSON:



```json

{

&#x20; "nombre": "Usuario de prueba",

&#x20; "email": "usuario@example.com",

&#x20; "password": "REEMPLAZAR\_CON\_CLAVE\_DE\_PRUEBA"

}

```



Utiliza una contraseña propia de al menos 10 caracteres y como máximo 72 bytes. El registro público asigna el rol Almacenero.



\### Inicio de sesión



Envía POST a `/api/auth/login` con `email` y `password`.



Copia el token recibido y pégalo en Authorization → Bearer Token para las solicitudes de productos.



\### Crear un producto



Envía POST a `/api/productos` con un token válido:



```json

{

&#x20; "nombre": "Producto de prueba",

&#x20; "descripcion": "Registro autenticado",

&#x20; "precio": 19.90,

&#x20; "stock": 8

}

```



\### Probar el rol Administrador



Registra primero la cuenta y ejecuta desde backend:



```bash

node scripts/hacer-admin.js usuario@example.com

```



Vuelve a iniciar sesión y utiliza el nuevo token para eliminar un producto.



\## Seguridad implementada



| Control | Configuración |

|---|---|

| Contraseñas | Hash bcrypt con factor 12 |

| JWT | HS256 y expiración predeterminada de 1 hora |

| Autorización | Roles consultados en MySQL |

| Helmet | Cabeceras de seguridad |

| CORS | Origen del frontend configurado |

| Límite global | 100 peticiones por IP cada 15 minutos |

| Límite de autenticación | 20 peticiones por IP cada 15 minutos |

| JSON | Cuerpo máximo de 20 kb |



CORS no sustituye la autenticación. Estas medidas no garantizan por sí solas la ausencia de vulnerabilidades.



No publiques `.env`, contraseñas ni tokens.



\## Validación realizada



\- Registro y login correctos.

\- Consulta rechazada sin token y aceptada con token.

\- Creación y actualización autenticadas.

\- Eliminación denegada a Almacenero.

\- Eliminación permitida a Administrador.

\- Rechazo de contraseña incorrecta y token inválido.

\- Hash bcrypt comprobado en HeidiSQL.



Quedan pendientes la integración autenticada en React y pruebas específicas de expiración, límite 429, CORS, XSS e inyección SQL.



El backend todavía no cuenta con una suite automatizada: `npm test` contiene un marcador que termina con error.



\## Comandos



| Carpeta | Comando | Función |

|---|---|---|

| backend | npm run dev | Desarrollo con nodemon |

| backend | npm start | Arranque con Node.js |

| frontend | npm run dev | Servidor Vite |

| frontend | npm run build | Compilar |

| frontend | npm run preview | Previsualizar compilación |

| frontend | npm run lint | Análisis del código |



\## Errores frecuentes



| Error | Revisión |

|---|---|

| ECONNREFUSED | Iniciar MySQL y comprobar host/puerto |

| JWT\_SECRET inválida | Revisar `.env` y el script de seguridad |

| 401 | Proporcionar un token válido |

| 403 | Comprobar el rol del usuario |

| 429 | Esperar a que termine la ventana del limitador |

| Puerto ocupado | Detener el otro servidor o cambiar el puerto |



\## Autor



\*\*Piero Huamani — SENATI\*\*  

Fullstack Developer Software - Seminario



Práctica inicial relacionada: \[Mi API Node.js](https://github.com/Piero200314/mi-api-nodejs).

