export default (sequelize, DataTypes) => {
	const CuentaCorriente = sequelize.define(
		"CuentaCorriente",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			saldo: {
				type: DataTypes.DOUBLE,
				allowNull: false,
				defaultValue: 0,
			},
			fechaCreacion: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
		},
		{
			tableName: "cuentas_corrientes",
			timestamps: true,
		}
	);

	CuentaCorriente.associate = (models) => {
		CuentaCorriente.belongsTo(models.Cliente, { foreignKey: "clienteId", as: "cliente", constraints: false });
		CuentaCorriente.hasMany(models.MovimientoCuenta, { foreignKey: "cuentaCorrienteId", as: "movimientos", constraints: false });
	};

	return CuentaCorriente;
};
