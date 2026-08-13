export default (sequelize, DataTypes) => {
	const Pedido = sequelize.define(
		"Pedido",
		{
			numeroPedido: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			codigoSeguimiento: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			estado: {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: "PENDIENTE",
			},
			cobrado: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			total: {
				type: DataTypes.DOUBLE,
				allowNull: false,
				defaultValue: 0,
			},
			subtotal: {
				type: DataTypes.DOUBLE,
				allowNull: false,
				defaultValue: 0,
			},
			descuento: {
				type: DataTypes.DOUBLE,
				allowNull: false,
				defaultValue: 0,
			},
			costoEnvio: {
				type: DataTypes.DOUBLE,
				allowNull: false,
				defaultValue: 0,
			},
			fechaHoraCreacion: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			fechaHoraEntregaEstimada: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			fechaEntregaEstimada: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			observaciones: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			origen: {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: "MOSTRADOR",
			},
			nombreClienteFactura: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			cuitClienteFactura: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			direccionEntrega: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			ticketImpreso: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
		},
		{
			tableName: "pedidos",
			timestamps: true,
		}
	);

	Pedido.associate = (models) => {
		Pedido.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
		Pedido.belongsTo(models.Cliente, { foreignKey: "clienteId", as: "cliente", constraints: false });
		Pedido.hasMany(models.DetallePedido, { foreignKey: "pedidoNumeroPedido", as: "detalles", constraints: false });
		Pedido.hasMany(models.CambioEstadoPedido, { foreignKey: "pedidoNumeroPedido", as: "cambiosEstado", constraints: false });
		Pedido.hasMany(models.Cobro, { foreignKey: "pedidoNumeroPedido", as: "cobros", constraints: false });
		Pedido.hasOne(models.Factura, { foreignKey: "pedidoNumeroPedido", as: "factura", constraints: false });
	};

	return Pedido;
};
