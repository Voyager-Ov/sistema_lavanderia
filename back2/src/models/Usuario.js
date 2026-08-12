export default (sequelize, DataTypes) => {
	const Usuario = sequelize.define(
		"Usuario",
		{
			email: {
				type: DataTypes.STRING,
				allowNull: false,
				primaryKey: true,
				validate: {
					isEmail: true,
				},
			},
			password: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			googleId: {
				type: DataTypes.STRING,
				allowNull: true,
				unique: true,
			},
			tokenConfirmacion: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			tokenConfirmacionExpires: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			emailConfirmado: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			activo: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			empleadoId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
		},
		{
			tableName: "usuarios",
			timestamps: true,
			indexes: [
				{ fields: ["email"], unique: true },
				{ fields: ["activo"] }
			]
		}
	);

	Usuario.associate = (models) => {
		Usuario.belongsTo(models.Empleado, { foreignKey: "empleadoId", as: "personaFisica", constraints: false });
		Usuario.belongsToMany(models.Rol, { through: "UsuarioRoles", foreignKey: "usuarioEmail", otherKey: "rolId", constraints: false });
		Usuario.hasMany(models.Sesion, { foreignKey: "usuarioEmail", as: "sesiones", constraints: false });
	};

	return Usuario;
};


