import { apiClient } from "@/shared/lib/api-client";

export interface FinanzasKPIs {
    totalIngresos: number;
    totalEgresos: number;
    balanceNeto: number;
    totalNoCobrado: number;
}

export interface MovimientoFinanciero {
    id: string; // ej: "pago-1" o "gasto-2"
    tipoMovimiento: 'INGRESO' | 'EGRESO';
    monto: number;
    fecha: string;
    descripcion: string;
    referenciaId: string | number; // pedidoId para pagos, categoria para gastos
    metodoPago: string;
    registradoPor: string;
    estado: string;
    originalId: number; // el id en su respectiva tabla
}

export interface PaginatedMovimientos {
    data: MovimientoFinanciero[];
    pagination: {
        totalRecords: number;
        totalPages: number;
        currentPage: number;
        limit: number;
    }
}

export interface GetFinanzasParams {
    fechaDesde?: string;
    fechaHasta?: string;
    page?: number;
    limit?: number;
    search?: string;
}

export async function getFinanzasKPIs(params?: { fechaDesde?: string, fechaHasta?: string }): Promise<FinanzasKPIs> {
    const query = new URLSearchParams();
    if (params?.fechaDesde) query.append("fechaDesde", params.fechaDesde);
    if (params?.fechaHasta) query.append("fechaHasta", params.fechaHasta);

    const qs = query.toString();
    const response = await apiClient.get<{ data: FinanzasKPIs }>(`/finanzas/kpis${qs ? `?${qs}` : ''}`);
    return response.data;
}

export async function getMovimientos(params?: GetFinanzasParams): Promise<PaginatedMovimientos> {
    const query = new URLSearchParams();
    if (params?.fechaDesde) query.append("fechaDesde", params.fechaDesde);
    if (params?.fechaHasta) query.append("fechaHasta", params.fechaHasta);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.search) query.append("search", params.search);

    const qs = query.toString();
    const response = await apiClient.get<{ data: PaginatedMovimientos }>(`/finanzas/movimientos${qs ? `?${qs}` : ''}`);
    return response.data;
}
