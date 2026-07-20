export default (sequelize, DataTypes) => {
	const CategoriaGasto = sequelize.define(
		"CategoriaGasto",
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
		},
		{
			tableName: "categorias_gastos",
			timestamps: true,
			indexes: [
				{ fields: ["negocioId"] }
			]
		}
	);

	CategoriaGasto.associate = (models) => {
		CategoriaGasto.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
	};

	return CategoriaGasto;
};
