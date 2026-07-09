export default (sequelize, DataTypes) => {
	const Usuario = sequelize.define(
		"Usuario",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			negocioId: {
				type: DataTypes.INTEGER,
				allowNull: true, // true para que SUPERADMIN no requiera negocio
			},
			nombre: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			email: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
				validate: {
					isEmail: true,
				},
			},
			googleId: {
				type: DataTypes.STRING,
				allowNull: true,
				unique: true,
			},
			passwordHash: {
				type: DataTypes.STRING,
				allowNull: true, // It can be null if registered via Google exclusively
			},
			rol: {
				type: DataTypes.ENUM("ADMIN", "EMPLEADO", "SUPERADMIN"),
				allowNull: false,
			},
			sueldoBase: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: true,
				defaultValue: 0,
			},
			horasSemanalesObjetivo: {
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: 40,
			},
			activo: {
				type: DataTypes.BOOLEAN,
				defaultValue: true,
			},
			emailVerificado: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
			verificationCode: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			verificationExpires: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			resetPasswordToken: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			resetPasswordExpires: {
				type: DataTypes.DATE,
				allowNull: true,
			}
		},
		{
			tableName: "usuarios",
			timestamps: true,
			indexes: [
				{ fields: ["negocioId"] },
				{ fields: ["email"], unique: true },
				{ fields: ["activo"] }
			]
		}
	);

	Usuario.associate = (models) => {
		Usuario.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
		Usuario.hasMany(models.Pago, { foreignKey: "registradoPorId", as: "pagosRegistrados", constraints: false });
		Usuario.hasMany(models.HistorialPedido, { foreignKey: "usuarioId", as: "accionesEnPedidos", constraints: false });
		Usuario.hasMany(models.Caja, { foreignKey: "usuarioId", as: "cajasOperadas", constraints: false });
		Usuario.hasMany(models.Gasto, { foreignKey: "registradoPorId", as: "gastosRegistrados", constraints: false });
		Usuario.hasMany(models.Pedido, { foreignKey: "creadoPorId", as: "pedidosCreados", constraints: false });
		Usuario.hasMany(models.RegistroAsistencia, { foreignKey: "usuarioId", as: "asistencias", constraints: false });
	};

	return Usuario;
};
