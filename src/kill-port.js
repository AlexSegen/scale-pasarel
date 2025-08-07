import { exec } from "child_process";
import consola from "consola";
import { CONFIG } from "./config.js";

const KillPort = async (port) => {

    const response = await consola.prompt("Kill port?", {
        type: "confirm",
      });

    if (!response) {
        consola.info("Port not killed");
        return;
    }

    consola.start(`Killing port ${port}`);

    exec(`C:\\handle.exe -a ${port}`, (err, stdout) => {
        if (err) {
          consola.error(`Error ejecutando Handle: ${err.message}`);
        }
    
        const pidMatch = stdout.match(/pid: (\d+)/);
        if (pidMatch) {
          const pid = pidMatch[1];
          exec(`taskkill /PID ${pid} /F`, (killErr) => {
            if (killErr) {
              consola.error(`No se pudo finalizar el proceso: ${killErr.message}`);
            }
            consola.success(`Proceso ${pid} terminado y ${port} liberado.`);
          });
        } else {
          consola.warn(`Ningún proceso bloquea ${port}.`);
        }
      });

/*     exec(
        `powershell "Get-WmiObject Win32_SerialPort -Filter \\"DeviceID=\'${port}\'\\" | Select-Object DeviceID, Description"`,
        (error, stdout) => {
        if (error) {
            consola.error(`Error al ejecutar PowerShell: ${error.message}`);
        }

        if (stdout.trim()) {
            console.log(stdout);
            consola.info(`${port} está ocupado:\n${stdout}`);
        } else {
            consola.warn(`${port} no está siendo detectado por WMI.`);
        }
        }
    ); */
};

KillPort(CONFIG.SERIAL_PORT_NAME);
