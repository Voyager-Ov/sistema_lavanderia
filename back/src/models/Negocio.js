export default (sequelize, DataTypes) => {
	const Negocio = sequelize.define(
		"Negocio",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			nombre: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			cuit: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			estadoSuscripcion: {
				type: DataTypes.ENUM("ACTIVA", "VENCIDA", "PRUEBA", "CANCELADA"),
				allowNull: false,
				defaultValue: "PRUEBA",
			},
			fechaVencimientoSuscripcion: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			activo: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
		},
		{
			tableName: "negocios",
			timestamps: true,
		}
	);

	Negocio.associate = (models) => {
		Negocio.hasMany(models.Usuario, { foreignKey: "negocioId", as: "usuarios", constraints: false });
		Negocio.hasMany(models.Cliente, { foreignKey: "negocioId", as: "clientes", constraints: false });
		Negocio.hasMany(models.Producto, { foreignKey: "negocioId", as: "productos", constraints: false });
		Negocio.hasMany(models.Pedido, { foreignKey: "negocioId", as: "pedidos", constraints: false });
		Negocio.hasMany(models.MetodoPago, { foreignKey: "negocioId", as: "metodosPago", constraints: false });
		Negocio.hasMany(models.CategoriaProducto, { foreignKey: "negocioId", as: "categoriasProducto", constraints: false });
		Negocio.hasMany(models.Caja, { foreignKey: "negocioId", as: "cajas", constraints: false });
		Negocio.hasOne(models.ConfiguracionNegocio, { foreignKey: "negocioId", as: "configuracion", constraints: false });
	};

	return Negocio;
};
