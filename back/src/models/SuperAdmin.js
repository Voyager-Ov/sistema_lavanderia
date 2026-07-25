export default (sequelize, DataTypes) => {
	const SuperAdmin = sequelize.define(
		"SuperAdmin",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			email: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
				validate: {
					isEmail: true,
				},
			},
			passwordHash: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			nombre: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			activo: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
		},
		{
			tableName: "super_admins",
			timestamps: true,
		}
	);

	return SuperAdmin;
};
