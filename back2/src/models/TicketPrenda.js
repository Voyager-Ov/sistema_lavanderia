export default (sequelize, DataTypes) => {
	const TicketPrenda = sequelize.define(
		"TicketPrenda",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			codigo: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
			pedidoNumeroPedido: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
		},
		{
			tableName: "tickets_prenda",
			timestamps: true,
		}
	);

	TicketPrenda.associate = (models) => {
		TicketPrenda.belongsTo(models.Pedido, { foreignKey: "pedidoNumeroPedido", as: "pedido", constraints: false });
	};

	return TicketPrenda;
};
