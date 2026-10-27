# CI/CD de Remesas Que Fuef

Equipo: Remesas Que Fuef - Jahir Joshue Gomez Marcillo y Esteban Tasambay

Practica academica de Arquitectura para Plataformas FinTech, UIDE, Semana 8.
Preparada y ejecutada con asistencia de IA para el ADR-06.

## Procedencia y alcance

Reconstruccion propia del ejemplo de la lectura 08, pagina 6, y de la
presentacion A2 de clase, diapositiva 6, del docente Juan Carlos Correa.
Los dos PDF aportados no incluyen la URL del repositorio original ni el
programa de prueba. Este repositorio nuevo no se presenta como un fork
original de clase ni como el archivo alternativo del docente.

Usa exclusivamente importes, beneficiarios, proveedores y eventos simulados.
No conecta con bancos ni procesa dinero real. La persistencia en memoria
es un doble de prueba: no demuestra durabilidad, reinicios, concurrencia
real, seguridad, la Saga completa o el contrato real del BCE de Faro.

## Pruebas

Ejecutar `npm test`, con Node.js 22 o posterior. No se instalan dependencias.
El workflow preparado ejecuta ese mismo comando en GitHub Actions.

1. Misma llave entre dos versiones: una remesa, un recaudo y un abono.
2. Misma llave con otro contenido: rechazo del conflicto.
3. Version de retorno: conserva la cotizacion aceptada.
4. Conversion de centavos y redondeo HALF_UP.
5. Webhook repetido: una confirmacion y validacion del importe.

## Fallo controlado

En `config.json`, `aplicarIdempotencia: false` provoca dos recaudos en el
primer caso y una prueba falla. Cambiar la misma linea a `true` recupera
la misma remesa y debe superar las cinco pruebas.

El fallo es deliberado en un modelo aislado y nunca llega a produccion.
Los resultados y pasos reales se pueden consultar en la pestana Actions.
Un resultado rojo solo impide fusionar si el check se exige mediante una
regla de proteccion; este ejemplo no configura esa regla automaticamente.

## Decision de arquitectura

ADR-06 propone entrega continua con aprobacion de otra persona y blue-green
del nucleo. Las remesas aceptadas mantienen su tasa y proveedor originales.
El modelo de este repositorio verifica solo una parte de ese diseno.
