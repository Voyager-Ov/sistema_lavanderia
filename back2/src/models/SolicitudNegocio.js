export default (sequelize, DataTypes) => {
	const SolicitudNegocio = sequelize.define(
		"SolicitudNegocio",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			nombreNegocio: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			subdominio: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			cuit: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			razonSocial: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			nombreSolicitante: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			emailSolicitante: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			telefonoSolicitante: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			passwordHash: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			estado: {
				type: DataTypes.ENUM("PENDIENTE", "APROBADO", "RECHAZADO"),
				allowNull: false,
				defaultValue: "PENDIENTE",
			},
			motivoRechazo: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			fechaRevision: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			revisadoPor: {
				type: DataTypes.STRING,
				allowNull: true,
			},
		},
		{
			tableName: "solicitudes_negocio",
			timestamps: true,
		}
	);

	return SolicitudNegocio;
};
