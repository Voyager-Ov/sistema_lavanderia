export default (sequelize, DataTypes) => {
	const Estado = sequelize.define(
		"Estado",
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
			descripcion: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			ambito: {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: "Pedido",
			},
		},
		{
			tableName: "estados",
			timestamps: true,
		}
	);

	return Estado;
};
