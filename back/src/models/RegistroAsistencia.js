export default (sequelize, DataTypes) => {
	const RegistroAsistencia = sequelize.define(
		"RegistroAsistencia",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			usuarioId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			fechaHoraEntrada: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			fechaHoraSalida: {
				type: DataTypes.DATE,
				allowNull: true,
			},
		},
		{
			tableName: "registros_asistencia",
			timestamps: true,
			indexes: [
				{ fields: ["usuarioId"] }
			]
		}
	);

	RegistroAsistencia.associate = (models) => {
		RegistroAsistencia.belongsTo(models.Usuario, { foreignKey: "usuarioId", as: "empleado", constraints: false });
	};

	return RegistroAsistencia;
};
