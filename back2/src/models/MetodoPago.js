export default (sequelize, DataTypes) => {
	const MetodoPago = sequelize.define(
		"MetodoPago",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			nombre: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			icono: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "CreditCard",
			},
			activo: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			esFijo: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			requiereIntegracion: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
		},
		{
			tableName: "metodos_pago",
			timestamps: true,
		}
	);

	MetodoPago.associate = (models) => {
		MetodoPago.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
	};

	return MetodoPago;
};
