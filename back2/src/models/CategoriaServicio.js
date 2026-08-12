export default (sequelize, DataTypes) => {
	const CategoriaServicio = sequelize.define(
		"CategoriaServicio",
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
		},
		{
			tableName: "categorias_servicio",
			timestamps: true,
		}
	);

	CategoriaServicio.associate = (models) => {
		CategoriaServicio.hasMany(models.Servicio, { foreignKey: "categoriaServicioId", as: "servicios" });
	};

	return CategoriaServicio;
};
