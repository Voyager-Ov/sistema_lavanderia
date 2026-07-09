export default (sequelize, DataTypes) => {
    const MicroFrontend = sequelize.define("MicroFrontend", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        urlOrigen: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isUrl: true
            }
        },
        activo: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: "microfrontends",
        timestamps: true
    });

    return MicroFrontend;
};
