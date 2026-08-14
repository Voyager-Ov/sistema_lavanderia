export default (sequelize, DataTypes) => {
	const Rol = sequelize.define(
		"Rol",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			nombre: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
			descripcion: {
				type: DataTypes.STRING,
				allowNull: true,
			},
		},
		{
			tableName: "roles",
			timestamps: true,
		}
	);

	Rol.associate = (models) => {
		Rol.belongsToMany(models.Usuario, { through: "UsuarioRoles", foreignKey: "rolId", otherKey: "usuarioEmail", as: "Usuarios", constraints: false });
	};

	return Rol;
};
