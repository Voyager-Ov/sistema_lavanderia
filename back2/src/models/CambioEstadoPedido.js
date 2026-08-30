export default (sequelize, DataTypes) => {
	const CambioEstadoPedido = sequelize.define(
		"CambioEstadoPedido",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			fechaHoraInicio: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			fechaHoraFin: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			estadoId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			pedidoNumeroPedido: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
		},
		{
			tableName: "cambios_estado_pedido",
			timestamps: true,
		}
	);

	CambioEstadoPedido.associate = (models) => {
		CambioEstadoPedido.belongsTo(models.Pedido, { foreignKey: "pedidoNumeroPedido", as: "pedido", constraints: false });
		CambioEstadoPedido.belongsTo(models.Estado, { foreignKey: "estadoId", as: "estado", constraints: false });
	};

	return CambioEstadoPedido;
};
