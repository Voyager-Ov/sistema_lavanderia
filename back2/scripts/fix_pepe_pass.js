import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectionManager } from "../src/models/connectionManager.js";
import { authService } from "../src/modules/auth/services/auth.service.js";

async function fixPepePassword() {
    await connectionManager.initCentral();
    const { Usuario } = connectionManager.centralModels;
    
    const email = "pepepelotudo4@gmail.com";
    const user = await Usuario.findByPk(email);
    
    if (!user) {
        console.log("❌ Usuario NO encontrado");
        process.exit(1);
    }
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("dimelo98", salt);
    
    user.password = hash;
    user.emailConfirmado = true;
    await user.save();
    
    console.log("✅ Contraseña para pepepelotudo4@gmail.com actualizada a 'dimelo98' y emailConfirmado = true");
    
    const res = await authService.login({ email, password: "dimelo98" });
    console.log("✅ RESULTADO DE LOGIN:", res);
    
    process.exit(0);
}

fixPepePassword().catch(console.error);
