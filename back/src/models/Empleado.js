export default (sequelize, DataTypes) => {
	const Empleado = sequelize.define(
		"Empleado",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			legajo: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			nombre: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			apellido: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			telefono: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			fechaAlta: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
			},
		},
		{
			tableName: "empleados",
			timestamps: true,
		}
	);

	Empleado.associate = (models) => {
		Empleado.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
		Empleado.hasOne(models.Usuario, { foreignKey: "empleadoId", as: "usuario", constraints: false });
		Empleado.hasMany(models.Caja, { foreignKey: "empleadoId", as: "cajas", constraints: false });
	};

	return Empleado;
};
