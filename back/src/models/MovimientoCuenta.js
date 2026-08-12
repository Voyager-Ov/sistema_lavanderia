export default (sequelize, DataTypes) => {
	const MovimientoCuenta = sequelize.define(
		"MovimientoCuenta",
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
				type: DataTypes.ENUM("Crédito", "Débito"),
				allowNull: false,
			},
			descripcion: {
				type: DataTypes.STRING,
				allowNull: true,
			},
		},
		{
			tableName: "movimientos_cuenta",
			timestamps: true,
		}
	);

	MovimientoCuenta.associate = (models) => {
		MovimientoCuenta.belongsTo(models.CuentaCorriente, { foreignKey: "cuentaCorrienteId", as: "cuentaCorriente", constraints: false });
	};

	return MovimientoCuenta;
};
