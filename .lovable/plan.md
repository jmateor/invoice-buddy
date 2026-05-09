
# Sistema Fiscal DGII Autónomo

Objetivo: que el contador pueda **emitir, validar y enviar** los reportes 606, 607 y 608 con un solo clic, con todos los campos exigidos por la Norma General 07-2018, y que el sistema gestione el certificado digital de la DGII para e-CF.

## 1. Lo que ya existe (no se rehace)

- `ecf_configuracion` con `certificado_path` y `certificado_password_encrypted` (cifrado AES-GCM con `SUPABASE_SERVICE_ROLE_KEY`).
- Bucket privado `certificados-ecf` para los `.pfx`.
- Edge function `ecf-dgii-client` que firma XML (XMLDSig) y envía a DGII.
- Página `/reportes` con pestaña DGII básica (RNC, NCF, fecha, monto, ITBIS, forma de pago).
- Tablas `facturas`, `compras`, `notas_credito`, `pagos_factura`.

## 2. Brechas vs. norma DGII (lo que falta)

**Reporte 606 — Compras** (norma exige 23 columnas; hoy solo se exportan 5):
- Tipo de Bienes/Servicios (01–11), NCF, NCF modificado, Fecha pago
- Monto facturado **bienes** vs. **servicios** (separados)
- ITBIS facturado, retenido, sujeto a proporcionalidad, llevado al costo
- Tipo y monto de retención ISR, ISC, otros impuestos, propina legal
- Forma de pago (1–7)

**Reporte 607 — Ventas** (norma exige 23 columnas; hoy se exportan 6):
- Tipo de Identificación (1 RNC / 2 Cédula / 3 Pasaporte), NCF modificado, Tipo de Ingreso (1–6), Fecha retención
- ITBIS retenido por terceros, Retención Renta por terceros
- ISC, otros impuestos, propina legal
- Desglose de pago en 7 columnas: Efectivo, Cheque/Transferencia, Tarjeta, Crédito, Bonos, Permuta, Otras

**608 — Anulados**: ya tiene NCF, tipo, fecha. Falta solo el motivo (catálogo 02–05).

**Salida**: hoy se exporta a Excel. La DGII pide **archivo TXT pipe-delimited** (`|`) con nombre `DGII_F_607_<RNC>_<AAAAMM>.TXT`. Hay que generarlo además del Excel.

## 3. Cambios en datos (esquema)

### Compras → enriquecer
Añadir a `compras`: `ncf`, `ncf_modificado`, `tipo_bienes_servicios` (01–11), `fecha_pago`, `monto_servicios`, `monto_bienes`, `itbis_facturado`, `itbis_retenido`, `itbis_proporcionalidad`, `itbis_costo`, `itbis_percibido`, `tipo_retencion_isr`, `monto_retencion_isr`, `isc`, `otros_impuestos`, `propina_legal`, `forma_pago` (1–7).

### Facturas → enriquecer
Añadir a `facturas`: `tipo_ingreso` (1–6), `itbis_retenido_terceros`, `retencion_isr_terceros`, `fecha_retencion`, `isc`, `otros_impuestos`, `propina_legal`, `monto_efectivo`, `monto_cheque`, `monto_tarjeta`, `monto_credito`, `monto_bonos`, `monto_permuta`, `monto_otros`. Los desgloses de pago se calcularán automáticamente desde `pagos_factura` cuando existan.

### Catálogos
Tabla nueva `dgii_catalogos` (semilla en migración) con valores oficiales para tipo de identificación, tipo de ingreso, tipo de bienes, retenciones ISR, formas de pago, motivos de anulación. Sirve para los selects.

### Cierre fiscal
Tabla `dgii_periodos_remitidos`: `periodo` (AAAAMM), `tipo` (606/607/608), `cantidad_registros`, `total_monto`, `archivo_url`, `fecha_remision`, `estado` (borrador/enviado/aceptado), `usuario_id`. Permite trazar qué períodos ya se enviaron y bloquear cambios retroactivos.

## 4. Cambios funcionales

### 4.1 POS y Facturación
- En el modal de pago: capturar **desglose por método** cuando hay pago mixto.
- Campo "Tipo de Ingreso" en alta de factura (default `01 Operaciones`); el contador puede ajustar.
- Cálculos automáticos de propina legal cuando aplica (configurable en `configuracion_negocio.propina_legal_pct`).

### 4.2 Compras
- Formulario rediseñado en pestañas: **Identificación** (RNC, NCF, fechas), **Montos** (bienes/servicios + ITBIS desglosado), **Retenciones** (ISR/ITBIS), **Pago** (forma + ISC/otros).
- Auto-clasificación: si el proveedor tiene "tipo de bienes" predeterminado, se precarga.
- Validación NCF: longitud (11/13/19), prefijo válido (B01, B11, B14, B15, E31…).

### 4.3 Notas de crédito
Hoy ya guardan factura origen → exportar como NCF modificado en 606/607 automáticamente.

### 4.4 Centro Fiscal del Contador (`/fiscal`)
Nueva sección visible solo para `admin` y `contador`:

- **Tablero del período actual**: tarjetas con totales 606, 607, 608; alertas de NCF próximos a vencer; secuencias e-CF disponibles; certificado e-CF y días restantes; recordatorio de fecha límite (día 15).
- **Wizard de cierre mensual** (3 pasos):
  1. Validar — corre reglas DGII (NCF duplicados, sumas que no cuadran, fechas fuera de período, RNC inválidos). Marca filas con error y permite editarlas en línea.
  2. Generar archivos — produce simultáneamente: Excel (visual), TXT oficial DGII pipe-delimited y reporte PDF firmado. Los guarda en bucket `reportes-fiscales` y registra en `dgii_periodos_remitidos`.
  3. Marcar como remitido — al subirse en Oficina Virtual, el contador marca el período cerrado; el sistema bloquea modificaciones retroactivas.
- **Historial de remisiones**: lista de períodos con archivos descargables, totales y estado.

### 4.5 Certificado e-CF
- En `/configuraciones → Fiscal`: drag-and-drop del `.pfx`, captura de contraseña, validación inmediata (extrae `Subject`, `NotBefore`, `NotAfter`, `Issuer`) en edge function `ecf-validate-cert`.
- Alerta automática 60/30/7 días antes del vencimiento (banner en dashboard + email vía edge function programada).
- Botón "Probar firma" que firma un XML dummy y verifica respuesta antes de operar.

### 4.6 RBAC
Rol `contador` ya existe. Ampliar permisos: lectura total de facturas/compras/notas, escritura en `dgii_periodos_remitidos`, sin acceso a edición de productos/usuarios. Política RLS ya cubre con `has_role(uid, 'contador')`.

### 4.7 Alertas y autonomía
- Cron job (pg_cron + pg_net) el día 1, 10 y 14 de cada mes que invoca edge function `dgii-recordatorios` → genera notificaciones in-app y log en `audit_logs` ("período YYYYMM listo para remisión").
- Validación previa al cierre: si hay borradores o NCF sin emitir en el período, el wizard exige resolverlos primero.

## 5. Edge functions nuevas

| Función | Rol |
|---|---|
| `dgii-generar-606` | Construye registros 606 desde `compras` + notas de crédito; devuelve TXT y Excel |
| `dgii-generar-607` | Construye registros 607 desde `facturas` emitidas (no borrador, no anuladas) |
| `dgii-generar-608` | Construye registros 608 desde `facturas` anuladas |
| `dgii-validar-periodo` | Reglas de validación: NCF duplicado, sumas, RNC, fechas |
| `dgii-recordatorios` | Cron mensual de avisos |
| `ecf-validate-cert` | Lee `.pfx`, devuelve metadatos sin exponer la clave |

Todas usan `verify_jwt = true` (default) y revisan rol del llamador.

## 6. UI

- Sidebar: nueva entrada **Centro Fiscal** (icono `Receipt`), visible para `admin`/`contador`. La pestaña DGII de `/reportes` se mantiene como vista rápida operativa.
- `GuiaUso` contextual en cada paso del wizard.
- Sección en `/ayuda`: "Cómo cerrar el mes fiscal en 5 minutos".

## 7. Detalles técnicos

- **Formato TXT**: cada línea = campos pipe-delimited en orden exacto de la norma; fechas `AAAAMMDD`; montos con punto decimal; campos vacíos van vacíos (no `0`); CRLF al final.
- **Nombre archivo**: `DGII_F_<606|607|608>_<RNC>_<AAAAMM>.TXT`.
- **Cálculo automático**: si una factura tiene varios `pagos_factura`, el desglose 607 (efectivo/cheque/tarjeta/crédito) se reparte proporcional al monto de cada pago según `metodo_pago`.
- **Bloqueo**: trigger en `facturas`/`compras` que rechaza UPDATE/DELETE si `fecha` cae en un período con `dgii_periodos_remitidos.estado = 'enviado'`.
- **Storage**: bucket nuevo privado `reportes-fiscales` con RLS por `user_id`.
- **Catálogo NCF/e-CF DGII** (B01..B17, E31..E47) en `src/lib/dgii/catalogos.ts` (ya existe parcialmente — se completa).

## 8. Orden de entrega

1. Migración de esquema (compras+facturas+catálogos+períodos+bucket).
2. Edge functions de generación (606/607/608) + TXT.
3. Centro Fiscal `/fiscal` con wizard y tablero.
4. Compras y POS con campos enriquecidos (formulario por pestañas).
5. Validación + bloqueo retroactivo + cron de recordatorios.
6. Certificado e-CF: validación, alertas de vencimiento, botón "Probar firma".
7. Guías y ayuda.

Con esto el contador abre el sistema el día 14, pulsa **Generar cierre**, descarga 3 archivos TXT y los sube a la Oficina Virtual de la DGII. Sin Excel manual, sin tipear NCFs.

---

¿Apruebas el plan o quieres ajustar algo (orden, alcance, dejar fuera alguna parte)?
