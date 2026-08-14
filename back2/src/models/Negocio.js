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
				allowNull: true,
			},
			subdominio: {
				type: DataTypes.STRING,
				allowNull: true,
				unique: true,
			},
			activo: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			estadoSuscripcion: {
				type: DataTypes.ENUM("PRUEBA", "ACTIVA", "SUSPENDIDA", "CANCELADA"),
				allowNull: false,
				defaultValue: "PRUEBA",
			},
			razonSocial: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			cuit: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			direccion: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			telefonoContacto: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			colorPrincipal: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "#2563eb",
			},
			colorSecundario: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "#1e40af",
			},
			logoUrl: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			simboloMoneda: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "$",
			},
			zonaHoraria: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "America/Argentina/Buenos_Aires",
			},
			mensajeTicket: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			imprimirTicketAutomatico: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			mostrarQrTicket: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			facturacionHabilitada: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			afipActivo: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			afipModoFacturacion: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "DESACTIVADO",
			},
			afipPuntoVenta: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			certificadoAfipPath: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			llaveAfipPath: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			whatsappActivo: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			whatsappEstadoConexion: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "DESCONECTADO",
			},
			whatsappMensajeListo: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			whatsappMensajeManual: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			tokenMercadoPago: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			mercadopagoPublicKey: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			mpModoCobro: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "DIRECTO",
			},
			aliasMp: {
				type: DataTypes.STRING,
				allowNull: true,
			},
		},
		{
			tableName: "negocios",
			timestamps: true,
		}
	);

	Negocio.associate = (models) => {
		if (models.Cliente) Negocio.hasMany(models.Cliente, { foreignKey: "negocioId", as: "clientes", constraints: false });
		if (models.Empleado) Negocio.hasMany(models.Empleado, { foreignKey: "negocioId", as: "empleados", constraints: false });
		if (models.Servicio) Negocio.hasMany(models.Servicio, { foreignKey: "negocioId", as: "servicios", constraints: false });
		if (models.Caja) Negocio.hasMany(models.Caja, { foreignKey: "negocioId", as: "cajas", constraints: false });
		if (models.Pedido) Negocio.hasMany(models.Pedido, { foreignKey: "negocioId", as: "pedidos", constraints: false });
		if (models.Gasto) Negocio.hasMany(models.Gasto, { foreignKey: "negocioId", as: "gastos", constraints: false });
	};

	return Negocio;
};
