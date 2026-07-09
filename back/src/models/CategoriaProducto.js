export default (sequelize, DataTypes) => {
	const CategoriaProducto = sequelize.define(
		"CategoriaProducto",
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
			activo: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
		},
		{
			tableName: "categorias_producto",
			timestamps: true,
		}
	);

	CategoriaProducto.associate = (models) => {
		CategoriaProducto.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
		CategoriaProducto.hasMany(models.Producto, { foreignKey: "categoriaId", as: "productos" });
	};

	return CategoriaProducto;
};
