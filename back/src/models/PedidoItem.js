export default (sequelize, DataTypes) => {
	const PedidoItem = sequelize.define(
		"PedidoItem",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			pedidoId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			productoId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			cantidad: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 1,
			},
			precioUnitario: {
				// Guardamos el precio en el momento en que se hace el pedido (snapshot)
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			},
			subtotal: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			},
			estado: {
				type: DataTypes.ENUM("ACTIVO", "CANCELADO"),
				allowNull: false,
				defaultValue: "ACTIVO",
			},
			motivoCancelacion: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
		},
		{
			tableName: "pedido_items",
			timestamps: true,
			indexes: [
				{ fields: ["pedidoId"] },
				{ fields: ["productoId"] }
			]
		}
	);

	PedidoItem.associate = (models) => {
		PedidoItem.belongsTo(models.Pedido, { foreignKey: "pedidoId", as: "pedido" });
		PedidoItem.belongsTo(models.Producto, { foreignKey: "productoId", as: "producto" });
	};

	return PedidoItem;
};
