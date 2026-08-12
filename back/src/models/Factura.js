export default (sequelize, DataTypes) => {
	const Factura = sequelize.define(
		"Factura",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			numeroFactura: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			fechaHoraEmision: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			tipoFactura: {
				type: DataTypes.ENUM("A", "B", "C"),
				allowNull: false,
			},
			cae: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			fechaVencimientoCae: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			ivaDiscriminadoTotal: {
				type: DataTypes.DOUBLE,
				allowNull: false,
				defaultValue: 0,
			},
			baseImponibleTotal: {
				type: DataTypes.DOUBLE,
				allowNull: false,
				defaultValue: 0,
			},
		},
		{
			tableName: "facturas",
			timestamps: true,
		}
	);

	Factura.associate = (models) => {
		Factura.belongsTo(models.Pedido, { foreignKey: "pedidoNumeroPedido", as: "pedido", constraints: false });
	};

	return Factura;
};
