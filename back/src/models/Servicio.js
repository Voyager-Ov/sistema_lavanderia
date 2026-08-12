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
				type: DataTypes.STRING,
				allowNull: true,
			},
			imagenUrl: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			costo: {
				type: DataTypes.DOUBLE,
				allowNull: false,
				defaultValue: 0,
			},
			precio: {
				type: DataTypes.DOUBLE,
				allowNull: false,
				defaultValue: 0,
			},
			disponible: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
		},
		{
			tableName: "servicios",
			timestamps: true,
		}
	);

	Servicio.associate = (models) => {
		Servicio.belongsTo(models.CategoriaServicio, { foreignKey: "categoriaServicioId", as: "categoria", constraints: false });
		Servicio.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
	};

	return Servicio;
};
