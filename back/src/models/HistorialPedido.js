export default (sequelize, DataTypes) => {
	const HistorialPedido = sequelize.define(
		"HistorialPedido",
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
			usuarioId: {
				type: DataTypes.INTEGER,
				allowNull: false, // Quien hizo el cambio de estado
			},
			estadoAnterior: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			estadoNuevo: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			comentario: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
		},
		{
			tableName: "historial_pedidos",
			timestamps: true,
			indexes: [
				{ fields: ["pedidoId"] },
				{ fields: ["usuarioId"] }
			]
		}
	);

	HistorialPedido.associate = (models) => {
		HistorialPedido.belongsTo(models.Pedido, { foreignKey: "pedidoId", as: "pedido" });
		HistorialPedido.belongsTo(models.Usuario, { foreignKey: "usuarioId", as: "usuario", constraints: false });
	};

	return HistorialPedido;
};
