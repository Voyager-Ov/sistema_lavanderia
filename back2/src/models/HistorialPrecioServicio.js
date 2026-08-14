export default (sequelize, DataTypes) => {
	const HistorialPrecioServicio = sequelize.define(
		"HistorialPrecioServicio",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			servicioId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			precio: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			},
			fechaDesde: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			fechaHasta: {
				type: DataTypes.DATE,
				allowNull: true, // null indica que es el precio activo actual
			},
			motivo: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			negocioId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			}
		},
		{
			tableName: "historial_precios_servicios",
			timestamps: true,
		}
	);

	HistorialPrecioServicio.associate = (models) => {
		HistorialPrecioServicio.belongsTo(models.Servicio, { foreignKey: "servicioId", as: "servicio", constraints: false });
		HistorialPrecioServicio.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
	};

	return HistorialPrecioServicio;
};
