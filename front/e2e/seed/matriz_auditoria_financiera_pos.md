# Matriz de Auditoría Financiera E2E - Lavanderia POS Audit biz_vgerwi

**Fecha de Ejecución**: 2026-08-27T23:29:57.200Z  
**Tenant ID**: `131`  
**Administrador**: `admin_biz_vgerwi@lavanderiapos.com`  
**Volumen de Datos**: 25 Pedidos, 25 Clientes, 15 Servicios, 4 Empleados, 2 Turnos de Caja  

---

## 📊 1. Resumen Comparativo Contable ($1:1$)

| Indicador Financiero | Valor Calculado (Matriz Matemática) | Valor Visualizado (Dashboard UI) | Estado de Integridad |
| :--- | :---: | :---: | :---: |
| **Ventas Totales Brutas** | **$165.200** | **$165.200** | ✅ COINCIDENCIA 1:1 |
| **Cobros Totales Ingresados** | **$86.000** | **$86.000** | ✅ COINCIDENCIA 1:1 |
| **Deuda Exigible (Entregados sin cobrar)** | **$33.200** | **$33.200** | ✅ COINCIDENCIA 1:1 |
| **Monto en Taller (Pendientes/Proceso/Listos)** | **$46.100** | **$46.100** | ✅ COINCIDENCIA 1:1 |
| **Gastos Operativos Totales** | **$5.000** | **$5.000** | ✅ COINCIDENCIA 1:1 |
| **Saldo Teórico Caja #1 (Turno Mañana)** | **$26.200** | **$26.200** | ✅ COINCIDENCIA 1:1 |
| **Arqueo Declarado Caja #1** | **$26.000** | **$26.000** | ⚠️ Discrepancia: -$200 |
| **Saldo Teórico Caja #2 (Turno Tarde)** | **$38.700** | **$38.700** | ✅ COINCIDENCIA 1:1 |
| **Arqueo Declarado Caja #2** | **$38.700** | **$38.700** | ✅ COINCIDENCIA 1:1 |

---

## 📸 2. Evidencia Visual
- Dashboard: `front/test-results/audit-screenshots/pos-dashboard-kpis.png`
- Finanzas: `front/test-results/audit-screenshots/pos-finanzas-reportes.png`
- Cajas Chicas: `front/test-results/audit-screenshots/pos-cajas-arqueo.png`
