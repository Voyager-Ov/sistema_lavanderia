export default (sequelize, DataTypes) => {
	const Cliente = sequelize.define(
		"Cliente",
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
			apellido: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "",
			},
			telefono: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			email: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			direccion: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			fechaAlta: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			negocioId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 1,
			}
		},
		{
			tableName: "clientes",
			timestamps: true,
		}
	);

	Cliente.associate = (models) => {
		Cliente.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
		Cliente.hasOne(models.CuentaCorriente, { foreignKey: "clienteId", as: "cuentaCorriente", constraints: false });
		Cliente.hasMany(models.Pedido, { foreignKey: "clienteId", as: "pedidos", constraints: false });
	};

	return Cliente;
};
