export default (sequelize, DataTypes) => {
	const MensajeSistema = sequelize.define(
		"MensajeSistema",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			titulo: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			contenido: {
				type: DataTypes.TEXT,
				allowNull: false,
			},
			tipo: {
				type: DataTypes.ENUM("INFO", "WARNING", "URGENT", "MAINTENANCE"),
				allowNull: false,
				defaultValue: "INFO",
			},
			negocioId: {
				type: DataTypes.INTEGER,
				allowNull: true, // null indica broadcast global a todos los negocios
			},
			fechaInicio: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			fechaFin: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			activo: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			creadoPor: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "SUPER_ADMIN",
			}
		},
		{
			tableName: "mensajes_sistema",
			timestamps: true,
		}
	);

	MensajeSistema.associate = (models) => {
		if (models.Negocio) {
			MensajeSistema.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
		}
	};

	return MensajeSistema;
};
