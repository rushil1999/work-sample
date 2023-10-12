import { FastifyServer } from '../../../interfaces/index';

export default class Routes {
  static initializeRoutes(app: FastifyServer, opts: any, done: any): void {
    app.get('/', (_req, res) => {
      res.send('Welcome to Procure - Organization API');
    });
    done();
  }
}
