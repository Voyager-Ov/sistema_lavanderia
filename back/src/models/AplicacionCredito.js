export default (sequelize, DataTypes) => {
	const AplicacionCredito = sequelize.define(
		"AplicacionCredito",
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
			creditoId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			pagoDestinoId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			pedidoDestinoId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			montoAplicado: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			},
		},
		{
			tableName: "aplicaciones_credito",
			timestamps: true,
			updatedAt: false, // Inmutable: solo createdAt
			indexes: [
				{ fields: ["negocioId"] },
				{ fields: ["creditoId"] },
				{ fields: ["pagoDestinoId"] },
				{ fields: ["pedidoDestinoId"] },
				{ fields: ["negocioId", "creditoId"] },
			],
		}
	);

	AplicacionCredito.associate = (models) => {
		AplicacionCredito.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
		AplicacionCredito.belongsTo(models.CreditoCliente, { foreignKey: "creditoId", as: "credito" });
		AplicacionCredito.belongsTo(models.Pago, { foreignKey: "pagoDestinoId", as: "pagoDestino" });
		AplicacionCredito.belongsTo(models.Pedido, { foreignKey: "pedidoDestinoId", as: "pedidoDestino" });
	};

	return AplicacionCredito;
};
