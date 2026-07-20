export default (sequelize, DataTypes) => {
	const Pago = sequelize.define(
		"Pago",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			pedidoId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				unique: true, // 1 pedido = 1 pago por simplicidad inicial
			},
			registradoPorId: {
				type: DataTypes.INTEGER,
				allowNull: false, // El empleado que cobró
			},
			metodoPagoId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			monto: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			},
			montoAFavorGenerado: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
				defaultValue: 0,
			},
			saldoAFavorDisponible: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
				defaultValue: 0,
			},
			cajaId: {
				type: DataTypes.INTEGER,
				allowNull: false, // Todo cobro entra en la caja actual del usuario
			},
			estado: {
				type: DataTypes.ENUM("COMPLETADO", "ANULADO"),
				allowNull: false,
				defaultValue: "COMPLETADO",
			},
			// --- Facturación AFIP (ARCA) ---
			cae: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			vencimientoCae: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			nroComprobante: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			tipoComprobante: {
				type: DataTypes.INTEGER, // Ej: 11 (Factura C)
				allowNull: true,
			},
			fechaPago: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
		},
		{
			tableName: "pagos",
			timestamps: true,
			indexes: [
				{ fields: ["cajaId"] },
				{ fields: ["pedidoId"] }
			]
		}
	);

	Pago.associate = (models) => {
		Pago.belongsTo(models.Pedido, { foreignKey: "pedidoId", as: "pedido" });
		Pago.belongsTo(models.Usuario, { foreignKey: "registradoPorId", as: "registradoPor", constraints: false });
		Pago.belongsTo(models.MetodoPago, { foreignKey: "metodoPagoId", as: "metodoPago" });
		Pago.belongsTo(models.Caja, { foreignKey: "cajaId", as: "caja" });
	};

	return Pago;
};
