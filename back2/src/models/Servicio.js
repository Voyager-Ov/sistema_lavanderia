export default (sequelize, DataTypes) => {
	const Servicio = sequelize.define(
		"Servicio",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			nombre: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			descripcion: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			precioActual: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
				defaultValue: 0.00,
			},
			costoEstimado: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: true,
				defaultValue: 0.00,
			},
			tiempoEstimadoMinutos: {
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: 0,
			},
			imagenUrl: {
				type: DataTypes.STRING,
				allowNull: true,
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
			categoriaId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			negocioId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			}
		},
		{
			tableName: "servicios",
			timestamps: true,
		}
	);

	Servicio.associate = (models) => {
		Servicio.belongsTo(models.CategoriaServicio, { foreignKey: "categoriaId", as: "categoria", constraints: false });
		Servicio.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
		Servicio.hasMany(models.HistorialPrecioServicio, { foreignKey: "servicioId", as: "historialPrecios", constraints: false });
	};

	return Servicio;
};
