export default (sequelize, DataTypes) => {
	const CreditoCliente = sequelize.define(
		"CreditoCliente",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			negocioId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			clienteId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			pedidoOrigenId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			montoOriginal: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			},
			montoDisponible: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			},
			tipoOrigen: {
				type: DataTypes.ENUM("SOBREPAGO_EFECTIVO", "CANCELACION_PEDIDO", "AJUSTE_MANUAL"),
				allowNull: false,
			},
			estado: {
				type: DataTypes.ENUM("DISPONIBLE", "CONSUMIDO_PARCIAL", "CONSUMIDO_TOTAL", "ANULADO"),
				allowNull: false,
				defaultValue: "DISPONIBLE",
			},
			motivo: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			creadoPorId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
		},
		{
			tableName: "creditos_cliente",
			timestamps: true,
			indexes: [
				{ fields: ["negocioId"] },
				{ fields: ["clienteId"] },
				{ fields: ["pedidoOrigenId"] },
				{ fields: ["estado"] },
				{ fields: ["negocioId", "clienteId", "estado"] },
			],
		}
	);

	CreditoCliente.associate = (models) => {
		CreditoCliente.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
		CreditoCliente.belongsTo(models.Cliente, { foreignKey: "clienteId", as: "cliente" });
		CreditoCliente.belongsTo(models.Pedido, { foreignKey: "pedidoOrigenId", as: "pedidoOrigen" });
		CreditoCliente.belongsTo(models.Usuario, { foreignKey: "creadoPorId", as: "creador", constraints: false });
		CreditoCliente.hasMany(models.AplicacionCredito, { foreignKey: "creditoId", as: "aplicaciones" });
	};

	return CreditoCliente;
};
