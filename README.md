# Generador de Facturas Pro

**Generador de Facturas Pro** es una aplicación web moderna construida con React y TypeScript, diseñada para simplificar la creación, gestión y exportación de cuentas de cobro o facturas en formato PDF. Permite a los usuarios administrar una lista de clientes y mantener un historial de todas las facturas generadas, con un enfoque en la personalización y facilidad de uso.

Ahora incluye un backend Node.js/Express para persistencia de datos en una base de datos MySQL.

## Características Principales

*   **Gestión de Facturas:**
    *   Crear nuevas facturas con numeración automática sugerida desde el backend.
    *   Editar facturas existentes.
    *   Listar y buscar facturas por número o nombre de cliente.
    *   Eliminar facturas.
    *   Calcular totales automáticamente (frontend y backend).
*   **Gestión de Clientes:**
    *   Agregar nuevos clientes con detalles como NIT/CC, nombre, ciudad, teléfono y dirección.
    *   Editar información de clientes existentes.
    *   Listar y buscar clientes.
    *   Eliminar clientes.
*   **Generación de PDF:**
    *   Visualizar una vista previa de la factura en un formato similar al de impresión.
    *   Descargar facturas en formato PDF con un diseño profesional.
*   **Personalización de Plantilla (Configuración del Remitente):**
    *   Configurar los detalles del remitente (nombre, NIT, dirección, contacto) a través del backend.
    *   Subir un logo personalizado y una imagen de firma (gestionado por la configuración, URLs almacenadas).
    *   Establecer información de pago predeterminada.
    *   Los ajustes de personalización se guardan en la base de datos a través del backend.
*   **Panel de Control (Dashboard):**
    *   Resumen de estadísticas clave: total de facturas, total de clientes e ingresos totales (obtenidos del backend).
    *   Accesos rápidos para crear nuevas facturas y clientes, y para ir a la configuración.
*   **Gestión de Pagos (Nueva con Node.js backend):**
    *   Registrar pagos asociados a clientes.
    *   Ver historial de pagos por cliente.
    *   Opcionalmente, adjuntar URL de comprobante de pago.
*   **Diseño Responsivo:**
    *   Interfaz adaptable para una buena experiencia en dispositivos móviles y de escritorio.
*   **Interfaz en Español:**
    *   Toda la aplicación está traducida al español.

## Tech Stack

### Frontend
*   **React 19:** Para la construcción de la interfaz de usuario.
*   **TypeScript:** Para tipado estático.
*   **React Router DOM:** Para la navegación.
*   **Tailwind CSS:** Para diseño utilitario.
*   **Lucide React:** Para iconos SVG.
*   **jsPDF & html2canvas:** Para la generación de PDF en el cliente.
*   **Vite:** Herramienta de frontend para desarrollo y build.

### Backend
*   **Node.js:** Entorno de ejecución JavaScript.
*   **Express.js:** Framework para construir la API RESTful.
*   **mysql2:** Driver de MySQL para Node.js (con soporte para promesas).
*   **cors:** Middleware para habilitar Cross-Origin Resource Sharing.
*   **dotenv:** Para gestionar variables de entorno.
*   **uuid:** Para generar IDs únicos.
*   **nodemon:** Para reiniciar automáticamente el servidor backend durante el desarrollo.

### Base de Datos
*   **MySQL**

## Configuración y Despliegue

### 1. Configuración del Backend y Base de Datos

Sigue estos pasos para configurar el backend y la base de datos:

**a. Requisitos Previos:**
   *   Node.js y npm (o yarn) instalados.
   *   Servidor MySQL instalado y en ejecución.

**b. Clonar el Repositorio (si aplica):**
   Si estás trabajando desde un repositorio clonado, navega a la raíz del proyecto.

**c. Configurar Variables de Entorno del Backend:**
   *   Navega al directorio `backend`.
   *   Copia el archivo `.env.example` a un nuevo archivo llamado `.env`:
     ```bash
     cd backend
     cp .env.example .env
     ```
   *   Abre el archivo `.env` y edita las variables con los detalles de tu conexión a MySQL y el puerto deseado para la API:
     ```
     DB_HOST=localhost
     DB_USER=tu_usuario_mysql
     DB_PASSWORD=tu_contraseña_mysql
     DB_NAME=generador_facturas_db # O el nombre que prefieras
     DB_PORT=3306
     API_PORT=3001 # Puerto en el que correrá el backend
     ```

**d. Crear la Base de Datos:**
   *   Conéctate a tu servidor MySQL.
   *   Crea la base de datos especificada en `DB_NAME` en tu archivo `.env`. Ejemplo:
     ```sql
     CREATE DATABASE generador_facturas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
     ```

**e. Ejecutar el Script SQL para las Tablas:**
   *   Utiliza un cliente MySQL (como MySQL Workbench, phpMyAdmin, o la línea de comandos) para ejecutar el script SQL consolidado (ver sección "Estructura de Tablas MySQL" más abajo) en la base de datos que acabas de crear. Esto creará las tablas `clients`, `invoices`, `line_items`, `sender_profile` y `payments`.

**f. Instalar Dependencias del Backend:**
   *   En el directorio `backend`, ejecuta:
     ```bash
     npm install
     # o si usas yarn:
     # yarn install
     ```

**g. Iniciar el Servidor Backend:**
   *   Desde el directorio `backend`, puedes iniciar el servidor:
     *   Para desarrollo (con reinicio automático usando `nodemon`):
       ```bash
       npm run dev
       ```
     *   Para producción:
       ```bash
       npm start
       ```
   *   Si todo está configurado correctamente, deberías ver un mensaje indicando que el servidor está escuchando en el puerto `API_PORT` (ej: `Servidor API escuchando en el puerto 3001`).

### 2. Configuración y Ejecución del Frontend

El frontend utiliza Vite para desarrollo y compilación.

**a. Instalar Dependencias del Frontend:**
   * En el directorio raíz del proyecto (donde está `vite.config.js`), ejecuta:
     ```bash
     npm install
     # o si usas yarn:
     # yarn install
     ```
**b. Servir el Frontend en Desarrollo:**
   *   Desde el directorio raíz del proyecto:
     ```bash
     npm run dev 
     # o si usas yarn:
     # yarn dev
     ```
   *   Esto iniciará el servidor de desarrollo de Vite (usualmente en `http://localhost:5173` o similar).
   *   Las llamadas API desde el frontend están configuradas para apuntar al backend Node.js (ej: `http://localhost:3001/api/...` a través de `/api` que Vite puede proxy si se configura, o directamente si el backend y frontend corren en diferentes puertos y CORS está habilitado).

**c. Acceder a la Aplicación:**
   *   Abre tu navegador y ve a la URL donde estás sirviendo el frontend (ej: `http://localhost:5173`).

### 3. Despliegue en cPanel (con Proceso de Build para Frontend)

Para desplegar en un entorno como cPanel:

**a. Backend:**
   *   El backend Node.js necesitará ser desplegado en un entorno que soporte Node.js (cPanel a menudo tiene "Setup Node.js App").
   *   Deberás configurar las variables de entorno en la configuración de la aplicación Node.js en cPanel.
   *   Sube los archivos del directorio `backend` (excluyendo `node_modules`).
   *   Ejecuta `npm install --production` en el servidor para instalar solo las dependencias de producción.
   *   Configura tu aplicación Node.js para que se inicie (ej: a través de un archivo como `app.js` o `server.js`).

**b. Frontend:**
   *   **Construir la Aplicación Frontend (Localmente):**
        *   Desde el directorio raíz del proyecto, ejecuta el comando de build:
          ```bash
          npm run build
          # o si usas yarn:
          # yarn build
          ```
        *   Esto generará una carpeta `dist` con archivos estáticos optimizados. Asegúrate que `vite.config.js` tiene el `base` path correcto si despliegas en un subdirectorio (ej: `base: '/facturador/'`).
   *   **Subir a cPanel:**
        *   Sube el contenido de la carpeta `dist` del frontend al directorio de tu sitio web en cPanel (ej: `public_html` o `public_html/facturador`).
   *   **Configuración del Servidor para SPAs (Routing):**
        *   Si usas `HashRouter` (como en `App.tsx`), generalmente no necesitas reglas complejas de reescritura del servidor. El servidor solo necesita servir `index.html`.
        *   Si cambias a `BrowserRouter` y despliegas en un subdirectorio, podrías necesitar un `.htaccess` en el directorio del frontend (ej: `public_html/facturador/.htaccess`) para redirigir todas las solicitudes al `index.html` del subdirectorio:
          ```apache
          <IfModule mod_rewrite.c>
            RewriteEngine On
            RewriteBase /facturador/
            RewriteRule ^index\.html$ - [L]
            RewriteCond %{REQUEST_FILENAME} !-f
            RewriteCond %{REQUEST_FILENAME} !-d
            RewriteRule . /facturador/index.html [L]
          </IfModule>
          ```

## Estructura de Tablas MySQL (Script Consolidado)

Ejecuta este script en tu base de datos MySQL (`DB_NAME`):

```sql
-- Script para crear tablas para la aplicación Generador de Facturas Pro

-- Tabla de Clientes
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(36) PRIMARY KEY, -- UUID
    nitOrCc VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    phone VARCHAR(50),
    address VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Facturas
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(36) PRIMARY KEY, -- UUID
    invoiceNumber VARCHAR(50) NOT NULL UNIQUE,
    date DATE NOT NULL,
    clientId VARCHAR(36) NOT NULL,
    notes TEXT,
    totalAmount DECIMAL(15, 2) DEFAULT 0.00,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE RESTRICT ON UPDATE CASCADE -- RESTRICT para evitar borrar cliente con facturas
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Ítems de Línea de Factura
CREATE TABLE IF NOT EXISTS line_items (
    id VARCHAR(36) PRIMARY KEY, -- UUID
    invoiceId VARCHAR(36) NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unitPrice DECIMAL(15, 2) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (invoiceId) REFERENCES invoices(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para el Perfil del Remitente (Configuración de la Plantilla)
CREATE TABLE IF NOT EXISTS sender_profile (
    profile_id VARCHAR(36) PRIMARY KEY, -- Usar un UUID o un ID fijo como 'main_profile'
    name VARCHAR(255) NOT NULL,
    nit VARCHAR(50) NOT NULL,
    type VARCHAR(100),
    logoUrl TEXT,
    address VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    bankAccountInfo TEXT,
    signatureName VARCHAR(255),
    signatureCC VARCHAR(50),
    signatureImageUrl TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Pagos
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY, -- UUID
    clientId VARCHAR(36) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    date DATE NOT NULL,
    method VARCHAR(100), -- e.g., 'Transferencia', 'Efectivo', 'PSE'
    notes TEXT,
    proofUrl TEXT, -- URL to an uploaded image or document
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE ON UPDATE CASCADE -- Si se borra un cliente, se borran sus pagos. O RESTRICT si se prefiere.
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Opcional: Insertar un perfil de remitente predeterminado si la tabla está vacía.
-- El backend se encargará de crear/actualizar este perfil.
/*
INSERT INTO sender_profile (
    profile_id, name, nit, type, address, phone, email, bankAccountInfo, signatureName, signatureCC
) VALUES (
    'main_profile', -- Un ID fijo y conocido
    'Tu Nombre/Empresa Aquí',
    'Tu NIT/CC Aquí',
    'Persona Natural/Jurídica',
    'Tu Dirección, Ciudad',
    'Tu Teléfono',
    'tuemail@example.com',
    'Información de cuenta bancaria (ej: Cuenta de ahorros Bancolombia XXX-XXXXXX-X)',
    'Nombre del Firmante',
    'CC. del Firmante'
);
*/
```

## API Endpoints (Backend Node.js)

El backend expone los siguientes endpoints principales (todos bajo `/api`):

*   **Clientes (`/clients`)**
    *   `GET /`: Listar todos los clientes.
    *   `GET /:id`: Obtener un cliente por ID.
    *   `POST /`: Crear un nuevo cliente.
    *   `PUT /:id`: Actualizar un cliente existente.
    *   `DELETE /:id`: Eliminar un cliente.
*   **Facturas (`/invoices`)**
    *   `GET /`: Listar todas las facturas.
    *   `GET /:id`: Obtener una factura por ID (incluye ítems de línea).
    *   `POST /`: Crear una nueva factura (incluye ítems de línea).
    *   `PUT /:id`: Actualizar una factura existente (incluye ítems de línea).
    *   `DELETE /:id`: Eliminar una factura.
    *   `GET /next-number`: Obtener el siguiente número de factura sugerido.
*   **Configuración (`/settings`)**
    *   `GET /profile`: Obtener el perfil del remitente.
    *   `POST /profile`: Crear o actualizar el perfil del remitente.
*   **Pagos (`/payments`)**
    *   `POST /`: Registrar un nuevo pago.
    *   `GET /client/:clientId`: Obtener todos los pagos de un cliente específico.
    *   `DELETE /:id`: Eliminar un pago por su ID.


## Posibles Mejoras Futuras

*   **Autenticación de Usuarios.**
*   **Funcionalidades Avanzadas de Facturación:** Impuestos, descuentos, diferentes monedas.
*   **Reportes Avanzados.**
*   **Pruebas Unitarias e Integración.**
*   **Manejo de subida de archivos (comprobantes de pago) en el backend Node.js.**

---

Este README proporciona una visión general y una hoja de ruta para la aplicación full-stack.
