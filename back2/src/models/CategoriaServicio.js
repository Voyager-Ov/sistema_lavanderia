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
				type: DataTypes.TEXT,
				allowNull: true,
			},
			icono: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			color: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			activo: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			negocioId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 1,
			}
		},
		{
			tableName: "categorias_servicio",
			timestamps: true,
		}
	);

	CategoriaServicio.associate = (models) => {
		CategoriaServicio.hasMany(models.Servicio, { foreignKey: "categoriaId", as: "servicios" });
		CategoriaServicio.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
	};

	return CategoriaServicio;
};
