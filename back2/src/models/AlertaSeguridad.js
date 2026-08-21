export default (sequelize, DataTypes) => {
	const AlertaSeguridad = sequelize.define(
		"AlertaSeguridad",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			usuarioEmail: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			rol: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			endpoint: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			metodo: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			ip: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			userAgent: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			negocioId: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			nivel: {
				type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
				allowNull: false,
				defaultValue: "HIGH",
			},
			detalles: {
				type: DataTypes.TEXT,
				allowNull: true,
			}
		},
		{
			tableName: "alertas_seguridad",
			timestamps: true,
		}
	);

	return AlertaSeguridad;
};
