export default (sequelize, DataTypes) => {
	const MovimientoCaja = sequelize.define(
		"MovimientoCaja",
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
			monto: {
				type: DataTypes.DOUBLE,
				allowNull: false,
			},
			tipoMovimiento: {
				type: DataTypes.ENUM("Ingreso por Venta", "Egreso por Gasto", "Ajuste de Caja"),
				allowNull: false,
			},
			observacion: {
				type: DataTypes.STRING,
				allowNull: true,
			},
		},
		{
			tableName: "movimientos_caja",
			timestamps: true,
		}
	);

	MovimientoCaja.associate = (models) => {
		MovimientoCaja.belongsTo(models.Caja, { foreignKey: "cajaIdCaja", as: "caja", constraints: false });
	};

	return MovimientoCaja;
};
