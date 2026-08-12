export default (sequelize, DataTypes) => {
	const Gasto = sequelize.define(
		"Gasto",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			fechaHora: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			descripcion: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			montoTotal: {
				type: DataTypes.DOUBLE,
				allowNull: false,
			},
			proveedor: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			nroComprobante: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			desgloseNeto: {
				type: DataTypes.DOUBLE,
				allowNull: false,
				defaultValue: 0,
			},
			impuestos: {
				type: DataTypes.DOUBLE,
				allowNull: false,
				defaultValue: 0,
			},
			percepciones: {
				type: DataTypes.DOUBLE,
				allowNull: false,
				defaultValue: 0,
			},
			estadoGasto: {
				type: DataTypes.ENUM("Pagado", "Pendiente", "Vencido", "Anulado"),
				allowNull: false,
				defaultValue: "Pendiente",
			},
		},
		{
			tableName: "gastos",
			timestamps: true,
		}
	);

	Gasto.associate = (models) => {
		Gasto.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
		Gasto.belongsTo(models.CategoriaGasto, { foreignKey: "categoriaGastoId", as: "categoria", constraints: false });
		Gasto.belongsTo(models.MetodoPago, { foreignKey: "metodoPagoId", as: "metodoPago", constraints: false });
		Gasto.belongsTo(models.MovimientoCaja, { foreignKey: "movimientoCajaId", as: "movimientoCaja", constraints: false });
	};

	return Gasto;
};
