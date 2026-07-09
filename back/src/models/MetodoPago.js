export default (sequelize, DataTypes) => {
	const MetodoPago = sequelize.define(
		"MetodoPago",
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
			nombre: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			esFijo: {
				// Para indicar que "Efectivo" no se puede borrar
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			activo: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
		},
		{
			tableName: "metodos_pago",
			timestamps: true,
			indexes: [
				{ fields: ["negocioId"] }
			]
		}
	);

	MetodoPago.associate = (models) => {
		MetodoPago.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
		MetodoPago.hasMany(models.Pago, { foreignKey: "metodoPagoId", as: "pagos" });
	};

	return MetodoPago;
};
