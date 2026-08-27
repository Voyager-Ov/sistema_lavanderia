import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class CategoriasGastosService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    _getCategoriasBase() {
        return [
            { nombre: "Insumos", descripcion: "Detergentes, suavizantes y químicos de lavado" },
            { nombre: "Mantenimiento", descripcion: "Reparación y repuestos de maquinarias" },
            { nombre: "Servicios (Luz/Agua/Gas)", descripcion: "Servicios públicos y energía" },
            { nombre: "Nómina / Empleados", descripcion: "Adelantos, sueldos y viáticos de personal" },
            { nombre: "Alquiler", descripcion: "Alquiler del local comercial" },
            { nombre: "Varios", descripcion: "Gastos menores operativos" }
        ];
    }

    async obtenerCategorias(negocioId) {
        if (!negocioId) throw new AppError("No se ha identificado el negocio activo.", 400, "MISSING_TENANT_ID");
        const { CategoriaGasto } = await this._getModels(negocioId);

        let categorias = await CategoriaGasto.findAll({ order: [["id", "ASC"]] });

        if (categorias.length === 0) {
            const base = this._getCategoriasBase();
            for (const cat of base) {
                await CategoriaGasto.findOrCreate({ where: { nombre: cat.nombre }, defaults: cat });
            }
            categorias = await CategoriaGasto.findAll({ order: [["id", "ASC"]] });
        }

        return categorias;
    }

    async crearCategoria(negocioId, data) {
        if (!negocioId) throw new AppError("No se ha identificado el negocio activo.", 400, "MISSING_TENANT_ID");
        const { CategoriaGasto } = await this._getModels(negocioId);

        if (!data.nombre || data.nombre.trim() === "") {
            throw new AppError("El nombre de la categoría es obligatorio.", 400, "MISSING_CATEGORY_NAME");
        }

        const existe = await CategoriaGasto.findOne({ where: { nombre: data.nombre.trim() } });
        if (existe) {
            return existe;
        }

        return await CategoriaGasto.create({
            nombre: data.nombre.trim(),
            descripcion: data.descripcion && typeof data.descripcion === "string" ? data.descripcion.trim() : null
        });
    }

    async eliminarCategoria(negocioId, id) {
        if (!negocioId) throw new AppError("No se ha identificado el negocio activo.", 400, "MISSING_TENANT_ID");
        const { CategoriaGasto } = await this._getModels(negocioId);

        const cat = await CategoriaGasto.findByPk(id);
        if (!cat) throw new AppError("Categoría de gasto no encontrada.", 404, "CATEGORY_NOT_FOUND");

        await cat.destroy();
        return { message: "Categoría eliminada exitosamente." };
    }
}

export const categoriasGastosService = new CategoriasGastosService();
