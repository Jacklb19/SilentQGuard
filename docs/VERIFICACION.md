# Verificación del MVP

Fecha: 13 de octubre de 2026. Entorno: Windows, Node.js 24.19.0.

## Comprobaciones ejecutadas

- TypeScript estricto para backends, contratos y frontend: aprobado.
- Vitest: 28 pruebas aprobadas, distribuidas entre dominio (15), contratos (8) e integración (5).
- Build: tipos Protobuf generados, backends compilados y frontend Vite construido correctamente.
- `docker compose config --quiet`: configuración válida. No se construyeron imágenes porque Docker Desktop no estaba activo.
- Revisión 21st: seis avisos informativos de colores literales en CSS; sin errores de interacción. Se mantiene la paleta intencional del producto.
- Navegador: reporte nivel 2 en Biblioteca central; segundo cliente muestra ese estado. Reporte nivel 5 en Cafetería desde el segundo cliente aparece en el primero sin recarga.
- Navegador: sin errores ni warnings de consola en el flujo verificado.
- Responsive: escritorio 1440, tablet 768 y móvil 390/360 revisados, sin desbordamiento horizontal en esos anchos. Se corrigió la estrechez del resumen junto al título móvil. El modal se revisó a 360 px. Filtro Moderado sin coincidencias muestra mensaje y botón para restablecer.

## Qué prueban las integraciones

Las pruebas arrancan un servidor gRPC real y un gateway HTTP, con puertos locales efímeros. No mockean el transporte entre backends. Cubren serialización Protobuf, dos receptores SSE, expiración sin nuevo POST, reinicio del servidor con cambio de identidad, validación directa RPC, errores HTTP e idempotencia.

El README incluye una secuencia para demostrar dos **procesos** independientes con `npm start`; la prueba automatizada usa servidores separados dentro del proceso de pruebas para controlar reloj y teardown. La revisión manual se realizó con los dos procesos Node del comando de inicio.

## Límites de la verificación

No se hizo carga masiva ni una auditoría completa de accesibilidad. No se probaron contenedores en ejecución. Las cuotas reales del hosting no se probaron mediante consumo.

La publicación en Render no se completó: el panel mostró mantenimiento hasta aproximadamente las 21:00 de Bogotá y la sesión del navegador estaba en la pantalla de login. `render.yaml` y `vercel.json` son configuración preparada, no evidencia de URLs desplegadas. Se requiere acceso al panel y sesión del usuario para completar esa parte.
