export default (sequelize, DataTypes) => {
	const Sesion = sequelize.define(
		"Sesion",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			fechaHoraInicio: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
			fechaHoraFin: {
				type: DataTypes.DATE,
				allowNull: true,
			},
		},
		{
			tableName: "sesiones",
			timestamps: true,
		}
	);

	Sesion.associate = (models) => {
		Sesion.belongsTo(models.Usuario, { foreignKey: "usuarioEmail", as: "usuario", constraints: false });
	};

	return Sesion;
};
