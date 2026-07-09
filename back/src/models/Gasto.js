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
				type: DataTypes.ENUM("Insumos", "Nomina", "Servicios", "Alquiler", "Caja_Diaria", "Otros"), 
				allowNull: false,
			},
			cajaId: {
				type: DataTypes.INTEGER,
				allowNull: true, // Opcional: permite gastos generales del negocio que no salen de la caja del mostrador
			},
			descripcion: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			registradoPorId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
		},
		{
			tableName: "gastos",
			timestamps: true,
			indexes: [
				{ fields: ["negocioId"] },
				{ fields: ["cajaId"] }
			]
		}
	);

	Gasto.associate = (models) => {
		Gasto.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
		Gasto.belongsTo(models.Usuario, { foreignKey: "registradoPorId", as: "registradoPor", constraints: false });
		Gasto.belongsTo(models.Caja, { foreignKey: "cajaId", as: "caja" });
	};

	return Gasto;
};
