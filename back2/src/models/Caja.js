export default (sequelize, DataTypes) => {
	const Caja = sequelize.define(
		"Caja",
		{
			idCaja: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			fechaHoraApertura: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			fechaHoraCierre: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			montoInicialEfectivo: {
				type: DataTypes.DOUBLE,
				allowNull: false,
				defaultValue: 0,
			},
			montoFinalEfectivoReal: {
				type: DataTypes.DOUBLE,
				allowNull: true,
			},
			observacionApertura: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			observacionCierre: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			estadoCaja: {
				type: DataTypes.ENUM("Abierta", "Cerrada"),
				allowNull: false,
				defaultValue: "Abierta",
			},
			abierta: {
				type: DataTypes.VIRTUAL,
				get() {
					return this.estadoCaja === "Abierta";
				},
				set(val) {
					this.setDataValue("estadoCaja", val ? "Abierta" : "Cerrada");
				}
			},
		},
		{
			tableName: "cajas",
			timestamps: true,
		}
	);

	Caja.associate = (models) => {
		Caja.belongsTo(models.Empleado, { foreignKey: "empleadoId", as: "empleado", constraints: false });
		Caja.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
		Caja.hasMany(models.MovimientoCaja, { foreignKey: "cajaIdCaja", as: "movimientos", constraints: false });
	};

	return Caja;
};
