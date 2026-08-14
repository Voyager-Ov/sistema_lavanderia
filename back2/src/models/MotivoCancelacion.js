export default (sequelize, DataTypes) => {
	const MotivoCancelacion = sequelize.define(
		"MotivoCancelacion",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			motivo: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			descripcion: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			esFijo: {
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
			tableName: "motivos_cancelacion",
			timestamps: true,
		}
	);

	MotivoCancelacion.associate = (models) => {
		MotivoCancelacion.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
	};

	return MotivoCancelacion;
};
