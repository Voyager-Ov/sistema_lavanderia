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
				allowNull: true,
			},
			nombre: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			apellido: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			email: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			telefono: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			rol: {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: "empleado",
			},
			activo: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			sueldoBase: {
				type: DataTypes.DOUBLE,
				allowNull: true,
				defaultValue: 0,
			},
			horasSemanalesObjetivo: {
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: 40,
			},
			usuarioIdCentral: {
				type: DataTypes.INTEGER,
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
