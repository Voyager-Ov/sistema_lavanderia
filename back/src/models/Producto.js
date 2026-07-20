export default (sequelize, DataTypes) => {
	const Producto = sequelize.define(
		"Producto",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			negocioId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			nombre: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			categoriaId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			precioActual: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			},
			costoEstimado: {
				// Cuánto le cuesta a la lavandería hacer este servicio (insumos, luz, etc.)
				type: DataTypes.DECIMAL(10, 2),
				allowNull: true,
				defaultValue: 0,
			},
			tiempoEstimadoMinutos: {
				// Tiempo que lleva el servicio, util para dashboards de productividad
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: 0,
			},
			disponible: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			activo: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			imagenUrl: {
				type: DataTypes.STRING,
				allowNull: true,
			},
		},
		{
			tableName: "productos",
			timestamps: true,
			indexes: [
				{ fields: ["negocioId"] },
				{ fields: ["categoriaId"] },
				{ fields: ["activo"] }
			]
		}
	);

	Producto.associate = (models) => {
		Producto.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
		Producto.belongsTo(models.CategoriaProducto, { foreignKey: "categoriaId", as: "categoria" });
		Producto.hasMany(models.HistorialPrecioProducto, { foreignKey: "productoId", as: "historialPrecios" });
	};

	return Producto;
};
