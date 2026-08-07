export default (sequelize, DataTypes) => {
	const MotivoCancelacion = sequelize.define(
		"MotivoCancelacion",
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
			motivo: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			activo: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			}
		},
		{
			tableName: "motivos_cancelacion",
			timestamps: true,
		}
	);

	return MotivoCancelacion;
};
