import crypto from 'crypto';

export default (sequelize, DataTypes) => {
	const Ticket = sequelize.define(
		"Ticket",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			pedidoId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			codigo: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
		},
		{
			tableName: "tickets",
			timestamps: true,
			indexes: [
				{ fields: ["pedidoId"] },
				{ fields: ["codigo"] }
			]
		}
	);

	Ticket.beforeValidate((ticket, options) => {
		if (!ticket.codigo) {
			// Generate a random short UUID or use a substring of UUID
			ticket.codigo = crypto.randomUUID().substring(0, 8).toUpperCase();
		}
	});

	Ticket.associate = (models) => {
		Ticket.belongsTo(models.Pedido, { foreignKey: "pedidoId", as: "pedido" });
	};

	return Ticket;
};
