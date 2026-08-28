# Matriz de Auditoría Financiera 1:1 - Lavanderia Express E2E mtc3ux6l

**Fecha de Ejecución**: 2026-08-27T22:40:47.941Z  
**Tenant ID**: `124`  
**Administrador**: `admin_mtc3ux6l@lavanderiaexpress.com`  

---

## 📊 1. Resumen Comparativo Contable ($1:1$)

| Indicador Financiero | Valor Calculado (Matriz Matemática) | Valor Visualizado (Dashboard UI) | Estado de Integridad |
| :--- | :---: | :---: | :---: |
| **Ventas Totales Brutas** | **$62.700** | **$62.700** | ✅ COINCIDENCIA 1:1 |
| **Cobros Totales Ingresados** | **$14.200** | **$14.200** | ✅ COINCIDENCIA 1:1 |
| **Deuda Exigible (Entregados sin cobrar)** | **$20.200** | **$20.200** | ✅ COINCIDENCIA 1:1 |
| **Monto en Taller (En proceso sin cobrar)** | **$28.300** | **$28.300** | ✅ COINCIDENCIA 1:1 |
| **Saldo Teórico en Caja Chica** | **$25.700** | **$25.700** | ✅ COINCIDENCIA 1:1 |

---

## 🧾 2. Desglose Granular de Pedidos & Cobranzas

1. **P01 (Juan Perez)**: $4.700 ➔ `ENTREGADO` (COBRADO: $5.000 Efectivo | Vuelto a favor: $300)
2. **P02 (Maria Gonzalez)**: $8.500 ➔ `ENTREGADO` (COBRADO: $8.500 Transferencia)
3. **P03 (Pedro Rodriguez)**: $10.700 ➔ `ENTREGADO` (**NO COBRADO** ➔ **Deuda Exigible: $10.700**)
4. **P04 (Ana Fernandez)**: $9.500 ➔ `ENTREGADO` (**NO COBRADO** ➔ **Deuda Exigible: $9.500**)
5. **P05 (Lucas Lopez)**: $6.600 ➔ `LISTO` (NO COBRADO ➔ Monto en Taller: $6.600)
6. **P06 (Sofia Martinez)**: $6.200 ➔ `EN_PROCESO` (NO COBRADO ➔ Monto en Taller: $6.200)
7. **P07 (Gonzalo Sanchez)**: $3.500 ➔ `EN_PROCESO` (NO COBRADO ➔ Monto en Taller: $3.500)
8. **P08 (Lucia Gomez)**: $12.000 ➔ `PENDIENTE` (NO COBRADO ➔ Monto en Taller: $12.000)
9. **P09 (Juan Perez)**: $1.000 ➔ `ENTREGADO` (COBRADO: $300 Saldo a favor + $700 Efectivo ➔ Saldo a favor remanente: $0)
10. **P10 (Agustin Diaz)**: $4.800 ➔ `CANCELADO` (NO COBRADO ➔ $0)

---

## 📸 3. Archivos de Evidencia Visual

- Dashboard KPIs: `front/test-results/audit-screenshots/dashboard-kpis.png`
- Reporte Financiero: `front/test-results/audit-screenshots/finanzas-reportes.png`
