export default (sequelize, DataTypes) => {
	const Pedido = sequelize.define(
		"Pedido",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			codigoSeguimiento: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
			negocioId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			clienteId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			estado: {
				type: DataTypes.ENUM("PENDIENTE", "EN_PROCESO", "LISTO_PARA_RETIRAR", "ENTREGADO", "CANCELADO"),
				allowNull: false,
				defaultValue: "PENDIENTE",
			},
			total: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
				defaultValue: 0,
			},
			cobrado: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			fechaRecepcion: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			fechaEntregaEstimada: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			fechaEntregadoReal: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			notas: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			creadoPorId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			motivoCancelacion: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			descripcionCancelacion: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			facturado: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			facturaCae: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			facturaVtoCae: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			facturaNro: {
				type: DataTypes.STRING,
				allowNull: true,
			},
		},
		{
			tableName: "pedidos",
			timestamps: true,
			indexes: [
				{ fields: ["negocioId"] },
				{ fields: ["clienteId"] },
				{ fields: ["estado"] },
				{ fields: ["codigoSeguimiento"] }
			]
		}
	);

	Pedido.associate = (models) => {
		Pedido.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
		Pedido.belongsTo(models.Cliente, { foreignKey: "clienteId", as: "cliente" });
		Pedido.belongsTo(models.Usuario, { foreignKey: "creadoPorId", as: "creador", constraints: false });
		Pedido.hasMany(models.PedidoItem, { foreignKey: "pedidoId", as: "items" });
		Pedido.hasMany(models.HistorialPedido, { foreignKey: "pedidoId", as: "historial" });
		Pedido.hasOne(models.Pago, { foreignKey: "pedidoId", as: "pago" });
		Pedido.hasMany(models.Ticket, { foreignKey: "pedidoId", as: "tickets" });
	};

	return Pedido;
};
