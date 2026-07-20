export default (sequelize, DataTypes) => {
	const ConfiguracionNegocio = sequelize.define(
		"ConfiguracionNegocio",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			negocioId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				unique: true, // Relación 1:1
			},
			// --- Apariencia ---
			logoUrl: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			colorPrincipal: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "#4285F4",
			},
			// --- Regional ---
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
			// --- Fiscal & Ticket ---
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
			mensajeTicket: {
				type: DataTypes.TEXT,
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
			// --- Integración AFIP (ARCA) ---
			afipActivo: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			afipModoFacturacion: {
				type: DataTypes.ENUM("AUTOMATICO", "MANUAL", "DESACTIVADO"),
				allowNull: false,
				defaultValue: "AUTOMATICO",
			},
			afipPuntoVenta: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			afipCertificado: {
				type: DataTypes.TEXT, // Se guardará como Base64 / Texto plano
				allowNull: true,
			},
			afipLlavePrivada: {
				type: DataTypes.TEXT, // Se guardará encriptado
				allowNull: true,
			},
			// --- Integración WhatsApp (Baileys) ---
			whatsappActivo: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			whatsappEstadoConexion: {
				type: DataTypes.ENUM("DESCONECTADO", "ESPERANDO_QR", "CONECTADO"),
				allowNull: false,
				defaultValue: "DESCONECTADO",
			},
			whatsappMensajeListo: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: "¡Hola {{nombre}}! Tu pedido en {{negocio}} ya está LISTO PARA RETIRAR. ¡Te esperamos!",
			},
			whatsappMensajeManual: {
				type: DataTypes.TEXT,
				allowNull: true,
				defaultValue: "Hola {{nombre}}, te escribimos para informarte que tu pedido {{codigo}} se encuentra *{{estado}}*. Detalle: {{detalle}}",
			},
			// --- Integraciones (Otras) ---
			mercadopagoAccessToken: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			mpModoCobro: {
				type: DataTypes.ENUM("AUTOMATICO", "MANUAL", "DESACTIVADO"),
				allowNull: false,
				defaultValue: "AUTOMATICO",
			},
			mercadopagoPublicKey: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			aliasMp: {
				type: DataTypes.STRING,
				allowNull: true,
			}
		},
		{
			tableName: "configuraciones_negocio",
			timestamps: true,
		}
	);

	ConfiguracionNegocio.associate = (models) => {
		ConfiguracionNegocio.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false });
	};

	return ConfiguracionNegocio;
};
