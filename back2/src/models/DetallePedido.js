export default (sequelize, DataTypes) => {
	const DetallePedido = sequelize.define(
		"DetallePedido",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			cantidad: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 1,
			},
			precioHistorico: {
				type: DataTypes.DOUBLE,
				allowNull: false,
			},
			servicioId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
		},
		{
			tableName: "detalles_pedido",
			timestamps: true,
		}
	);

	DetallePedido.associate = (models) => {
		DetallePedido.belongsTo(models.Pedido, { foreignKey: "pedidoNumeroPedido", as: "pedido", constraints: false });
		DetallePedido.belongsTo(models.Servicio, { foreignKey: "servicioId", as: "servicio", constraints: false });
	};

	return DetallePedido;
};
