import { CONFIG } from "./config.js";
import { ApplicationService } from "./services/ApplicationService.js";
import { logger } from "./services/LoggerService.js";
import { downloadWSDL } from "./modules/index.js";

class Application {
  constructor() {
    this.applicationService = null;
  }

  async initialize() {
    try {
      // Set up logging level based on environment
      if (CONFIG.isDev) {
        logger.setLevel('DEBUG');
      }

      logger.info('Initializing Scale Pasarel Application', 'Application');
      
      // Download WSDL in production mode
      if (!CONFIG.isDev) {
        try {
          await downloadWSDL();
          logger.info('WSDL downloaded successfully', 'Application');
        } catch (error) {
          logger.warn('Failed to download WSDL, will use local file', 'Application');
        }
      }

      // Create and start application service
      this.applicationService = new ApplicationService(CONFIG);
      await this.applicationService.start();
      
      logger.info('Scale Pasarel Application running successfully', 'Application');
    } catch (error) {
      logger.error('Failed to initialize application', error, 'Application');
      process.exit(1);
    }
  }

  async shutdown() {
    if (this.applicationService) {
      await this.applicationService.gracefulShutdown('APPLICATION_SHUTDOWN');
    }
  }
}

// Application entry point
const app = new Application();
app.initialize().catch((error) => {
  console.error('Fatal error during application startup:', error);
  process.exit(1);
});

// Export for testing or external usage
export { Application };
