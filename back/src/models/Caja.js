export default (sequelize, DataTypes) => {
	const Caja = sequelize.define(
		"Caja",
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
			usuarioId: {
				type: DataTypes.INTEGER,
				allowNull: false, // Cajero que abrió la caja
			},
			estado: {
				type: DataTypes.ENUM("ABIERTA", "CERRADA"),
				allowNull: false,
				defaultValue: "ABIERTA",
			},
			montoInicial: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
				defaultValue: 0,
			},
			fechaApertura: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			fechaCierre: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			// Totales calculados por el sistema al cerrar
			totalIngresosEfectivo: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: true,
			},
			totalEgresosEfectivo: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: true,
			},
			efectivoEsperado: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: true,
			},
			// Lo que el cajero declara que tiene en la mano al cerrar
			efectivoReal: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: true,
			},
			diferenciaEfectivo: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: true, // positivo = sobró plata, negativo = faltó plata
			},
            // Se pueden agregar más totales si el local registra otros medios (tarjetas, transferencias), 
            // pero el arqueo duro siempre es contra el Efectivo físico.
		},
		{
			tableName: "cajas",
			timestamps: true,
			indexes: [
				{ fields: ["negocioId"] },
				{ fields: ["usuarioId"] },
				{ fields: ["estado"] }
			]
		}
	);

	Caja.associate = (models) => {
		Caja.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
		Caja.belongsTo(models.Usuario, { foreignKey: "usuarioId", as: "cajero", constraints: false });
		Caja.hasMany(models.Pago, { foreignKey: "cajaId", as: "pagos" });
		Caja.hasMany(models.Gasto, { foreignKey: "cajaId", as: "gastos" });
	};

	return Caja;
};
