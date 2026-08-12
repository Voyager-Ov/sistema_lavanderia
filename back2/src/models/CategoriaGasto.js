export default (sequelize, DataTypes) => {
	const CategoriaGasto = sequelize.define(
		"CategoriaGasto",
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
			tableName: "categorias_gasto",
			timestamps: true,
		}
	);

	CategoriaGasto.associate = (models) => {
		CategoriaGasto.hasMany(models.Gasto, { foreignKey: "categoriaGastoId", as: "gastos" });
	};

	return CategoriaGasto;
};
