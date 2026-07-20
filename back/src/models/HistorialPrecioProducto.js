export default (sequelize, DataTypes) => {
	const HistorialPrecioProducto = sequelize.define(
		"HistorialPrecioProducto",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			productoId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			negocioId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			precioAnterior: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			},
			precioNuevo: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			},
		},
		{
			tableName: "historial_precios_producto",
			timestamps: true,
			indexes: [
				{ fields: ["productoId"] },
				{ fields: ["negocioId"] }
			]
		}
	);

	HistorialPrecioProducto.associate = (models) => {
		HistorialPrecioProducto.belongsTo(models.Producto, { foreignKey: "productoId", as: "producto" });
		HistorialPrecioProducto.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
	};

	return HistorialPrecioProducto;
};
