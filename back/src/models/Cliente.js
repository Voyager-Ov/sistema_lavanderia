export default (sequelize, DataTypes) => {
	const Cliente = sequelize.define(
		"Cliente",
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
			telefono: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			email: {
				type: DataTypes.STRING,
				allowNull: true,
				validate: {
					isEmail: true,
				},
			},
			activo: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			motivoBaja: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			direccion: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			notas: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
		},
		{
			tableName: "clientes",
			timestamps: true,
			indexes: [
				{ fields: ["negocioId"] },
				{ fields: ["telefono"] },
				{ fields: ["activo"] }
			]
		}
	);

	Cliente.associate = (models) => {
		Cliente.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
		Cliente.hasMany(models.Pedido, { foreignKey: "clienteId", as: "pedidos" });
	};

	return Cliente;
};
