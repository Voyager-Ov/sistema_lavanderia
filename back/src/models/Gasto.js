export default (sequelize, DataTypes) => {
	const Gasto = sequelize.define(
		"Gasto",
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
			monto: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			},
			fecha: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			categoria: {
				type: DataTypes.STRING, 
				allowNull: false,
			},
			cajaId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			descripcion: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			registradoPorId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			metodoPagoId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			}
		},
		{
			tableName: "gastos",
			timestamps: true,
			indexes: [
				{ fields: ["negocioId"] },
				{ fields: ["cajaId"] },
				{ fields: ["metodoPagoId"] }
			]
		}
	);

	Gasto.associate = (models) => {
		Gasto.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
		Gasto.belongsTo(models.Usuario, { foreignKey: "registradoPorId", as: "registradoPor", constraints: false });
		Gasto.belongsTo(models.Caja, { foreignKey: "cajaId", as: "caja" });
		Gasto.belongsTo(models.MetodoPago, { foreignKey: "metodoPagoId", as: "metodoPago" });
	};

	return Gasto;
};
