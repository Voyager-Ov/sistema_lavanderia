export default (sequelize, DataTypes) => {
	const Cobro = sequelize.define(
		"Cobro",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			fechaHora: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			montoAbonado: {
				type: DataTypes.DOUBLE,
				allowNull: false,
			},
			montoRecibidoEfectivo: {
				type: DataTypes.DOUBLE,
				allowNull: true,
			},
			vueltoEntregado: {
				type: DataTypes.DOUBLE,
				allowNull: true,
			},
			movimientoCajaId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			metodoPagoId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			pedidoNumeroPedido: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
		},
		{
			tableName: "cobros",
			timestamps: true,
		}
	);

	Cobro.associate = (models) => {
		Cobro.belongsTo(models.Pedido, { foreignKey: "pedidoNumeroPedido", as: "pedido", constraints: false });
		Cobro.belongsTo(models.MetodoPago, { foreignKey: "metodoPagoId", as: "metodoPago", constraints: false });
		Cobro.belongsTo(models.MovimientoCaja, { foreignKey: "movimientoCajaId", as: "movimientoCaja", constraints: false });
	};

	return Cobro;
};
