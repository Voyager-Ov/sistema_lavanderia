export default (sequelize, DataTypes) => {
	const MovimientoCuentaCorriente = sequelize.define(
		"MovimientoCuentaCorriente",
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			clienteId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			negocioId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			pedidoId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			tipoMovimiento: {
				type: DataTypes.ENUM("DEBITO", "CREDITO"),
				allowNull: false,
			},
			monto: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			},
			saldoResultante: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			},
			comentario: {
				type: DataTypes.STRING,
				allowNull: true,
			},
		},
		{
			tableName: "movimientos_cuenta_corriente",
			timestamps: true,
			indexes: [
				{ fields: ["clienteId"] },
				{ fields: ["negocioId"] },
				{ fields: ["pedidoId"] },
			],
		}
	);

	MovimientoCuentaCorriente.associate = (models) => {
		MovimientoCuentaCorriente.belongsTo(models.Cliente, { foreignKey: "clienteId", as: "cliente" });
		MovimientoCuentaCorriente.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
		MovimientoCuentaCorriente.belongsTo(models.Pedido, { foreignKey: "pedidoId", as: "pedido" });
	};

	return MovimientoCuentaCorriente;
};
